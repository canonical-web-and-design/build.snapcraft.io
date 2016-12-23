const getGitHubRepoUrl = (owner, name) => {
  let repository = !name ? owner : `${owner}/${name}`;
  return `https://github.com/${repository}`;
};

export default getGitHubRepoUrl;
