const GITHUB_ID_PATTERN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;

export function normalizeGithubId(value: string): string | null {
  const candidate = value.trim();
  return GITHUB_ID_PATTERN.test(candidate) ? candidate : null;
}
