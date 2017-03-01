import { createHash } from 'crypto';

import yaml from 'js-yaml';
import parseGitHubUrl from 'parse-github-url';

import { conf } from '../helpers/config';
import { getMemcached } from '../helpers/memcached';
import requestGitHub from '../helpers/github';
import getLaunchpad from '../launchpad';
import { getSnapcraftData } from './github';
import logging from '../logging';

const logger = logging.getLogger('express');

// XXX cjwatson 2016-12-08: Hardcoded for now, but should eventually be
// configurable.
const DISTRIBUTION = 'ubuntu';
const DISTRO_SERIES = 'xenial';
const ARCHITECTURES = ['amd64', 'armhf'];

const RESPONSE_NOT_LOGGED_IN = {
  status: 'error',
  payload: {
    code: 'not-logged-in',
    message: 'Not logged in'
  }
};

const RESPONSE_GITHUB_BAD_URL = {
  status: 'error',
  payload: {
    code: 'github-bad-url',
    message: 'Cannot parse GitHub URL'
  }
};

const RESPONSE_GITHUB_NO_ADMIN_PERMISSIONS = {
  status: 'error',
  payload: {
    code: 'github-no-admin-permissions',
    message: 'You do not have admin permissions for this GitHub repository'
  }
};

const RESPONSE_GITHUB_NOT_FOUND = {
  status: 'error',
  payload: {
    code: 'github-snapcraft-yaml-not-found',
    message: 'Cannot find snapcraft.yaml in this GitHub repository'
  }
};

const RESPONSE_GITHUB_AUTHENTICATION_FAILED = {
  status: 'error',
  payload: {
    code: 'github-authentication-failed',
    message: 'Authentication with GitHub failed'
  }
};

const RESPONSE_GITHUB_OTHER = {
  status: 'error',
  payload: {
    code: 'github-error-other',
    message: 'Something went wrong when looking for snapcraft.yaml'
  }
};

const RESPONSE_SNAPCRAFT_YAML_PARSE_FAILED = {
  status: 'error',
  payload: {
    code: 'snapcraft-yaml-parse-failed',
    message: 'Failed to parse snapcraft.yaml'
  }
};

const RESPONSE_SNAP_NOT_FOUND = {
  status: 'error',
  payload: {
    code: 'snap-not-found',
    message: 'Cannot find existing snap based on this URL'
  }
};

class PreparedError extends Error {
  constructor(status, body) {
    super();
    this.status = status;
    this.body = body;
  }
}

// helper function to get URL prefix for given repo owner
export const getRepoUrlPrefix = (owner) => `https://github.com/${owner}/`;

// memcached cache id helpers
export const getUrlPrefixCacheId = (urlPrefix) => `url_prefix:${urlPrefix}`;
export const getRepositoryUrlCacheId = (repositoryUrl) => `url:${repositoryUrl}`;

// Wrap errors in a promise chain so that they always end up as a
// PreparedError.
const prepareError = (error) => {
  if (error.status && error.body) {
    // The error comes with a prepared representation.
    return Promise.resolve(error);
  } else if (error.response) {
    // if it's ResourceError from LP client at least for the moment
    // we just wrap the error we get from LP
    return error.response.text().then((text) => {
      logger.error('Launchpad API error:', text);
      return new PreparedError(error.response.status, {
        status: 'error',
        payload: {
          code: 'lp-error',
          message: text
        }
      });
    });
  } else {
    return Promise.resolve(new PreparedError(500, {
      status: 'error',
      payload: {
        code: 'internal-error',
        message: error.message
      }
    }));
  }
};

const sendError = (res, error) => {
  return prepareError(error)
    .then((preparedError) => {
      res.status(preparedError.status).send(preparedError.body);
    });
};

const checkGitHubStatus = (response) => {
  if (response.statusCode !== 200) {
    let body = response.body;
    if (typeof body !== 'object') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        logger.error('Invalid JSON received', e, body);
        throw new PreparedError(500, RESPONSE_GITHUB_OTHER);
      }
    }
    switch (body.message) {
      case 'Not Found':
        // snapcraft.yaml not found
        throw new PreparedError(404, RESPONSE_GITHUB_NOT_FOUND);
      case 'Bad credentials':
        // Authentication failed
        throw new PreparedError(401, RESPONSE_GITHUB_AUTHENTICATION_FAILED);
      default:
        // Something else
        logger.error('GitHub API error:', response.statusCode, body);
        throw new PreparedError(500, RESPONSE_GITHUB_OTHER);
    }
  }
  return response;
};

