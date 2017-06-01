import expect from 'expect';
import promClient from 'prom-client';

import db from '../../../../../src/server/db';

describe('The developer uptake metric', () => {
  let updateDeveloperUptake;

  const testUsers = [
    {},
    {
      snaps_added: 1,
      snaps_removed: 1
    },
    {
      snaps_added: 2,
      snaps_removed: 1,
      names_registered: 1
    },
    {
      snaps_added: 1,
      names_registered: 1,
      builds_requested: 1
    },
    {
      snaps_added: 2,
      names_registered: 2,
      builds_requested: 2,
      builds_released: 1
    }
  ];

  beforeEach(async () => {
    // Must be required here rather than imported, to make sure that it
    // registers metrics when tests are run and clears them immediately
    // afterwards.
    updateDeveloperUptake = require('../../../../../src/server/metrics/developer-uptake').default;

    await db.model('GitHubUser').query('truncate').fetch();
  });

  afterEach(() => {
    promClient.register.clear();
  });

  it('returns reasonable developer uptake values', () => {
    return db.transaction(async (trx) => {
      for (let i = 0; i < testUsers.length; i++) {
        await db.model('GitHubUser').forge({
          github_id: i,
          name: null,
          login: `person-${i}`,
          last_login_at: new Date()
        }).save(testUsers[i], { transacting: trx });
      }
      await updateDeveloperUptake(trx);
      const metricName = 'bsi_developer_uptake';
      expect(promClient.register.getSingleMetric(metricName).get()).toEqual({
        type: 'gauge',
        name: metricName,
        help: 'Number of developers who have reached various steps.',
        values: [
          {
            labels: { metric_type: 'kpi', step: 'enabled_repository' },
            value: 4
          },
          {
            labels: { metric_type: 'kpi', step: 'registered_name' },
            value: 3
          },
          {
            labels: { metric_type: 'kpi', step: 'requested_build' },
            value: 2
          },
          {
            labels: { metric_type: 'kpi', step: 'released_build' },
            value: 1
          }
        ]
      });
    });
  });
});
