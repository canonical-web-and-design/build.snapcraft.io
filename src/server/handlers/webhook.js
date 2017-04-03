import { createHmac } from 'crypto';

import { getGitHubRepoUrl } from '../../common/helpers/github-url';
import db from '../db';
import { conf } from '../helpers/config';
import { getMemcached } from '../helpers/memcached';
import logging from '../logging';
import { getSnapcraftYamlCacheId } from './github';
import {
  internalFindSnap,
  internalGetSnapcraftYaml,
  internalRequestSnapBuilds
} from './launchpad';

const logger = logging.getLogger('express');

export const getGitHubRootSecret = () => {
  const rootSecret = conf.get('GITHUB_WEBHOOK_SECRET');
  if (!rootSecret) {
    throw new Error('GitHub webhook secret not configured');
  }
  return rootSecret;
};

export const getLaunchpadRootSecret = () => {
  const rootSecret = conf.get('LP_WEBHOOK_SECRET');
  if (!rootSecret) {
    throw new Error('Launchpad webhook secret not configured');
  }
  return rootSecret;
};

const selectWebhookRootSecret = (headers) => {
  if (headers['x-github-event']) {
    return getGitHubRootSecret();
  } else if (headers['x-launchpad-event-type']) {
    return getLaunchpadRootSecret();
  } else {
    throw new Error('Unknown webhook sender');
  }
};

export const makeWebhookSecret = (rootSecret, owner, name) => {
  const hmac = createHmac('sha1', rootSecret);
  hmac.update(owner);
  hmac.update(name);
  return hmac.digest('hex');
};

const handlePing = async (req, res) => {
  return res.status(200).send();
};

const handleGitHubPush = async (req, res, owner, name) => {
  const repositoryUrl = getGitHubRepoUrl(owner, name);
  const cacheId = getSnapcraftYamlCacheId(repositoryUrl);
  // Clear snap name cache before starting.
  // XXX cjwatson 2017-02-16: We could be smarter about this by looking at
  // the content of the push event.
  await getMemcached().del(cacheId);
  try {
    const snap = await internalFindSnap(repositoryUrl);
    if (!snap.store_name) {
      throw 'Cannot build snap until name is registered';
    }
    if (!snap.auto_build) {
      // XXX cjwatson 2017-02-16: Cache returned snap name, if any.
      await internalGetSnapcraftYaml(owner, name);
    }
    await internalRequestSnapBuilds(snap, owner);
    logger.info(`Requested builds of ${repositoryUrl}.`);
    return res.status(200).send();
  } catch (error) {
    logger.error(`Failed to request builds of ${repositoryUrl}: ${error}.`);
    return res.status(500).send();
  }
};

const handleLaunchpadSnapBuild = async (req, res, owner, name, parsedBody) => {
  if (parsedBody.store_upload_status === 'Uploaded') {
    try {
      await db.transaction(async (trx) => {
        // XXX cjwatson 2017-03-17: This will go wrong once we support
        // organizations, since we have no way to know which developer to
        // credit for the builds.  At the moment, the best we can do is to
        // credit the owner of the repository.
        await db.model('GitHubUser').incrementMetric(
          { login: owner }, 'builds_released', 1, { transacting: trx }
        );
      });
    } catch (error) {
      logger.error(error.message);
      return res.status(500).send();
    }
  }
  return res.status(200).send();
};

const gitHubHandlers = {
  ping: handlePing,
  push: handleGitHubPush
};

const launchpadHandlers = {
  ping: handlePing,
  'snap:build:0.1': handleLaunchpadSnapBuild
};

// Response bodies won't go anywhere very useful, but at least try to send
// meaningful codes.
export const notify = async (req, res) => {
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
  let parsedBody;
  try {
    parsedBody = JSON.parse(req.body);
  } catch (e) {
    logger.error(e.message);
    return res.status(400).send();
  }
  logger.debug('Received webhook: ', req.body);

  let secret;
  try {
    const rootSecret = selectWebhookRootSecret(req.headers);
    secret = makeWebhookSecret(rootSecret, owner, name);
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
  const gitHubEvent = req.headers['x-github-event'];
  const launchpadEvent = req.headers['x-launchpad-event-type'];
  let handler;
  if (gitHubEvent) {
    handler = gitHubHandlers[gitHubEvent];
    if (!handler) {
      logger.info(`Unhandled GitHub webhook event ${gitHubEvent}`);
    }
  } else if (launchpadEvent) {
    handler = launchpadHandlers[launchpadEvent];
    if (!handler) {
      logger.info(`Unhandled Launchpad webhook event ${launchpadEvent}`);
    }
  } else {
    logger.info('Ignoring non-GitHub and non-Launchpad webhook');
  }
  if (handler) {
    return handler(req, res, owner, name, parsedBody);
  } else {
    return res.status(400).send();
  }
};
