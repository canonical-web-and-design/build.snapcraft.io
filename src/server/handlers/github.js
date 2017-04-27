import url from 'url';
import { normalize } from 'normalizr';

import { repoList } from './schema';
import logging from '../logging';
import requestGitHub from '../helpers/github';
import { conf } from '../helpers/config';
import { getMemcached } from '../helpers/memcached';
import { checkGitHubStatus, internalGetSnapcraftYaml } from './launchpad';
import { parseGitHubRepoUrl } from '../../common/helpers/github-url';
import { getGitHubRootSecret, makeWebhookSecret } from './webhook';

const logger = logging.getLogger('express');
const SNAPCRAFT_INFO_WHITELIST = ['name', 'confinement'];

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

const RESPONSE_CREATED = {
  status: 'success',
  payload: {
    code: 'github-webhook-created',
    message: 'GitHub webhook successfully created'
  }
};

const RESPONSE_ALREADY_CREATED = {
  status: 'success',
  payload: {
    code: 'github-already-created',
    message: 'A webhook already exists on the given repository'
  }
};

export const requestUser = (token) => {
  return requestGitHub.get('/user', { token, json: true });
};

export const getUser = async (req, res) => {
  if (!req.session || !req.session.token) {
    return res.status(401).send(RESPONSE_AUTHENTICATION_FAILED);
  }

  const response = await requestUser(req.session.token);
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
};

// memcached cache id helper
export const listOrganizationsCacheId = (owner) => `organizations:${owner}`;

export const internalListOrganizations = async (owner, token) => {
  const cacheId = listOrganizationsCacheId(owner);

  try {
    const result = await getMemcached().get(cacheId);
    if (result !== undefined) {
      return result;
    }
  } catch (error) {
    logger.error(`Error getting ${cacheId} from memcached: ${error}`);
  }

  try {
    const response = await requestGitHub.get('/user/orgs', {
      token, json: true
    });
    await checkGitHubStatus(response);
    await getMemcached().set(cacheId, response.body, 3600);
    return response.body;
  } catch (error) {
    logger.error(`Error getting list of organizations from GitHub: ${error}`);
    return [];
  }
};

// memcached cache id helper
export const getSnapcraftYamlCacheId = (repositoryUrl) => `snapcraft_data:${repositoryUrl}`;

export const getSnapcraftData = async (repositoryUrl, token) => {
  const { owner, name } = parseGitHubRepoUrl(repositoryUrl);
  const cacheId = getSnapcraftYamlCacheId(repositoryUrl);

  try {
    const result = await getMemcached().get(cacheId);
    if (result !== undefined) {
      return result;
    }
  } catch (error) {
    logger.error(`Error getting ${cacheId} from memcached: ${error}`);
  }

  try {
    const snapcraftYaml = await internalGetSnapcraftYaml(owner, name, token);
    const snapcraftData = {};
    for (const index of Object.keys(snapcraftYaml.contents)) {
      if (SNAPCRAFT_INFO_WHITELIST.indexOf(index) >= 0) {
        snapcraftData[index] = snapcraftYaml.contents[index];
      }
    }

    // copy snapcraft.yaml path from repo into snapcraftData
    //
    // XXX we are mixing our custom `path` into data from snapcraft.yaml file
    // currently there is no `path` defined in snapcraft syntax
    // https://snapcraft.io/docs/build-snaps/syntax
    // and also we whitelist only `name`, so no collision should occur
    snapcraftData.path = snapcraftYaml.path;
    await getMemcached().set(cacheId, snapcraftData, 3600);
    return snapcraftData;
  } catch (error) {
    return null;
  }
};

export const listRepositories = async (req, res) => {
  const params = {
    affiliation: 'owner,organization_member'
  };

  if (!req.session || !req.session.token) {
    return res.status(401).send(RESPONSE_AUTHENTICATION_FAILED);
  }

  if (req.query.page) {
    params.page = req.query.page;
  }

  const uri = url.format({ pathname: '/user/repos', query: params });
  const response = await requestGitHub.get(uri, {
    token: req.session.token, json: true
  });
  if (response.statusCode !== 200) {
    return res.status(response.statusCode).send({
      status: 'error',
      payload: {
        code: 'github-list-repositories-error',
        message: response.body.message
      }
    });
  }

  const administeredRepos = response.body.filter(
    (repo) => repo.permissions && repo.permissions.admin
  );
  const body = {
    status: 'success',
    code: 'github-list-repositories',
    ...normalize(administeredRepos, repoList)
  };

  if (response.headers.link) {
    body.pageLinks = parseLinkHeader(response.headers.link);
  }

  return res.status(response.statusCode).send(body);
};

export const createWebhook = async (req, res) => {
  const { owner, name } = req.body;
  let secret;

  try {
    secret = makeWebhookSecret(getGitHubRootSecret(), owner, name);
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
  try {
    const response = await requestGitHub.post(uri, options);
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
          return res.status(200).send(RESPONSE_ALREADY_CREATED);
        default:
          // Something else
          logger.error('GitHub API error', response.statusCode);
          return res.status(500).send(RESPONSE_OTHER);
      }
    }

    return res.status(201).send(RESPONSE_CREATED);
  } catch (error) {
    logger.error('GitHub API error', error);
    return res.status(500).send(error.message);
  }
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
