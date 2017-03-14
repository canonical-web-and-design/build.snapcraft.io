import expect from 'expect';
import promClient from 'prom-client';

import { GitHubUser } from '../../../../../src/server/db/models/github-user';
import updateGitHubUsersTotal from '../../../../../src/server/metrics/github-users';

describe('The GitHub users metric', () => {
  beforeEach(async () => {
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
    expect(promClient.register.getSingleMetric(metricName).get()).toMatch({
      name: metricName,
      type: 'gauge',
      values: [{ value: 5 }]
    });
  });
});
