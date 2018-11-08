import { createHash } from 'crypto';

import yaml from 'js-yaml';
import keyBy from 'lodash/keyBy';
import uniq from 'lodash/uniq';
import zip from 'lodash/zip';
import { normalize } from 'normalizr';

import {
  BUILD_TRIGGERED_MANUALLY,
  getSelfId
} from '../../common/helpers/build_annotation';
import { parseGitHubRepoUrl } from '../../common/helpers/github-url';
import db from '../db';
import { conf } from '../helpers/config';
import { getMemcached } from '../helpers/memcached';
import requestGitHub from '../helpers/github';
import { PreparedError, prepareError } from '../helpers/prepared-error';
import getLaunchpad from '../launchpad';
import logging from '../logging';
import * as schema from './schema.js';
import {
  checkGitHubStatus,
  getDefaultBranch,
  getSnapcraftData,
  internalListOrganizations
} from './github';
import { getLaunchpadRootSecret, makeWebhookSecret } from './webhook';

const logger = logging.getLogger('express');

import { getSnapcraftYamlCacheId } from './github';

// XXX cjwatson 2016-12-08: Hardcoded for now, but should eventually be
// configurable.
const DISTRIBUTION = 'ubuntu';
const DISTRO_SERIES = 'xenial';
const ARCHITECTURES = ['amd64', 'arm64', 'armhf', 'i386', 'ppc64el', 's390x'];

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

const RESPONSE_GITHUB_SNAPCRAFT_YAML_NOT_FOUND = {
  status: 'error',
  payload: {
    code: 'github-snapcraft-yaml-not-found',
    message: 'Cannot find snapcraft.yaml in this GitHub repository'
  }
};

const RESPONSE_SNAP_NOT_FOUND = {
  status: 'error',
  payload: {
    code: 'snap-not-found',
    message: 'Cannot find existing snap based on this URL'
  }
};

// helper function to get URL prefix for given repo owner
export const getRepoUrlPrefix = (owner) => `https://github.com/${owner}/`;

// memcached cache id helpers
export const getUrlPrefixCacheId = (urlPrefix) => `url_prefix:${urlPrefix}`;
export const getRepositoryUrlCacheId = (repositoryUrl) => `url:${repositoryUrl}`;
export const getHasWebhookCacheId = (snapUrl) => `has_webhook:${snapUrl}`;

const sendError = async (res, error) => {
  const preparedError = await prepareError(error);
  res.status(preparedError.status).send(preparedError.body);
};

const checkAdminPermissions = async (session, repositoryUrl) => {
  if (!session || !session.token) {
    throw new PreparedError(401, RESPONSE_NOT_LOGGED_IN);
  }
  const token = session.token;

  const parsed = parseGitHubRepoUrl(repositoryUrl);
  if (parsed === null) {
    logger.info(`Cannot parse "${repositoryUrl}"`);
    throw new PreparedError(400, RESPONSE_GITHUB_BAD_URL);
  }

  const uri = `/repos/${parsed.owner}/${parsed.name}`;
  const options = { token, json: true };
  logger.info(`Checking permissions for ${parsed.owner}/${parsed.name}`);
  const response = await requestGitHub.get(uri, options);
  await checkGitHubStatus(response);
  if (!response.body.permissions || !response.body.permissions.admin) {
    throw new PreparedError(403, RESPONSE_GITHUB_NO_ADMIN_PERMISSIONS);
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
  await checkGitHubStatus(response, RESPONSE_GITHUB_SNAPCRAFT_YAML_NOT_FOUND);
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
      } catch (error) {
        return {
          path,
          error
        };
      }
    } catch (error) {
      if (path !== paths[paths.length - 1] &&
          error.status === 404 && error.body &&
          error.body.payload.code === RESPONSE_GITHUB_SNAPCRAFT_YAML_NOT_FOUND.payload.code) {
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
      git_path: 'HEAD',
      // auto_build will be enabled later, once snapcraft.yaml exists and
      // the snap name has been registered.
      auto_build: false,
      auto_build_archive: `/${DISTRIBUTION}/+archive/primary`,
      auto_build_pocket: 'Updates',
      processors: ARCHITECTURES.map((arch) => `/+processors/${arch}`)
    }
  });
};

