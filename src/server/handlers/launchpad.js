import { createHash } from 'crypto';

import yaml from 'js-yaml';
import parseGitHubUrl from 'parse-github-url';

import db from '../db';
import { conf } from '../helpers/config';
import { getMemcached } from '../helpers/memcached';
import requestGitHub from '../helpers/github';
import getLaunchpad from '../launchpad';
import { getSnapcraftData } from './github';
import logging from '../logging';

const logger = logging.getLogger('express');

import { getSnapcraftYamlCacheId } from './github';

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
const prepareError = async (error) => {
  if (error.status && error.body) {
    // The error comes with a prepared representation.
    return error;
  } else if (error.response) {
    // if it's ResourceError from LP client at least for the moment
    // we just wrap the error we get from LP
    const text = await error.response.text();
    logger.error('Launchpad API error:', text);
    return new PreparedError(error.response.status, {
      status: 'error',
      payload: {
        code: 'lp-error',
        message: text
      }
    });
  } else {
    return new PreparedError(500, {
      status: 'error',
      payload: {
        code: 'internal-error',
        message: error.message
      }
    });
  }
};

const sendError = async (res, error) => {
  const preparedError = await prepareError(error);
  res.status(preparedError.status).send(preparedError.body);
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

const checkAdminPermissions = async (session, repositoryUrl) => {
  if (!session || !session.token) {
    throw new PreparedError(401, RESPONSE_NOT_LOGGED_IN);
  }
  const token = session.token;

  const parsed = parseGitHubUrl(repositoryUrl);
  if (parsed === null || parsed.owner === null || parsed.name === null) {
    logger.info(`Cannot parse "${repositoryUrl}"`);
    throw new PreparedError(400, RESPONSE_GITHUB_BAD_URL);
  }

  const uri = `/repos/${parsed.owner}/${parsed.name}`;
  const options = { token, json: true };
  logger.info(`Checking permissions for ${parsed.owner}/${parsed.name}`);
  const response = await requestGitHub.get(uri, options);
  await checkGitHubStatus(response);
  if (!response.body.permissions || !response.body.permissions.admin) {
    throw new PreparedError(401, RESPONSE_GITHUB_NO_ADMIN_PERMISSIONS);
  }
  return { owner: parsed.owner, name: parsed.name, token };
};

const makeSnapName = (url) => {
  return createHash('md5').update(url).digest('hex');
};

// XXX cjwatson 2017-02-08: internalGetSnapcraftYaml and getSnapcraftYaml
// really belong in src/server/handlers/github.js instead, but moving them
// around is a bit cumbersome at the moment.

// helper function that fetches snapcraft.yaml with a given path in given repo
const fetchSnapcraftYaml = async (path, owner, name, token) => {
  const uri = `/repos/${owner}/${name}/contents/${path}`;
  const options = {
    token,
    headers: { 'Accept': 'application/vnd.github.v3.raw' }
  };
  logger.info(`Fetching ${path} from ${owner}/${name}`);

  const response = await requestGitHub.get(uri, options);
  await checkGitHubStatus(response);
  return response;
};

export const internalGetSnapcraftYaml = async (owner, name, token) => {
  const paths = ['snap/snapcraft.yaml', 'snapcraft.yaml', '.snapcraft.yaml'];
  for (const path of paths) {
    try {
      const response = await fetchSnapcraftYaml(path, owner, name, token);
      try {
        return {
          contents: yaml.safeLoad(response.body),
          path
        };
      } catch (e) {
        throw new PreparedError(400, RESPONSE_SNAPCRAFT_YAML_PARSE_FAILED);
      }
    } catch (error) {
      if (path !== paths[paths.length - 1] &&
          error.status === 404 && error.body &&
          error.body.payload.code === RESPONSE_GITHUB_NOT_FOUND.payload.code) {
        continue;
      } else {
        throw error;
      }
    }
  }
};

export const getSnapcraftYaml = async (req, res) => {
  if (!req.session || !req.session.token) {
    return Promise.reject(new PreparedError(401, RESPONSE_NOT_LOGGED_IN));
  }
  const token = req.session.token;

  try {
    const snapcraftYaml = await internalGetSnapcraftYaml(
      req.params.owner, req.params.name, token
    );
    return res.status(200).send({
      status: 'success',
      payload: {
        code: 'snapcraft-yaml-found',
        path: snapcraftYaml.path,
        contents: snapcraftYaml.contents
      }
    });
  } catch (error) {
    return sendError(res, error);
  }
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
      // auto_build will be enabled later, once snapcraft.yaml exists and
      // the snap name has been registered.
      auto_build: false,
      auto_build_archive: `/${DISTRIBUTION}/+archive/primary`,
      auto_build_pocket: 'Updates',
      processors: ARCHITECTURES.map((arch) => `/+processors/${arch}`)
    }
  });
};

