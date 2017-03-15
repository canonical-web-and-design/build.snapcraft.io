import expect from 'expect';
import promClient from 'prom-client';

import { GitHubUser } from '../../../../../src/server/db/models/github-user';

describe('The GitHub users metric', () => {
  let updateGitHubUsersTotal;

  beforeEach(async () => {
    // this needs to be required in test rather then imported
    // to make sure it registers metrics when tests are run and cleared in after hook
    updateGitHubUsersTotal = require('../../../../../src/server/metrics/github-users').default;

    await GitHubUser.query('truncate').fetch();
  });

  afterEach(() => {
    promClient.register.clear();
  });

  it('returns the number of rows in GitHubUser', async () => {
    for (let i = 0; i < 5; i++) {
      const user = GitHubUser.forge({
        github_id: i,
        name: null,
        login: `person-${i}`,
        last_login_at: new Date()
      });
      await user.save();
    }
    await updateGitHubUsersTotal();
    const metricName = 'bsi_github_users_total';
    expect(promClient.register.getSingleMetric(metricName).get()).toEqual({
      type: 'gauge',
      name: metricName,
      help: 'Total number of GitHub users who have ever logged in.',
      values: [{
        labels: { metric_type: 'kpi' },
        value: 5
      }]
    });
  });
});