const checkAdminPermissions = (session, repositoryUrl) => {
  if (!session || !session.token) {
    return Promise.reject(new PreparedError(401, RESPONSE_NOT_LOGGED_IN));
  }
  const token = session.token;

  const parsed = parseGitHubUrl(repositoryUrl);
  if (parsed === null || parsed.owner === null || parsed.name === null) {
    logger.info(`Cannot parse "${repositoryUrl}"`);
    return Promise.reject(new PreparedError(400, RESPONSE_GITHUB_BAD_URL));
  }

  const uri = `/repos/${parsed.owner}/${parsed.name}`;
  const options = { token, json: true };
  logger.info(`Checking permissions for ${parsed.owner}/${parsed.name}`);
  return requestGitHub.get(uri, options)
    .then(checkGitHubStatus)
    .then((response) => {
      if (!response.body.permissions || !response.body.permissions.admin) {
        throw new PreparedError(401, RESPONSE_GITHUB_NO_ADMIN_PERMISSIONS);
      }
      return { owner: parsed.owner, name: parsed.name, token };
    });
};

const makeSnapName = (url) => {
  return createHash('md5').update(url).digest('hex');
};

// XXX cjwatson 2017-02-08: internalGetSnapcraftYaml and getSnapcraftYaml
// really belong in src/server/handlers/github.js instead, but moving them
// around is a bit cumbersome at the moment.

// helper function that fetches snapcraft.yaml with a given path in given repo
const fetchSnapcraftYaml = (path, owner, name, token) => {
  const uri = `/repos/${owner}/${name}/contents/${path}`;
  const options = {
    token,
    headers: { 'Accept': 'application/vnd.github.v3.raw' }
  };
  logger.info(`Fetching ${path} from ${owner}/${name}`);

  return requestGitHub.get(uri, options).then(checkGitHubStatus);
};

// helper function that fetches given snapcraft.yaml if error from previous promise is 404
const fetchSnapcraftYamlOn404 = (error, path, owner, name, token) => {
  if (error.status === 404 && error.body &&
      error.body.payload.code === RESPONSE_GITHUB_NOT_FOUND.payload.code) {
    return fetchSnapcraftYaml(path, owner, name, token);
  }
  throw error;
};

export const internalGetSnapcraftYaml = (owner, name, token) => {
  return fetchSnapcraftYaml('snap/snapcraft.yaml', owner, name, token)
    .catch((error) => {
      // if /snap/snapcraft.yaml not found try to fetch /snapcraft.yaml
      return fetchSnapcraftYamlOn404(error, 'snapcraft.yaml', owner, name, token);
    })
    .catch((error) => {
      // if /snapcraft.yaml not found try to fetch /.snapcraft.yaml
      return fetchSnapcraftYamlOn404(error, '.snapcraft.yaml', owner, name, token);
    })
    .then((response) => {
      try {
        return yaml.safeLoad(response.body);
      } catch (e) {
        throw new PreparedError(400, RESPONSE_SNAPCRAFT_YAML_PARSE_FAILED);
      }
    });
};

export const getSnapcraftYaml = (req, res) => {
  if (!req.session || !req.session.token) {
    return Promise.reject(new PreparedError(401, RESPONSE_NOT_LOGGED_IN));
  }
  const token = req.session.token;

  return internalGetSnapcraftYaml(req.params.owner, req.params.name, token)
    .then((snapcraftYaml) => {
      return res.status(200).send({
        status: 'success',
        payload: {
          code: 'snapcraft-yaml-found',
          contents: snapcraftYaml
        }
      });
    })
    .catch((error) => sendError(res, error));
};

