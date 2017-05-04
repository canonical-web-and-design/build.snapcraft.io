// initialised with server side rendered state

export const UPDATE_USER = 'UPDATE_USER';
import { ORGANIZATIONS_SUCCESS } from '../actions/organizations';

export function user(state = null, action) {
  switch(action.type) {
    case ORGANIZATIONS_SUCCESS:
      return {
        ...state,
        orgs: action.payload.response.orgs
      };
    // set individual user properties, useful for debugging
    case UPDATE_USER:
      return {
        ...state,
        ...action.payload
      };
    default:
      return state;
  }
}
