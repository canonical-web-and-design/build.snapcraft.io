import 'isomorphic-fetch';

import { checkStatus, getError } from '../helpers/api';
import { conf } from '../helpers/config';
import { parseGitHubRepoUrl } from '../helpers/github-url';

const BASE_URL = conf.get('BASE_URL');

export const SET_GITHUB_REPOSITORY = 'SET_GITHUB_REPOSITORY';
export const CREATE_SNAP = 'CREATE_SNAP';
export const CREATE_SNAP_SUCCESS = 'CREATE_SNAP_SUCCESS';
export const CREATE_SNAP_ERROR = 'CREATE_SNAP_ERROR';

// XXX cjwatson 2017-02-08: Hardcoded for now, but should eventually be
// configurable.
export const STORE_SERIES = '16';
export const STORE_CHANNELS = ['edge'];

export function setGitHubRepository(value) {
  return {
    type: SET_GITHUB_REPOSITORY,
    payload: value
  };
}

// Just enough to satisfy higher-level code that might receive errors from
// our internal API or errors thrown directly from here.
class APICompatibleError extends Error {
  constructor(payload) {
    super(payload.message);
    this.json = { status: 'error', payload };
  }
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

export function createSnap(repositoryUrl, location) { // location for tests
  return (dispatch) => {
    if (repositoryUrl) {
      const { owner, name, fullName } = parseGitHubRepoUrl(repositoryUrl);

      dispatch({
        type: CREATE_SNAP,
        payload: { id: fullName }
      });

      return getSnapName(owner, name)
        .then((snapName) => {
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
        .then(response => {
          return response.json().then(result => {
            if (result.status !== 'success' ||
                result.payload.code !== 'snap-created') {
              throw getError(response, result);
            }
            const startingUrl = `${BASE_URL}/${fullName}/setup`;
            (location || window.location).href =
              `${BASE_URL}/login/authenticate` +
              `?starting_url=${encodeURIComponent(startingUrl)}` +
              `&caveat_id=${encodeURIComponent(result.payload.message)}` +
              `&repository_url=${encodeURIComponent(repositoryUrl)}`;
          });
        })
        .catch(error => {
          // if LP error says there is already such snap, just redirect to builds page
          if (error.message === 'There is already a snap package with the same name and owner.') {
            (location || window.location).href = `${BASE_URL}/${fullName}/builds`;
          } else {
            dispatch(createSnapError(fullName, error));
          }
        });
    }
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