const requestNewSnap = (repositoryUrl) => {
  const lpClient = getLaunchpad();
  const username = conf.get('LP_API_USERNAME');

  logger.info(`Creating new snap for ${repositoryUrl}`);
  return lpClient.named_post('/+snaps', 'new', {
    parameters: {
      owner: `/~${username}`,
      distro_series: `/${DISTRIBUTION}/${DISTRO_SERIES}`,
      name: `${makeSnapName(repositoryUrl)}-${DISTRO_SERIES}`,
      git_repository_url: repositoryUrl,
      git_path: 'refs/heads/master',
      auto_build: true,
      auto_build_archive: `/${DISTRIBUTION}/+archive/primary`,
      auto_build_pocket: 'Updates',
      processors: ARCHITECTURES.map((arch) => `/+processors/${arch}`)
    }
  });
};

export const newSnap = (req, res) => {
  const repositoryUrl = req.body.repository_url;

  let owner;
  let snapUrl;
  // We need admin permissions in order to be able to install a webhook later.
  checkAdminPermissions(req.session, repositoryUrl)
    .then((result) => {
      owner = result.owner;
      return requestNewSnap(repositoryUrl);
    })
    .then((result) => {
      // as new snap is created we need to clear list of snaps from cache
      const urlPrefix = getRepoUrlPrefix(owner);
      const cacheId = getUrlPrefixCacheId(urlPrefix);

      getMemcached().del(cacheId, (err) => {
        if (err) {
          logger.error(`Error deleting ${cacheId} from memcached:`, err);
        }
      });

      snapUrl = result.self_link;
      logger.info(`Created ${snapUrl}`);
      return res.status(201).send({
        status: 'success',
        payload: {
          code: 'snap-created',
          message: snapUrl
        }
      });
    })
    .catch((error) => sendError(res, error));
};

export const internalFindSnap = async (repositoryUrl) => {
  const cacheId = getRepositoryUrlCacheId(repositoryUrl);
  const lpClient = getLaunchpad();

  return new Promise((resolve, reject) => {
    getMemcached().get(cacheId, (err, result) => {
      if (!err && result !== undefined) {
        return resolve(lpClient.wrap_resource(result.self_link, result));
      }

      lpClient.named_get('/+snaps', 'findByURL', {
        parameters: { url: repositoryUrl }
      })
      .catch((error) => {
        if (error.response.status === 404) {
          return reject(new PreparedError(404, RESPONSE_SNAP_NOT_FOUND));
        }
        // At least for the moment, we just wrap the error we get from
        // Launchpad.
        error.response.text().then((text) => {
          return reject(new PreparedError(error.response.status, {
            status: 'error',
            payload: {
              code: 'lp-error',
              message: text
            }
          }));
        });
      })
      .then(async (result) => {
        const username = conf.get('LP_API_USERNAME');
        // https://github.com/babel/babel-eslint/issues/415
        for await (const entry of result) { // eslint-disable-line semi
          if (entry.owner_link.endsWith(`/~${username}`)) {
            return getMemcached().set(cacheId, entry, 3600, () => {
              return resolve(entry);
            });
          }
        }
        return reject(new PreparedError(404, RESPONSE_SNAP_NOT_FOUND));
      });
    });
  });
};

const internalFindSnapsByPrefix = (urlPrefix) => {
  const username = conf.get('LP_API_USERNAME');
  const cacheId = getUrlPrefixCacheId(urlPrefix);
  const lpClient = getLaunchpad();

  return new Promise((resolve, reject) => {
    getMemcached().get(cacheId, (err, result) => {
      if (!err && result !== undefined) {
        return resolve(result.map((entry) => {
          return lpClient.wrap_resource(entry.self_link, entry);
        }));
      }

      lpClient.named_get('/+snaps', 'findByURLPrefix', {
        parameters: {
          url_prefix: urlPrefix,
          owner: `/~${username}`
        }
      })
      .then(result => {
        return getMemcached().set(cacheId, result.entries, 3600, () => {
          return resolve(result.entries);
        });
      })
      .catch((error) => {
        // At least for the moment, we just wrap the error we get from
        // Launchpad.
        error.response.text().then((text) => {
          return reject(new PreparedError(error.response.status, {
            status: 'error',
            payload: {
              code: 'lp-error',
              message: text
            }
          }));
        });
      });
    });
  });
};

