import url from 'url';

import { parseGitHubRepoUrl } from '../../../helpers/github-url';

export default function getTemplateUrl(repositoryUrl, configFilePath) {
  const { fullName } = parseGitHubRepoUrl(repositoryUrl);
  const templateUrl = url.format({
    protocol: 'https:',
    host: 'github.com',
    pathname: `${fullName}/edit/master/${configFilePath}`
  });

  return templateUrl;
}
