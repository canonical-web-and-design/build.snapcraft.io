import 'isomorphic-fetch';

import { CALL_API } from '../middleware/call-api';

export const FETCH_SNAPS = 'FETCH_SNAP_REPOSITORIES';
export const FETCH_SNAPS_SUCCESS = 'FETCH_SNAPS_SUCCESS';
export const FETCH_SNAPS_ERROR = 'FETCH_SNAPS_ERROR';
export const REMOVE_SNAP = 'REMOVE_SNAP';
export const REMOVE_SNAP_SUCCESS = 'REMOVE_SNAP_SUCCESS';
export const REMOVE_SNAP_ERROR = 'REMOVE_SNAP_ERROR';

export function fetchUserSnaps(owner) {
  return async (dispatch) => {
    const query = `owner=${encodeURIComponent(owner)}`;

    dispatch({
      type: FETCH_SNAPS,
      [CALL_API]: {
        types: [ FETCH_SNAPS_SUCCESS, FETCH_SNAPS_ERROR ],
        path: `/api/launchpad/snaps/list?${query}`,
        options: {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin'
        }
      }
    });
  };
}

export function removeSnap(repositoryUrl) {
  return async (dispatch) => {
    dispatch({
      type: REMOVE_SNAP,
      payload: { repository_url: repositoryUrl },
      [ CALL_API ]: {
        types: [ REMOVE_SNAP_SUCCESS, REMOVE_SNAP_ERROR ],
        path: '/api/launchpad/snaps/delete',
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repository_url: repositoryUrl }),
          credentials: 'same-origin'
        }
      }
    });
  };
}
