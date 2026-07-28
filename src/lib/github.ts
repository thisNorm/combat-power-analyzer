import { z } from 'zod';

import type { GithubStats, LanguageUsage, PublicMetric, SourceEvidence } from '../types/analysis';

const GitHubUserSchema = z.object({
  public_repos: z.number().int().nonnegative(),
  followers: z.number().int().nonnegative(),
  following: z.number().int().nonnegative(),
  public_gists: z.number().int().nonnegative(),
});

const GitHubRepositoriesSchema = z.array(z.object({ language: z.string().nullable() }));
const GITHUB_API = 'https://api.github.com';
const REQUEST_TIMEOUT_MS = 10_000;

function sourceEvidence(sourceKey: string, sourceUrl: string, status: SourceEvidence['status'], detail: string): SourceEvidence {
  return { sourceKey, sourceUrl, status, detail };
}

function stableFingerprint(value: string): string {
  let hash = 2_166_136_261;
  for (const character of value) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16_777_619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function buildMetric(key: string, value: number, evidence: SourceEvidence): PublicMetric {
  return { key, value, evidence };
}

function languageUsage(repositories: readonly { readonly language: string | null }[], evidence: SourceEvidence): readonly LanguageUsage[] {
  const counts = new Map<string, number>();
  for (const repository of repositories) {
    if (repository.language !== null) {
      counts.set(repository.language, (counts.get(repository.language) ?? 0) + 1);
    }
  }

  const classifiedRepositoryCount = [...counts.values()].reduce((total, count) => total + count, 0);
  return [...counts.entries()]
    .sort(([leftLanguage, leftCount], [rightLanguage, rightCount]) => rightCount - leftCount || leftLanguage.localeCompare(rightLanguage))
    .map(([language, repositoryCount]) => ({
      language,
      repositoryCount,
      ratio: classifiedRepositoryCount === 0 ? 0 : Number(((repositoryCount / classifiedRepositoryCount) * 100).toFixed(2)),
      evidence,
    }));
}

function unavailableStats(githubId: string, detail: string): GithubStats {
  const unavailableEvidence = sourceEvidence('github.public-profile', `${GITHUB_API}/users/${encodeURIComponent(githubId)}`, 'unavailable', detail);
  const unavailableMetric = (key: string): PublicMetric => ({ key, value: null, evidence: unavailableEvidence });

  return {
    githubId,
    fingerprint: stableFingerprint(`${githubId}:unavailable`),
    collectionState: 'insufficient',
    repoCount: unavailableMetric('repositoryCount'),
    followers: unavailableMetric('followers'),
    publicMetrics: [unavailableMetric('following'), unavailableMetric('publicGists')],
    languageUsage: [],
    estimatedCommitCount: {
      value: null,
      formula: 'unavailable: public user and repository endpoints do not expose total commit counts',
      evidence: unavailableEvidence,
    },
    evidence: [unavailableEvidence],
  };
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`GitHub public API returned ${response.status}`);
  }
  return response.json();
}

export async function fetchGithubStats(githubId: string): Promise<GithubStats> {
  const normalizedGithubId = githubId.trim();
  const userUrl = `${GITHUB_API}/users/${encodeURIComponent(normalizedGithubId)}`;
  const repositoriesUrl = `${userUrl}/repos?per_page=100&sort=updated`;

  try {
    const [rawUser, rawRepositories] = await Promise.all([fetchJson(userUrl), fetchJson(repositoriesUrl)]);
    const user = GitHubUserSchema.parse(rawUser);
    const repositories = GitHubRepositoriesSchema.parse(rawRepositories);
    const userEvidence = sourceEvidence('github.user', userUrl, 'observed', 'GitHub public user response');
    const repositoriesTruncated = user.public_repos > 100;
    const repositoryEvidence = sourceEvidence(
      'github.repositories',
      repositoriesUrl,
      repositoriesTruncated ? 'unavailable' : 'observed',
      repositoriesTruncated
        ? 'Language analysis is sealed because the public repository list exceeds the 100-item response boundary'
        : 'GitHub public repositories response',
    );
    const repoCount = buildMetric('repositoryCount', user.public_repos, userEvidence);
    const followers = buildMetric('followers', user.followers, userEvidence);
    const publicMetrics = [
      buildMetric('following', user.following, userEvidence),
      buildMetric('publicGists', user.public_gists, userEvidence),
    ];
    const usages = repositoriesTruncated ? [] : languageUsage(repositories, repositoryEvidence);
    const fingerprintInput = JSON.stringify({
      githubId: normalizedGithubId,
      repoCount: repoCount.value,
      followers: followers.value,
      publicMetrics: publicMetrics.map((metric) => [metric.key, metric.value]),
      languages: usages.map((usage) => [usage.language, usage.repositoryCount, usage.ratio]),
    });
    const commitEvidence = sourceEvidence('github.commit-total', userUrl, 'unavailable', 'GitHub public user and repository responses do not provide a total commit count');

    return {
      githubId: normalizedGithubId,
      fingerprint: stableFingerprint(fingerprintInput),
      collectionState: 'complete',
      repoCount,
      followers,
      publicMetrics,
      languageUsage: usages,
      estimatedCommitCount: {
        value: null,
        formula: 'unavailable: public user and repository endpoints do not expose total commit counts',
        evidence: commitEvidence,
      },
      evidence: [userEvidence, repositoryEvidence, commitEvidence],
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'GitHub public API returned an unknown failure';
    return unavailableStats(normalizedGithubId, detail);
  }
}
