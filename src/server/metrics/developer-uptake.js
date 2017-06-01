import promClient from 'prom-client';

import db from '../db';

const developerUptake = new promClient.Gauge(
  'bsi_developer_uptake',
  'Number of developers who have reached various steps.',
  ['metric_type', 'step']
);

export default async function updateDeveloperUptake(trx) {
  // "How many developers have ever logged in" is covered by
  // `bsi_github_users_total` instead.
  developerUptake.set(
    { metric_type: 'kpi', step: 'enabled_repository' },
    await db.model('GitHubUser')
      .where('snaps_added', '>', 0)
      .count('*', { transacting: trx })
  );
  developerUptake.set(
    { metric_type: 'kpi', step: 'registered_name' },
    await db.model('GitHubUser')
      .where('names_registered', '>', 0)
      .count('*', { transacting: trx })
  );
  developerUptake.set(
    { metric_type: 'kpi', step: 'requested_build' },
    await db.model('GitHubUser')
      .where('builds_requested', '>', 0)
      .count('*', { transacting: trx })
  );
  developerUptake.set(
    { metric_type: 'kpi', step: 'released_build' },
    await db.model('GitHubUser')
      .where('builds_released', '>', 0)
      .count('*', { transacting: trx })
  );
}
