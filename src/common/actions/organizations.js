import { CALL_API } from '../middleware/call-api';

export const ORGANIZATIONS_REQUEST = 'ORGANIZATIONS_REQUEST';
export const ORGANIZATIONS_SUCCESS = 'ORGANIZATIONS_SUCCESS';
export const ORGANIZATIONS_FAILURE = 'ORGANIZATIONS_FAILURE';

export function fetchUserOrganizations(owner) {
  return {
    [CALL_API]: {
      types: [ORGANIZATIONS_REQUEST, ORGANIZATIONS_SUCCESS, ORGANIZATIONS_FAILURE],
      path: `/api/github/orgs?owner=${owner}`,
      options: {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin'
      }
    }
  };
}
