import qs from 'qs';
import url from 'url';

import { parseGitHubRepoUrl } from '../../common/helpers/github-url';
import { conf } from '../helpers/config';
import requestGitHub from '../helpers/github';
import { getMemcached } from '../helpers/memcached';
import logging from '../logging';
import { internalGetSnapcraftYaml } from './launchpad';
import { makeWebhookSecret } from './webhook';

const logger = logging.getLogger('express');
const REPOSITORY_ENDPOINT = '/user/repos';
const SNAPCRAFT_INFO_WHITELIST = ['name'];

const RESPONSE_NOT_FOUND = {
  status: 'error',
  payload: {
    code: 'github-repository-not-found',
    message: 'The GitHub repository cannot be found or access not granted to account'
  }
};

const RESPONSE_AUTHENTICATION_FAILED = {
  status: 'error',
  payload: {
    code: 'github-authentication-failed',
    message: 'Authentication with GitHub failed'
  }
};

const RESPONSE_OTHER = {
  status: 'error',
  payload: {
    code: 'github-error-other',
    message: 'Something went wrong when creating a webhook'
  }
};

const RESPONSE_ALREADY_CREATED = {
  status: 'error',
  payload: {
    code: 'github-already-created',
    message: 'A webhook already exists on the given repository'
  }
};

const RESPONSE_CREATED = {
  status: 'success',
  payload: {
    code: 'github-webhook-created',
    message: 'GitHub webhook successfully created'
  }
};

export const requestUser = (token) => {
  return requestGitHub.get('/user', { token, json: true });
};

export const getUser = (req, res) => {
  if (!req.session || !req.session.token) {
    return res.status(401).send(RESPONSE_AUTHENTICATION_FAILED);
  }

  requestUser(req.session.token)
    .then((response) => {
      if (response.statusCode !== 200) {
        return res.status(response.statusCode).send({
          status: 'error',
          payload: {
            code: 'github-user-error',
            message: response.body.message
          }
        });
      }

      res.status(response.statusCode).send({
        status: 'success',
        payload: {
          code: 'github-user',
          user: response.body
        }
      });
    });
};

// memcached cache id helper
export const getSnapNameCacheId = (repositoryUrl) => `snap_name:${repositoryUrl}`;

export const getSnapcraftData = (repositoryUrl, token) => {
  const { owner, name } = parseGitHubRepoUrl(repositoryUrl);
  const cacheId = getSnapNameCacheId(repositoryUrl);

  return new Promise((resolve) => {
    getMemcached().get(cacheId, (err, result) => {

      if (!err && result !== undefined) {
        return resolve(result);
      }

      return internalGetSnapcraftYaml(owner, name, token)
        .then((snapcraftYaml) => {
          const snapcraftData = {};
          for (const index of Object.keys(snapcraftYaml)) {
            if (SNAPCRAFT_INFO_WHITELIST.indexOf(index) >= 0) {
              snapcraftData[index] = snapcraftYaml[index];
            }
          }

          return getMemcached().set(cacheId, snapcraftData, 3600, () => {
            return resolve(snapcraftData);
          });
        })
        .catch(() => resolve(null));
    });
  });
};

export const listRepositories = (req, res) => {
  const params = {
    affiliation: 'owner'
  };

  if (!req.session || !req.session.token) {
    return res.status(401).send(RESPONSE_AUTHENTICATION_FAILED);
  }

  if (req.params.page) {
    params.page = req.params.page;
  }

  const uri = REPOSITORY_ENDPOINT + '?' + qs.stringify(params);
  requestGitHub.get(uri, { token: req.session.token, json: true })
    .then((response) => {
      if (response.statusCode !== 200) {
        return res.status(response.statusCode).send({
          status: 'error',
          payload: {
            code: 'github-list-repositories-error',
            message: response.body.message
          }
        });
      }

      const body = {
        status: 'success',
        payload: {
          code: 'github-list-repositories',
          repos: response.body
        }
      };

      if (response.headers.link) {
        body.pageLinks = parseLinkHeader(response.headers.link);
      }

      return res.status(response.statusCode).send(body);
    });
};

export const createWebhook = (req, res) => {
  const { owner, name } = req.body;

  let secret;
  try {
    secret = makeWebhookSecret(owner, name);
  } catch (e) {
    return res.status(500).send({
      status: 'error',
      payload: {
        code: 'github-unconfigured',
        message: e.message
      }
    });
  }

  const uri = `/repos/${owner}/${name}/hooks`;
  const options = getRequest(owner, name, req.session.token, secret);
  requestGitHub.post(uri, options)
    .then((response) => {
      if (response.statusCode !== 201) {
        logger.info(response.body);
        switch (response.body.message) {
          case 'Not Found':
            // Repository does not exist or access not granted
            return res.status(404).send(RESPONSE_NOT_FOUND);
          case 'Bad credentials':
            // Authentication failed
            return res.status(401).send(RESPONSE_AUTHENTICATION_FAILED);
          case 'Validation Failed':
            // Webhook already created
            return res.status(422).send(RESPONSE_ALREADY_CREATED);
          default:
            // Something else
            logger.error('GitHub API error', response.statusCode);
            return res.status(500).send(RESPONSE_OTHER);
        }
      }

      return res.status(201).send(RESPONSE_CREATED);
    }).catch((err) => {
      logger.error('GitHub API error', err);
      return res.status(500).send(err.message);
    });
};

const getRequest = (owner, name, token, secret) => {
  return {
    token,
    json: {
      name: 'web',
      active: true,
      events: [
        'push'
      ],
      config: {
        url: `${conf.get('BASE_URL')}/${owner}/${name}/webhook/notify`,
        content_type: 'json',
        secret
      }
    }
  };
};

/*
 * parse_link_header()
 *
 * Parse the Github Link HTTP header used for pageination
 * http://developer.github.com/v3/#pagination
 *
 * Modified by kfenn to return page numbers instead of urls
 */
const parseLinkHeader = (header) => {
  if (header.length == 0) {
    throw new Error('input must not be of zero length');
  }

  // Split parts by comma
  let parts = header.split(',');
  let links = {};
  // Parse each part into a named link
  for (let index=0; index<parts.length; index++) {
    let section = parts[index].split(';');
    if (section.length != 2) {
      throw new Error('section could not be split on ";"');
    }
    let number = parseInt(url.parse(section[0], true).query.page);
    let name = section[1].replace(/rel="(.*)"/, '$1').trim();
    links[name] = number;
  }

  return links;
};
