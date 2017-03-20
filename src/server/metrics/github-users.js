import promClient from 'prom-client';

import db from '../db';
import getDefaultLabels from './labels';

const labels = getDefaultLabels();
const gitHubUsersTotal = new promClient.Gauge(
  'bsi_github_users_total',
  'Total number of GitHub users who have ever logged in.',
  Object.keys(labels)
);

export default async function updateGitHubUsersTotal(trx) {
  gitHubUsersTotal.set(
    labels, await db.model('GitHubUser').count('*', { transacting: trx })
  );
}
