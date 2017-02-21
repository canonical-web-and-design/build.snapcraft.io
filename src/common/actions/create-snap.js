import 'isomorphic-fetch';
import localforage from 'localforage';
import { MacaroonsBuilder } from 'macaroons.js';

import { APICompatibleError, checkStatus, getError } from '../helpers/api';
import { conf } from '../helpers/config';

const BASE_URL = conf.get('BASE_URL');

export const SET_GITHUB_REPOSITORY = 'SET_GITHUB_REPOSITORY';
export const CREATE_SNAPS_START = 'CREATE_SNAPS_START';
export const CREATE_SNAP = 'CREATE_SNAP';
export const CREATE_SNAP_SUCCESS = 'CREATE_SNAP_SUCCESS';
export const CREATE_SNAP_ERROR = 'CREATE_SNAP_ERROR';

// XXX cjwatson 2017-02-08: Hardcoded for now, but should eventually be
// configurable.
const STORE_SERIES = '16';
const STORE_CHANNELS = ['edge'];

export function setGitHubRepository(value) {
  return {
    type: SET_GITHUB_REPOSITORY,
    payload: value
  };
}

function getSnapName(owner, name) {
  return fetch(`${BASE_URL}/api/github/snapcraft-yaml/${owner}/${name}`, {
    headers: { 'Accept': 'application/json' },
    credentials: 'same-origin'
  })
    .then(checkStatus)
    .then((response) => response.json().then((json) => {
      if (json.status !== 'success' ||
          json.payload.code !== 'snapcraft-yaml-found') {
        throw getError(response, json);
      }
      const snapcraftYaml = json.payload.contents;
      if (!('name' in snapcraftYaml)) {
        throw new APICompatibleError({
          code: 'snapcraft-yaml-no-name',
          message: 'snapcraft.yaml has no top-level "name" attribute'
        });
      }
      return snapcraftYaml.name;
    }));
}

function getPackageUploadMacaroon(snapName) {
  return localforage.getItem('package_upload_request')
    .catch(() => {
      throw new APICompatibleError({
        code: 'not-logged-into-store',
        message: 'Not logged into store',
        detail: 'No package_upload_request macaroons in local storage'
      });
    })
    .then((packageUploadRequest) => {
      let rootMacaroon;
      let dischargeMacaroon;
      try {
        rootMacaroon = MacaroonsBuilder.deserialize(packageUploadRequest.root);
        dischargeMacaroon = MacaroonsBuilder.deserialize(
            packageUploadRequest.discharge);
      } catch (e) {
        throw new APICompatibleError({
          code: 'not-logged-into-store',
          message: 'Not logged into store',
          detail: `Cannot deserialise package_upload_request macaroons: ${e}`
        });
      }
      const root = rootMacaroon.serialize();
      const discharge = MacaroonsBuilder.modify(rootMacaroon)
        .prepare_for_request(dischargeMacaroon)
        .getMacaroon()
        .serialize();
      return fetch(`${conf.get('STORE_API_URL')}/acl/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Macaroon root="${root}" discharge="${discharge}"`
        },
        body: JSON.stringify({
          packages: [{ name: snapName, series: STORE_SERIES }],
          permissions: ['package_upload'],
          channels: STORE_CHANNELS
        })
      });
    })
    .then((response) => response.json().then((json) => {
      if (response.status !== 200 || !json.macaroon) {
        throw new APICompatibleError({
          code: 'snap-name-not-registered',
          message: 'Snap name is not registered in the store',
          snap_name: snapName
        });
      }
      return json.macaroon;
    }));
}

export function createSnap(repository) {
  return (dispatch) => {
    const repositoryUrl = repository.url;
    if (repositoryUrl) {
      const { owner, name, fullName } = repository;

      dispatch({
        type: CREATE_SNAP,
        payload: { id: fullName }
      });

      let snapName;
      let packageUploadMacaroon;
      return getSnapName(owner, name)
        .then((foundSnapName) => {
          snapName = foundSnapName;
          return getPackageUploadMacaroon(snapName);
        })
        .then((macaroon) => {
          packageUploadMacaroon = macaroon;
          return fetch(`${BASE_URL}/api/launchpad/snaps`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              repository_url: repositoryUrl,
              snap_name: snapName,
              series: STORE_SERIES,
              channels: STORE_CHANNELS
            }),
            credentials: 'same-origin'
          });
        })
        .then(checkStatus)
        .then(() => {
          return fetch(`${BASE_URL}/api/launchpad/snaps/authorize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              repository_url: repositoryUrl,
              macaroon: packageUploadMacaroon
            }),
            credentials: 'same-origin'
          });
        })
        .then(checkStatus)
        .then(() => dispatch(createSnapSuccess(fullName)))
        .catch((error) => dispatch(createSnapError(fullName, error)));
    }
  };
}

export function createSnaps(repositories) {
  return (dispatch) => {
    // Clear out any previous batch-creation state.
    dispatch({ type: CREATE_SNAPS_START });
    const promises = repositories.map(
      (repository) => dispatch(createSnap(repository))
    );
    return Promise.all(promises);
  };
}

export function createSnapSuccess(id) {
  return {
    type: CREATE_SNAP_SUCCESS,
    payload: { id }
  };
}

export function createSnapError(id, error) {
  return {
    type: CREATE_SNAP_ERROR,
    payload: {
      id,
      error
    },
    error: true
  };
}
