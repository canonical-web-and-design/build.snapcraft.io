import parseGitHubUrl from 'parse-github-url';

export const getGitHubRepoUrl = (owner, name) => {
  let repository = !name ? owner : `${owner}/${name}`;
  return `https://github.com/${repository}`;
};

export const parseGitHubRepoUrl = (url) => {
  const repo = parseGitHubUrl(url);
  return (repo && repo.repo) ? {
    owner: repo.owner,
    name: repo.name,
    fullName: repo.repo,
    url: getGitHubRepoUrl(repo.owner, repo.name)
  } : null;
};
