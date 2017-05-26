import 'isomorphic-fetch';

import { parseGitHubRepoUrl } from '../helpers/github-url';
import { CALL_API } from '../middleware/call-api';

export const FETCH_BUILDS = 'FETCH_BUILDS';
export const FETCH_SNAP_SUCCESS = 'FETCH_SNAP_SUCCESS';
export const FETCH_BUILDS_SUCCESS = 'FETCH_BUILDS_SUCCESS';
export const FETCH_BUILDS_ERROR = 'FETCH_BUILDS_ERROR';

// Fetch snap info (selfLink) for given repository
export function fetchSnap(repositoryUrl) {
  return {
    payload: {
      id: repositoryUrl
    },
    [CALL_API]: {
      path: `/api/launchpad/snaps?repository_url=${encodeURIComponent(repositoryUrl)}`,
      types: [FETCH_BUILDS, FETCH_SNAP_SUCCESS]
    }
  };
}

// Fetch builds list for given snap
export function fetchBuilds(repositoryUrl, snapLink) {
  const { fullName } = parseGitHubRepoUrl(repositoryUrl);

  return {
    payload: {
      id: fullName
    },
    [CALL_API]: {
      path: `/api/launchpad/builds?snap=${encodeURIComponent(snapLink)}`,
      types: [FETCH_BUILDS, FETCH_BUILDS_SUCCESS, FETCH_BUILDS_ERROR],
      options: {
        credentials: 'same-origin'
      }
    }
  };
}

export function requestBuilds(repositoryUrl) {
  const { fullName } = parseGitHubRepoUrl(repositoryUrl);
  return {
    payload: {
      id: fullName
    },
    [CALL_API]: {
      path: '/api/launchpad/snaps/request-builds',
      types: [FETCH_BUILDS, FETCH_BUILDS_SUCCESS, FETCH_BUILDS_ERROR],
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({ repository_url: repositoryUrl })
      }
    }
  };
}
