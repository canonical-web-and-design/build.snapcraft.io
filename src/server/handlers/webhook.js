import { createHmac } from 'crypto';

import { getGitHubRepoUrl } from '../../common/helpers/github-url';
import { conf } from '../helpers/config';
import { getMemcached } from '../helpers/memcached';
import getLaunchpad from '../launchpad';
import logging from '../logging';
import { getSnapNameCacheId } from './github';
import { internalFindSnap, internalGetSnapcraftYaml } from './launchpad';

const logger = logging.getLogger('express');

export const makeWebhookSecret = (owner, name) => {
  const rootSecret = conf.get('GITHUB_WEBHOOK_SECRET');
  if (!rootSecret) {
    throw new Error('GitHub webhook secret not configured');
  }
  const hmac = createHmac('sha1', rootSecret);
  hmac.update(owner);
  hmac.update(name);
  return hmac.digest('hex');
};

// Response bodies won't go anywhere very useful, but at least try to send
// meaningful codes.
export const notify = (req, res) => {
  const signature = req.headers['x-hub-signature'];
  const { owner, name } = req.params;

  if (!signature) {
    logger.info('Rejecting unsigned webhook');
    return res.status(400).send();
  }
  const firstchar = req.body.trim()[0];
  if (firstchar !== '{') {
    logger.info(`Unexpected token ${firstchar}`);
    return res.status(400).send();
  }
  logger.debug('Received webhook: ', req.body);

  let secret;
  try {
    secret = makeWebhookSecret(owner, name);
  } catch (e) {
    logger.error(e.message);
    return res.status(500).send();
  }
  const hmac = createHmac('sha1', secret);
  hmac.update(req.body);
  const computedSignature = `sha1=${hmac.digest('hex')}`;
  if (signature !== computedSignature) {
    logger.info('Webhook signature mismatch: ' +
                `received ${signature} != computed ${computedSignature}`);
    return res.status(400).send();
  }

  // Acknowledge webhook
  if (req.headers['x-github-event'] === 'ping') {
    return res.status(200).send();
  } else {
    const repositoryUrl = getGitHubRepoUrl(owner, name);
    const lpClient = getLaunchpad();
    // Clear snap name cache before starting.
    // XXX cjwatson 2017-02-16: We could be smarter about this by looking at
    // the content of the push event.
    return getMemcached().del(getSnapNameCacheId(repositoryUrl))
      .then(() => internalFindSnap(repositoryUrl))
      .then((snap) => {
        if (!snap.auto_build) {
          return internalGetSnapcraftYaml(owner, name)
            .then(() => {
              // XXX cjwatson 2017-02-16: Cache returned snap name, if any.
              snap.auto_build = true;
              return snap.lp_save();
            })
            .then(() => snap);
        } else {
          return snap;
        }
      })
      .then((snap) => {
        if (snap.auto_build) {
          return lpClient.named_post(snap.self_link, 'requestAutoBuilds');
        } else {
          throw 'Cannot build snap until snapcraft.yaml exists';
        }
      })
      .then(() => {
        logger.info(`Requested builds of ${repositoryUrl}.`);
        return res.status(200).send();
      })
      .catch((error) => {
        logger.error(`Failed to request builds of ${repositoryUrl}: ` +
                     `${error}.`);
        return res.status(500).send();
      });
  }
};