const ensureWebhook = async (snap) => {
  const cacheId = getHasWebhookCacheId(snap.self_link);
  const { owner, name } = parseGitHubRepoUrl(snap.git_repository_url);
  const notifyUrl = `${conf.get('BASE_URL')}/${owner}/${name}/webhook/notify`;
  const lpClient = getLaunchpad();

  try {
    const result = await getMemcached().get(cacheId);
    if (result !== undefined) {
      return;
    }
  } catch (error) {
    logger.error(`Error getting ${cacheId} from memcached: ${error}`);
  }

  try {
    const webhooks = await lpClient.get(snap.webhooks_collection_link);
    const hasMatch = webhooks.entries.some(
      (webhook) => webhook.delivery_url === notifyUrl
    );
    if (hasMatch) {
      return;
    }

    let secret;
    try {
      secret = makeWebhookSecret(getLaunchpadRootSecret(), owner, name);
    } catch (error) {
      throw new PreparedError(500, {
        status: 'error',
        payload: {
          code: 'lp-unconfigured',
          message: error.message
        }
      });
    }
    await lpClient.named_post(snap.self_link, 'newWebhook', {
      parameters: {
        delivery_url: notifyUrl,
        event_types: ['snap:build:0.1'],
        active: true,
        secret
      }
    });
    await getMemcached().set(cacheId, true, 3600);
    logger.info(`Created webhook on ${snap.self_link}`);
  } catch (error) {
    // This is unfortunate, but it can be non-fatal at the moment as we only
    // use this for metrics.  We'll try again later.
    logger.error(`Error creating webhook on ${snap.self_link}: ${error}`);
  }
};

export const newSnap = async (req, res) => {
  const repositoryUrl = req.body.repository_url;

  // We need admin permissions in order to be able to install a webhook later.
  try {
    const { owner, name } = await checkAdminPermissions(
      req.session, repositoryUrl
    );
    await db.transaction(async (trx) => {
      let dbUser = null;
      if (req.session.user) {
        dbUser = await db.model('GitHubUser').incrementMetric(
          { github_id: req.session.user.id }, 'snaps_added', 1,
          { transacting: trx }
        );
      }
      await db.model('Repository').addOrUpdate(
        { owner, name }, { registrant: dbUser }, { transacting: trx }
      );

      const result = await requestNewSnap(repositoryUrl);
      // as new snap is created we need to clear list of snaps from cache
      await clearSnapCache(repositoryUrl);

      const snapUrl = result.self_link;
      logger.info(`Created ${snapUrl}`);
      await ensureWebhook(result);
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
  for await (const entry of entries) {
    if (entry.owner_link.endsWith(`/~${username}`)) {
      await getMemcached().set(cacheId, entry, 3600);
      return entry;
    }
  }
  throw new PreparedError(404, RESPONSE_SNAP_NOT_FOUND);
};

const internalFindSnaps = async (owner, token) => {
  const orgs = await internalListOrganizations(owner, token);
  const owners = [owner].concat(orgs.map((org) => org.login));
  const urlPrefixes = owners.map(getRepoUrlPrefix);
  const username = conf.get('LP_API_USERNAME');
  const cacheIds = urlPrefixes.map(getUrlPrefixCacheId);
  const memcached = getMemcached();
  const lpClient = getLaunchpad();
  let snaps;
  let remainingPrefixes;

  try {
    // For each prefix, check for snaps in memcached.
    const snapsByPrefix = await Promise.all(
      cacheIds.map((cacheId) => memcached.get(cacheId))
    );
    // Flatten the results from memcached into a single list of all the
    // snaps we know about so far.
    snaps = [].concat(
      ...(snapsByPrefix.filter((snaps) => snaps !== undefined))
    );
    // Work out which prefixes have no entries in memcached and thus need to
    // be checked with Launchpad.
    remainingPrefixes = zip(urlPrefixes, snapsByPrefix)
      .filter(([, snaps]) => snaps === undefined)
      .map(([urlPrefix, ]) => urlPrefix);

    if (!remainingPrefixes.length) {
      return snaps.map((entry) => {
        return lpClient.wrap_resource(entry.self_link, entry);
      });
    }
  } catch (error) {
    logger.error(`Error getting one of ${cacheIds} from memcached: ${error}`);
    snaps = [];
    remainingPrefixes = urlPrefixes;
  }

  const result = await lpClient.named_get('/+snaps', 'findByURLPrefixes', {
    parameters: {
      url_prefixes: remainingPrefixes,
      owner: `/~${username}`
    }
  });
  // Split up results into separate cache entries so that they can help
  // speed things up for other users in the same organizations.
  const newSnapsByPrefix = remainingPrefixes.map((urlPrefix) => {
    return result.entries.filter(
      (snap) => snap.git_repository_url.startsWith(urlPrefix)
    );
  });
  await Promise.all(zip(remainingPrefixes, newSnapsByPrefix).map(
    ([urlPrefix, newSnaps]) => memcached.set(
      getUrlPrefixCacheId(urlPrefix), newSnaps, 3600
    )
  ));
  snaps = snaps.concat(result.entries);
  // ensure LP webhook is set up for all the snaps
  // but batch it by 10 not to overload LP servers
  const BATCH_SIZE = 10;
  for (let i=0; i < snaps.length; i += BATCH_SIZE) {
    const batch = snaps.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(snap => ensureWebhook(snap)));
  }
  return snaps;
};

// If we haven't yet initialized metrics related to the number of snaps for
// this user, do that now making some reasonable assumptions about
// historical data.  This may under-report if somebody manages to accumulate
// more snaps than the Launchpad batch size (75) before triggering this, but
// that shouldn't happen in practice.
const initializeMetrics = async (trx, gitHubId, snaps) => {
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
        rowData.builds_requested === null ||
        rowData.builds_released === undefined ||
        rowData.builds_released === null) {
      // This is potentially quite an expensive piece of initialization, but
      // only the first time that a user who's been using the site since
      // before this code landed comes back, so some one-time expense is
      // tolerable.
      try {
        let buildsRequested = 0;
        let buildsReleased = 0;
        for (const snap of snaps) {
          const builds = await getLaunchpad().get(
            snap.builds_collection_link
          );
          buildsRequested += builds.total_size;
          if (rowData.builds_released === undefined ||
              rowData.builds_released === null) {
            for await (const build of builds) {
              if (build.store_upload_status === 'Uploaded') {
                buildsReleased += 1;
              }
            }
          }
        }
        if (rowData.builds_requested === undefined ||
            rowData.builds_requested === null) {
          row.set({ builds_requested: buildsRequested });
        }
        if (rowData.builds_released === undefined ||
            rowData.builds_released === null) {
          row.set({ builds_released: buildsReleased });
        }
      } catch (error) {
        logger.error(`Failed to fetch builds from Launchpad: ${error}`);
      }
    }
    await row.save({}, { transacting: trx });
  }
};

