import url from 'url';

import { parseGitHubRepoUrl } from '../../../helpers/github-url';

export default function getTemplateUrl(snap) {
  const { fullName } = parseGitHubRepoUrl(snap.gitRepoUrl);
  const templateUrl = url.format({
    protocol: 'https:',
    host: 'github.com',
    pathname: `${fullName}/edit/${snap.gitBranch}/${snap.snapcraftData.path}`
  });

  return templateUrl;
}