export const newSnap = async (req, res) => {
  const repositoryUrl = req.body.repository_url;

  // We need admin permissions in order to be able to install a webhook later.
  try {
    const { owner } = await checkAdminPermissions(req.session, repositoryUrl);
    await db.transaction(async (trx) => {
      if (req.session.user) {
        await db.model('GitHubUser').incrementMetric(
          { github_id: req.session.user.id }, 'snaps_added', 1,
          { transacting: trx }
        );
      }

      const result = await requestNewSnap(repositoryUrl);
      // as new snap is created we need to clear list of snaps from cache
      const urlPrefix = getRepoUrlPrefix(owner);
      const cacheId = getUrlPrefixCacheId(urlPrefix);

      await getMemcached().del(cacheId);
      const snapUrl = result.self_link;
      logger.info(`Created ${snapUrl}`);
      return res.status(201).send({
        status: 'success',
        payload: {
          code: 'snap-created',
          message: snapUrl
        }
      });
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const internalFindSnap = async (repositoryUrl) => {
  const cacheId = getRepositoryUrlCacheId(repositoryUrl);
  const lpClient = getLaunchpad();

  try {
    const result = await getMemcached().get(cacheId);
    if (result !== undefined) {
      return lpClient.wrap_resource(result.self_link, result);
    }
  } catch (error) {
    logger.error(`Error getting ${cacheId} from memcached: ${error}`);
  }

  let entries;
  try {
    entries = await lpClient.named_get('/+snaps', 'findByURL', {
      parameters: { url: repositoryUrl }
    });
  } catch (error) {
    if (error.response.status === 404) {
      throw new PreparedError(404, RESPONSE_SNAP_NOT_FOUND);
    }
    // At least for the moment, we just wrap the error we get from
    // Launchpad.
    const text = await error.response.text();
    throw new PreparedError(error.response.status, {
      status: 'error',
      payload: {
        code: 'lp-error',
        message: text
      }
    });
  }
  const username = conf.get('LP_API_USERNAME');
  // https://github.com/babel/babel-eslint/issues/415
  for await (const entry of entries) { // eslint-disable-line semi
    if (entry.owner_link.endsWith(`/~${username}`)) {
      await getMemcached().set(cacheId, entry, 3600);
      return entry;
    }
  }
  throw new PreparedError(404, RESPONSE_SNAP_NOT_FOUND);
};

const internalFindSnapsByPrefix = async (urlPrefix) => {
  const username = conf.get('LP_API_USERNAME');
  const cacheId = getUrlPrefixCacheId(urlPrefix);
  const lpClient = getLaunchpad();

  try {
    const result = await getMemcached().get(cacheId);
    if (result !== undefined) {
      return result.map((entry) => {
        return lpClient.wrap_resource(entry.self_link, entry);
      });
    }
  } catch (error) {
    logger.error(`Error getting ${cacheId} from memcached: ${error}`);
  }

  try {
    const result = await lpClient.named_get('/+snaps', 'findByURLPrefix', {
      parameters: {
        url_prefix: urlPrefix,
        owner: `/~${username}`
      }
    });
    await getMemcached().set(cacheId, result.entries, 3600);
    return result.entries;
  } catch (error) {
    // At least for the moment, we just wrap the error we get from
    // Launchpad.
    const text = await error.response.text();
    throw new PreparedError(error.response.status, {
      status: 'error',
      payload: {
        code: 'lp-error',
        message: text
      }
    });
  }
};

// If we haven't yet initialized metrics related to the number of snaps for
// this user, do that now making some reasonable assumptions about
// historical data.  This may under-report if somebody manages to accumulate
// more snaps than the Launchpad batch size (75) before triggering this, but
// that shouldn't happen in practice.
const initializeMetrics = async (gitHubId, snaps) => {
  await db.transaction(async (trx) => {
    const row = await db.model('GitHubUser')
      .where({ github_id: gitHubId })
      .fetch({ transacting: trx });
    if (row) {
      const rowData = row.serialize();
      if (rowData.snaps_added === undefined ||
          rowData.snaps_added === null) {
        row.set({ snaps_added: snaps.length });
      }
      if (rowData.snaps_removed === undefined ||
          rowData.snaps_removed === null) {
        row.set({ snaps_removed: 0 });
      }
      if (rowData.names_registered === undefined ||
          rowData.names_registered === null) {
        const namesRegistered = snaps.filter((snap) => snap.store_name).length;
        row.set({ names_registered: namesRegistered });
      }
      if (rowData.builds_requested === undefined ||
          rowData.builds_requested === null) {
        // This is potentially quite an expensive piece of initialization,
        // but only the first time that a user who's been using the site
        // since before this code landed comes back, so some one-time
        // expense is tolerable.
        try {
          let buildsRequested = 0;
          for (const snap of snaps) {
            const builds = await getLaunchpad().get(
              snap.builds_collection_link
            );
            buildsRequested += builds.total_size;
          }
          row.set({ builds_requested: buildsRequested });
        } catch (error) {
          logger.error(`Failed to fetch builds from Launchpad: ${error}`);
        }
      }
      await row.save({}, { transacting: trx });
    }
  });
};

export const findSnaps = async (req, res) => {
  const owner = req.query.owner || req.session.user.login;
  const urlPrefix = getRepoUrlPrefix(owner);
  try {
    const rawSnaps = await internalFindSnapsByPrefix(urlPrefix);
    const snaps = await Promise.all(rawSnaps.map(async (snap) => {
      const snapcraftData = await getSnapcraftData(
        snap.git_repository_url, req.session.token
      );
      return { ...snap, snapcraft_data: snapcraftData };
    }));
    if (req.session.user) {
      await initializeMetrics(req.session.user.id, snaps);
    }
    return res.status(200).send({
      status: 'success',
      payload: {
        code: 'snaps-found',
        snaps: snaps
      }
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const findSnap = async (req, res) => {
  try {
    const snap = await internalFindSnap(req.query.repository_url);
    return res.status(200).send({
      status: 'success',
      payload: {
        code: 'snap-found',
        snap
      }
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const clearSnapCache = (repositoryUrl) => {
  const repository = parseGitHubUrl(repositoryUrl);
  const enabledReposCacheId = getUrlPrefixCacheId(getRepoUrlPrefix(repository.owner));
  const snapCacheId = getRepositoryUrlCacheId(repositoryUrl);
  const snapNameCacheId = getSnapcraftYamlCacheId(repositoryUrl);

  logger.info(`Clearing caches for ${repositoryUrl}: ${enabledReposCacheId}, ${snapCacheId}, ${snapNameCacheId}`);

  return Promise.all([
    getMemcached().del(enabledReposCacheId),
    getMemcached().del(snapCacheId),
    getMemcached().del(snapNameCacheId)
  ]);
};

export const authorizeSnap = async (req, res) => {
  const repositoryUrl = req.body.repository_url;
  const snapName = req.body.snap_name;
  const series = req.body.series;
  const channels = req.body.channels;
  const macaroon = req.body.macaroon;

  try {
    await checkAdminPermissions(req.session, repositoryUrl);
    const result = await internalFindSnap(repositoryUrl);
    // Registration happened a short while ago; we increment the metric here
    // in order to support having the client call `register-name` on the
    // store directly rather than going via our backend.  As such, we don't
    // need to roll this back if authorization fails.
    await db.transaction(async (trx) => {
      if (req.session && req.session.user) {
        await db.model('GitHubUser').incrementMetric(
          { github_id: req.session.user.id }, 'names_registered', 1,
          { transacting: trx }
        );
      }
    });
    const snapUrl = result.self_link;
    await getLaunchpad().patch(snapUrl, {
      store_upload: true,
      store_series_link: `/+snappy-series/${series}`,
      store_name: snapName,
      store_channels: channels
    });
    await getLaunchpad().named_post(snapUrl, 'completeAuthorization', {
      parameters: { root_macaroon: macaroon }
    });
    logger.info(`Completed authorization of ${snapUrl}`);

    // authorized snaps have snap_name updated, so we need to invalidate
    // snaps caches
    await clearSnapCache(repositoryUrl);
    return res.status(200).send({
      status: 'success',
      payload: {
        code: 'snap-authorized',
        message: 'Snap uploads authorized'
      }
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const getSnapBuilds = async (req, res) => {
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

  try {
    const snap = await getLaunchpad().get(snapUrl);
    const builds = await getLaunchpad().get(snap.builds_collection_link, {
      start: start, size: size
    });
    return res.status(200).send({
      status: 'success',
      payload: {
        code: 'snap-builds-found',
        builds: builds.entries
      }
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const internalRequestSnapBuilds = async (snap, owner) => {
  // Request builds, then make sure that auto_build is enabled so that
  // future push events will cause the webhook to dispatch builds.  Doing
  // things in this order ensures that Launchpad's internal
  // `SnapSet.makeAutoBuilds` code won't come along and dispatch an extra
  // set of builds between these two requests.
  const lpClient = getLaunchpad();
  const builds = await lpClient.named_post(
    snap.self_link, 'requestAutoBuilds'
  );
  if (!snap.auto_build) {
    await lpClient.patch(snap.self_link, { auto_build: true });
  }
  // We can't do this properly transactionally (i.e. don't request builds if
  // the DB connection fails), because we don't know how many builds we're
  // going to request up-front.  If we find a way to fix that then we should
  // rearrange this to increment the metric first and then roll it back if
  // requesting builds fails.
  try {
    await db.transaction(async (trx) => {
      // XXX cjwatson 2017-03-17: This will go wrong once we support
      // organizations, since we have no way to know which developer to
      // credit for the builds.  At the moment, the best we can do is to
      // credit the owner of the repository.
      await db.model('GitHubUser').incrementMetric(
        { login: owner }, 'builds_requested', builds.length,
        { transacting: trx }
      );
    });
  } catch (error) {
    logger.error(`Error incrementing builds_requested for ${owner}: ${error}`);
  }
  return builds;
};

export const requestSnapBuilds = async (req, res) => {
  try {
    const { owner } = await checkAdminPermissions(
      req.session, req.body.repository_url
    );
    const snap = await internalFindSnap(req.body.repository_url);
    const builds = await internalRequestSnapBuilds(snap, owner);
    return res.status(201).send({
      status: 'success',
      payload: {
        code: 'snap-builds-requested',
        builds: builds
      }
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const deleteSnap = async (req, res) => {
  try {
    const { owner } = await checkAdminPermissions(
      req.session, req.body.repository_url
    );
    const snap = await internalFindSnap(req.body.repository_url);
    await db.transaction(async (trx) => {
      if (req.session.user) {
        await db.model('GitHubUser').incrementMetric(
          { github_id: req.session.user.id }, 'snaps_removed', 1,
          { transacting: trx }
        );
      }
      await snap.lp_delete();

      const urlPrefix = getRepoUrlPrefix(owner);
      const prefixCacheId = getUrlPrefixCacheId(urlPrefix);
      const repoCacheId = getRepositoryUrlCacheId(req.body.repository_url);
      await getMemcached().del(prefixCacheId);
      await getMemcached().del(repoCacheId);
      return res.status(200).send({
        status: 'success',
        payload: {
          code: 'snap-deleted',
          message: 'Snap deleted'
        }
      });
    });
  } catch (error) {
    return sendError(res, error);
  }
};