export const findSnaps = (req, res) => {
  const owner = req.query.owner || req.session.user.login;
  const urlPrefix = getRepoUrlPrefix(owner);
  internalFindSnapsByPrefix(urlPrefix)
    .then((snaps) => {
      return Promise.all(snaps.map((snap) => {
        return getSnapcraftData(snap.git_repository_url, req.session.token)
          .then((snapcraftData) => {
            return {
              ...snap,
              snapcraft_data: snapcraftData
            };
          });
      }))
        .then((snaps) => {
          return res.status(200).send({
            status: 'success',
            payload: {
              code: 'snaps-found',
              snaps: snaps
            }
          });
        });
    })
    .catch((error) => sendError(res, error));
};

export const findSnap = (req, res) => {
  internalFindSnap(req.query.repository_url)
    .then((snap) => {
      return res.status(200).send({
        status: 'success',
        payload: {
          code: 'snap-found',
          snap
        }
      });
    })
    .catch((error) => sendError(res, error));
};

export const authorizeSnap = (req, res) => {
  const repositoryUrl = req.body.repository_url;
  const snapName = req.body.snap_name;
  const series = req.body.series;
  const channels = req.body.channels;
  const macaroon = req.body.macaroon;
  let snapUrl;

  return checkAdminPermissions(req.session, repositoryUrl)
    .then(() => internalFindSnap(repositoryUrl))
    .then((result) => {
      snapUrl = result.self_link;
      return getLaunchpad().patch(snapUrl, {
        store_upload: true,
        store_series_link: `/+snappy-series/${series}`,
        store_name: snapName,
        store_channels: channels
      });
    })
    .then(() => {
      return getLaunchpad().named_post(snapUrl, 'completeAuthorization', {
        parameters: { root_macaroon: macaroon }
      });
    })
    .then(() => {
      logger.info(`Completed authorization of ${snapUrl}`);
      return res.status(200).send({
        status: 'success',
        payload: {
          code: 'snap-authorized',
          message: 'Snap uploads authorized'
        }
      });
    })
    .catch((error) => sendError(res, error));
};

export const getSnapBuilds = (req, res) => {
  const snapUrl = req.query.snap;

  const start = typeof req.query.start !== 'undefined' ? req.query.start : 0;
  const size = typeof req.query.size !== 'undefined' ? req.query.size : 10;

  if (!snapUrl) {
    return res.status(404).send({
      status: 'error',
      payload: {
        code: 'missing-snap-link',
        message: 'Missing query parameter snap'
      }
    });
  }

  return getLaunchpad().get(snapUrl).then((snap) => {
    return getLaunchpad().get(snap.builds_collection_link, { start: start, size: size })
      .then((builds) => {
        return res.status(200).send({
          status: 'success',
          payload: {
            code: 'snap-builds-found',
            builds: builds.entries
          }
        });
      });
  })
  .catch((error) => sendError(res, error));
};

export const requestSnapBuilds = (req, res) => {
  const lpClient = getLaunchpad();
  checkAdminPermissions(req.session, req.body.repository_url)
    .then(() => internalFindSnap(req.body.repository_url))
    .then((snap) => lpClient.named_post(snap.self_link, 'requestAutoBuilds'))
    .then((builds) => {
      return res.status(201).send({
        status: 'success',
        payload: {
          code: 'snap-builds-requested',
          builds: builds
        }
      });
    })
    .catch((error) => sendError(res, error));
};

export const deleteSnap = (req, res) => {
  let owner;
  checkAdminPermissions(req.session, req.body.repository_url)
    .then((result) => {
      owner = result.owner;
      return internalFindSnap(req.body.repository_url);
    })
    .then((snap) => snap.lp_delete())
    .then(() => {
      const urlPrefix = getRepoUrlPrefix(owner);
      const prefixCacheId = getUrlPrefixCacheId(urlPrefix);
      const repoCacheId = getRepositoryUrlCacheId(req.body.repository_url);

      getMemcached().del(prefixCacheId, (err) => {
        if (err) {
          logger.error(`Error deleting ${prefixCacheId} from memcached:`, err);
        }
        getMemcached().del(repoCacheId, (err) => {
          if (err) {
            logger.error(`Error deleting ${repoCacheId} from memcached:`, err);
          }

          return res.status(200).send({
            status: 'success',
            payload: {
              code: 'snap-deleted',
              message: 'Snap deleted'
            }
          });
        });
      });
    })
    .catch((error) => sendError(res, error));
};
