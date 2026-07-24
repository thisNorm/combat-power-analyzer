// 실제 GitHub REST API 통신 모듈
export async function fetchGithubStats(githubId: string) {
  console.log(`[GitHub API] ${githubId}의 실제 데이터를 긁어옵니다...`);
  
  try {
    // 1. 유저 기본 정보 (레포지토리 개수 등)
    const userRes = await fetch(`https://api.github.com/users/${githubId}`);
    if (!userRes.ok) throw new Error('유저를 찾을 수 없습니다.');
    const user = await userRes.json();

    // 2. 유저의 공개 레포지토리 목록 가져오기 (주력 언어 파악용)
    const reposRes = await fetch(`https://api.github.com/users/${githubId}/repos?per_page=100&sort=updated`);
    const repos = await reposRes.json();

    // 3. 언어 통계 추출 (가장 많이 쓴 언어 3개)
    const languageCounts: Record<string, number> = {};
    repos.forEach((repo: any) => {
      if (repo.language) {
        languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
      }
    });
    const mainLanguages = Object.entries(languageCounts)
      .sort((a, b) => b[4] - a[4])
      .slice(0, 3)
      .map(entry => entry);

    // 커밋 수는 REST API로 한 번에 가져오기 어려우므로, 레포지토리 수와 팔로워 기반의 전투력 가중치로 임시 계산 (추후 GraphQL 도입 시 고도화)
    const estimatedCommits = (user.public_repos * 15) + (user.followers * 5) + 120;

    return {
      commitCount: estimatedCommits,
      repoCount: user.public_repos || 0,
      mainLanguages: mainLanguages.length > 0 ? mainLanguages : ["Markdown"],
    };
  } catch (error) {
    console.error('GitHub API 에러:', error);
    // 에러 발생 시 기본 더미 데이터 반환
    return { commitCount: 10, repoCount: 1, mainLanguages: ["Unknown"] };
  }
}