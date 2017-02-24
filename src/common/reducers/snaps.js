import * as ActionTypes from '../actions/snaps';
import * as RegisterNameActionTypes from '../actions/register-name';
import { getGitHubRepoUrl } from '../helpers/github-url';

function findSnapByFullName(snaps, fullName) {
  const snap = snaps.filter((snap) => {
    return snap.git_repository_url === getGitHubRepoUrl(fullName);
  })[0];

  return snap;
}

function updateRegisteredName(snaps, fullName, snapName) {
  if (!snaps) {
    return snaps;
  }

  const updatedSnaps = [ ...snaps ]; // copy snaps array
  const snap = findSnapByFullName(updatedSnaps, fullName);
  const index = updatedSnaps.indexOf(snap);

  if (snap && index !== -1) {
    // change snap at correct index with new updated snap object
    updatedSnaps[index] = { ...snap, store_name: snapName };
  }

  return updatedSnaps;
}

export function snaps(state = {
  isFetching: false,
  success: false,
  error: null,
  snaps: null,
}, action) {
  switch(action.type) {
    case ActionTypes.FETCH_SNAPS:
      return {
        ...state,
        isFetching: true,
        success: false,
        error: null
      };
    case ActionTypes.FETCH_SNAPS_SUCCESS:
      return {
        ...state,
        isFetching: false,
        success: true,
        snaps: [
          ...action.payload
        ],
        error: null
      };
    case ActionTypes.FETCH_SNAPS_ERROR:
      return {
        ...state,
        isFetching: false,
        success: false,
        error: action.payload
      };
    case RegisterNameActionTypes.REGISTER_NAME_SUCCESS:
      return {
        ...state,
        snaps: updateRegisteredName(state.snaps, action.payload.id, action.payload.snapName)
      };
    default:
      return state;
  }
}
