import promClient from 'prom-client';

import { GitHubUser } from '../db/models/github-user';

const gitHubUsersTotal = new promClient.Gauge(
  'bsi_github_users_total',
  'Total number of GitHub users who have ever logged in.'
);

export default async function updateGitHubUsersTotal() {
  gitHubUsersTotal.set(await GitHubUser.count());
}