// Keep the database up to date with a `findSnaps` response, for the sake of
// metrics.
const updateDatabaseSnaps = async (trx, snaps) => {
  const owners = uniq(snaps.map((snap) => {
    return parseGitHubRepoUrl(snap.git_repository_url).owner;
  }));
  const dbRepositories = await db.model('Repository')
    .where('owner', 'in', owners)
    .fetchAll({ transacting: trx });
  const dbRepositoriesByFullName = keyBy(dbRepositories.models, (repo) => {
    return `${repo.get('owner')}/${repo.get('name')}`;
  });
  for (const snap of snaps) {
    const { owner, name, fullName } = parseGitHubRepoUrl(
      snap.git_repository_url
    );
    await db.model('Repository').addOrUpdate(
      dbRepositoriesByFullName[fullName] || { owner, name }, {
        snapcraft_name: (
          (snap.snapcraft_data && snap.snapcraft_data.name) || null
        ),
        store_name: snap.store_name || null
      }, { transacting: trx }
    );
  }
};

export const getGitBranch = async (snap, token) => {
  if (snap.git_path === 'HEAD') {
    return await getDefaultBranch(snap.git_repository_url, token);
  } else {
    return snap.git_path.replace(/^refs\/heads\//, '');
  }
};

const getSnapRepoData = async(snap, token) => {
  let gitBranch, snapcraftData, gitBranchError, snapcraftDataError;

  [gitBranch, snapcraftData] = await Promise.all([
    // explicit return of undefined in case of error to avoid arrow function
    // implicit return (of error object)
    getGitBranch(snap, token)
      .catch(e => { gitBranchError = e; return; }),
    getSnapcraftData(snap.git_repository_url, token)
      .catch(e => { snapcraftDataError = e; return; })
  ]);

  const error = gitBranchError || snapcraftDataError;

  if (error) {
    logger.error(`Error while fetching data of ${snap.git_repository_url}: ${error}`);

    if (error.status && error.body) {
      // if it's PreparedError (with status code and body) return whole JSON
      snapcraftData = {
        error
      };
    } else if (error.message) {
      snapcraftData = {
        error: error.message
      };
    } else {
      snapcraftData = {
        error: `Error while fetching data of ${snap.git_repository_url}`
      };
    }
  }

  return {
    gitBranch,
    snapcraftData
  };
};

export const findSnaps = async (req, res) => {
  if (!req.session || !req.session.token) {
    return res.status(401).send(RESPONSE_NOT_LOGGED_IN);
  }

  const owner = req.query.owner || req.session.user.login;
  try {
    const rawSnaps = await internalFindSnaps(owner, req.session.token);
    const snaps = await Promise.all(rawSnaps.map(async (snap) => {

      let { gitBranch, snapcraftData } = await getSnapRepoData(snap, req.session.token);

      return {
        ...snap,
        git_branch: gitBranch,
        snapcraft_data: snapcraftData
      };
    }));
    await db.transaction(async (trx) => {
      if (req.session.user) {
        const ownedSnaps = snaps.filter((snap) => {
          const snapOwner = parseGitHubRepoUrl(snap.git_repository_url).owner;
          return snapOwner === owner;
        });
        await initializeMetrics(trx, req.session.user.id, ownedSnaps);
      }
      await updateDatabaseSnaps(trx, snaps);
    });
    return res.status(200).send({
      status: 'success',
      code: 'snaps-found',
      ...normalize(snaps, schema.snapList)
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const findSnap = async (req, res) => {
  if (!req.session || !req.session.token) {
    return res.status(401).send(RESPONSE_NOT_LOGGED_IN);
  }

  try {
    const snap = await internalFindSnap(req.query.repository_url);

    let { gitBranch, snapcraftData } = await getSnapRepoData(snap, req.session.token);

    snap.git_branch = gitBranch;
    snap.snapcraft_data = snapcraftData;

    const normalizedSnap = normalize(snap, schema.snap);

    return res.status(200).send({
      status: 'success',
      code: 'snap-found',
      ...normalizedSnap
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const clearSnapCache = (repositoryUrl) => {
  const repository = parseGitHubRepoUrl(repositoryUrl);
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
    const { owner, name } = await checkAdminPermissions(
      req.session, repositoryUrl
    );
    const result = await internalFindSnap(repositoryUrl);
    // Registration happened a short while ago; we increment the metric here
    // in order to support having the client call `register-name` on the
    // store directly rather than going via our backend.  As such, we don't
    // need to roll this back if authorization fails.
    await db.transaction(async (trx) => {
      let dbUser = null;
      if (req.session && req.session.user) {
        dbUser = await db.model('GitHubUser').incrementMetric(
          { github_id: req.session.user.id }, 'names_registered', 1,
          { transacting: trx }
        );
      }
      await db.model('Repository').addOrUpdate(
        { owner, name }, { registrant: dbUser , store_name: snapName },
        { transacting: trx }
      );
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

export async function internalGetSnapBuilds(
  snap, start = 0, size = 10, options = {}
) {
  const builds = [];
  let gotItems = 0;

  if (options.withRequests && gotItems < size) {
    const buildRequests = await getLaunchpad().get(
      snap.pending_build_requests_collection_link, { start, size }
    );
    for await (const buildRequest of buildRequests) {
      builds.push(buildRequest);
      if (++gotItems >= size) {
        break;
      }
    }
    // XXX cjwatson 2018-10-01: We should also include previously-failed
    // build requests, since they might fail for reasons that the developer
    // needs to fix (e.g. malformed snapcraft.yaml).  Doing this in a
    // pagination-friendly way requires further work on the Launchpad APIs
    // we're using.
  }

  if (gotItems < size) {
    const pendingBuilds = await getLaunchpad().get(
      snap.pending_builds_collection_link, { start, size: size - gotItems }
    );
    for await (const build of pendingBuilds) {
      builds.push(build);
      if (++gotItems >= size) {
        break;
      }
    }
  }

  if (gotItems < size) {
    const completedBuilds = await getLaunchpad().get(
      snap.completed_builds_collection_link, { start, size: size - gotItems }
    );
    for await (const build of completedBuilds) {
      builds.push(build);
      if (++gotItems >= size) {
        break;
      }
    }
  }

  return builds;
}

async function internalGetBuildRequestAnnotations(builds) {
  if (builds.length === 0) {
    return {};
  }

  let build_request_annotations = {};

  const db_annotations = await db.model('BuildRequestAnnotation')
    .where('request_id', 'IN', builds.map(getSelfId))
    .fetchAll();

  for (const m of db_annotations.models) {
    build_request_annotations[m.get('request_id')] = {
      reason: m.get('reason')
    };
  }

  return build_request_annotations;
}

async function internalGetBuildAnnotations(builds) {
  if (builds.length === 0) {
    return {};
  }

  let build_annotations = {};

  const db_annotations = await db.model('BuildAnnotation')
    .where('build_id', 'IN', builds.map(getSelfId))
    .fetchAll({ withRelated: ['request'] });

  for (const m of db_annotations.models) {
    let reason = m.get('reason');
    if (reason === null) {
      const request_annotation = m.related('request');
      if (request_annotation) {
        reason = request_annotation.get('reason');
      }
    }
    if (reason !== null) {
      build_annotations[m.get('build_id')] = { reason };
    }
  }

  return build_annotations;
}

export const getSnapBuilds = async (req, res) => {
  const snapUrl = req.query.snap;

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

    const builds = await internalGetSnapBuilds(
      snap, req.query.start, req.query.size, { withRequests: true }
    );
    const build_request_annotations = await internalGetBuildRequestAnnotations(
      builds.filter(
        build => build.resource_type_link.endsWith('#snap_build_request')
      )
    );
    const build_annotations = await internalGetBuildAnnotations(
      builds.filter(build => build.resource_type_link.endsWith('#snap_build'))
    );

    return res.status(200).send({
      status: 'success',
      payload: {
        code: 'snap-builds-found',
        builds,
        build_request_annotations,
        build_annotations
      }
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const internalRequestSnapBuilds = async (snap, owner, name, reason) => {
  // Request builds, then make sure that auto_build is enabled so that
  // future push events will cause the webhook to dispatch builds.  Doing
  // things in this order ensures that Launchpad's internal
  // `SnapSet.makeAutoBuilds` code won't come along and dispatch an extra
  // set of builds between these two requests.
  const lpClient = getLaunchpad();
  const parameters = {
    archive: snap.auto_build_archive_link,
    pocket: snap.auto_build_pocket
  };
  if (snap.auto_build_channels !== null) {
    parameters['channels'] = snap.auto_build_channels;
  }
  const buildRequest = await lpClient.named_post(
    snap.self_link, 'requestBuilds', { parameters }
  );
  if (!snap.auto_build) {
    await lpClient.patch(snap.self_link, { auto_build: true });
  }

  // Record a build request annotation so that we know why these builds were
  // dispatched.  This is best-effort: we can't do this properly
  // transactionally (i.e. don't request builds if the DB connection fails)
  // because we don't know the request ID until we've issued the request.
  const buildRequestAnnotation = {
    request_id: getSelfId(buildRequest),
    reason
  };
  try {
    await db.transaction(async (trx) => {
      await db.model('BuildRequestAnnotation')
        .forge(buildRequestAnnotation)
        .save({}, { method: 'insert', transacting: trx });
    });
  } catch (error) {
    logger.error(
      'Error saving build request annotation for ' +
      `${buildRequestAnnotation.request_id}: ${error}`
    );
  }

  return buildRequest;
};

export const requestSnapBuilds = async (req, res) => {
  try {
    const { owner, name } = await checkAdminPermissions(
      req.session, req.body.repository_url
    );
    const reason = req.body.reason || BUILD_TRIGGERED_MANUALLY;
    const snap = await internalFindSnap(req.body.repository_url);
    const build_request = await internalRequestSnapBuilds(
      snap, owner, name, reason
    );
    const build_request_annotations = await internalGetBuildRequestAnnotations(
      [build_request]
    );

    return res.status(201).send({
      status: 'success',
      payload: {
        code: 'snap-builds-requested',
        builds: [build_request],
        build_request_annotations,
        build_annotations: {}
      }
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const deleteSnap = async (req, res) => {
  try {
    const { owner, name } = parseGitHubRepoUrl(req.body.repository_url);

    // check if user is an admin of the repo
    try {
      await checkAdminPermissions(req.session, req.body.repository_url);
    } catch (error) {
      // but ignore the error if repo is removed on GH
      if (error.status !== 404) {
        throw error;
      }
    }

    const snap = await internalFindSnap(req.body.repository_url);
    await db.transaction(async (trx) => {
      if (req.session.user) {
        await db.model('GitHubUser').incrementMetric(
          { github_id: req.session.user.id }, 'snaps_removed', 1,
          { transacting: trx }
        );
      }
      const dbRepository = await db.model('Repository')
        .where({ owner, name })
        .fetch({ transacting: trx });
      if (dbRepository) {
        await dbRepository.destroy({ transacting: trx });
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
