import 'isomorphic-fetch';
import qs from 'qs';

import { CALL_API } from '../middleware/call-api';

export const FETCH_SNAPS = 'FETCH_SNAP_REPOSITORIES';
export const FETCH_SNAPS_SUCCESS = 'FETCH_SNAPS_SUCCESS';
export const FETCH_SNAPS_ERROR = 'FETCH_SNAPS_ERROR';
export const REMOVE_SNAP = 'REMOVE_SNAP';
export const REMOVE_SNAP_SUCCESS = 'REMOVE_SNAP_SUCCESS';
export const REMOVE_SNAP_ERROR = 'REMOVE_SNAP_ERROR';
export const FETCH_SNAP_DETAILS = 'FETCH_SNAP_DETAILS';
export const FETCH_SNAP_DETAILS_SUCCESS = 'FETCH_SNAP_DETAILS_SUCCESS';
export const FETCH_SNAP_DETAILS_ERROR = 'FETCH_SNAP_DETAILS_ERROR';

export function fetchUserSnaps(owner) {
  const query = `owner=${encodeURIComponent(owner)}`;

  return {
    [CALL_API]: {
      types: [ FETCH_SNAPS, FETCH_SNAPS_SUCCESS, FETCH_SNAPS_ERROR ],
      path: `/api/launchpad/snaps/list?${query}`,
      options: {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin'
      }
    }
  };
}

export function removeSnap(repositoryUrl) {
  return {
    payload: { repository_url: repositoryUrl },
    [ CALL_API ]: {
      types: [ REMOVE_SNAP, REMOVE_SNAP_SUCCESS, REMOVE_SNAP_ERROR ],
      path: '/api/launchpad/snaps/delete',
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repository_url: repositoryUrl }),
        credentials: 'same-origin'
      }
    }
  };
}

export function fetchSnapStableRelease(repositoryUrl, snapName) {
  const query = qs.stringify({
    channel: 'stable',
    fields: 'name,revision'
  });

  return {
    payload: { id: repositoryUrl },
    [ CALL_API ]: {
      types: [ FETCH_SNAP_DETAILS, FETCH_SNAP_DETAILS_SUCCESS, FETCH_SNAP_DETAILS_ERROR ],
      path: `/api/snaps/details/${encodeURIComponent(snapName)}?${query}`,
      options: {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin'
      }
    }
  };
}
