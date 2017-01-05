import { createHmac } from 'crypto';

import getGitHubRepoUrl from '../../common/helpers/github-url';
import { conf } from '../helpers/config';
const logging = require('../logging/').default;
const logger = logging.getLogger('express-error');
import { uncheckedRequestSnapBuilds } from './launchpad';

export const makeWebhookHmac = (account, repo) => {
  const rootSecret = conf.get('GITHUB_WEBHOOK_SECRET');
  if (!rootSecret) {
    throw new Error('GitHub webhook secret not configured');
  }
  const hmac = createHmac('sha1', rootSecret);
  hmac.update(account);
  hmac.update(repo);
  return hmac;
};

// Response bodies won't go anywhere very useful, but at least try to send
// meaningful codes.
export const notify = (req, res) => {
  const signature = req.headers['x-hub-signature'];
  if (!signature) {
    logger.info('Rejecting unsigned webhook');
    return res.status(400).send();
  }
  const firstchar = req.body.trim()[0];
  if (firstchar !== '{') {
    logger.info(`Unexpected token ${firstchar}`);
    return res.status(400).send();
  }
  const body = JSON.parse(req.body);
  logger.debug('Received webhook: ', body);

  let hmac;
  try {
    hmac = makeWebhookHmac(req.params.account, req.params.repo);
  } catch (e) {
    logger.info(e.message);
    return res.status(500).send();
  }
  hmac.update(req.body);
  const computedSignature = `sha1=${hmac.digest('hex')}`;
  if (signature !== computedSignature) {
    logger.info('Webhook signature mismatch: ' +
                `received ${signature} != computed ${computedSignature}`);
    return res.status(400).send();
  }

  // Acknowledge webhook
  const repositoryUrl = getGitHubRepoUrl(req.params.account, req.params.repo);
  return uncheckedRequestSnapBuilds(repositoryUrl)
    .then(() => {
      logger.info(`Requested builds of ${repositoryUrl}.`);
      return res.status(200).send();
    })
    .catch((error) => {
      logger.info(`Failed to request builds of ${repositoryUrl}: ${error}.`);
      return res.status(500).send();
    });
};
