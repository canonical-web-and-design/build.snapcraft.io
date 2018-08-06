import 'isomorphic-fetch';

import { getError } from '../helpers/api';
import { conf } from '../helpers/config';

import { requestRegisterName, getPackageUploadRequestMacaroon } from './register-name';

// action types
export const CHECK_NAME_OWNERSHIP_REQUEST = 'CHECK_NAME_OWNERSHIP_REQUEST';
export const CHECK_NAME_OWNERSHIP_SUCCESS = 'CHECK_NAME_OWNERSHIP_SUCCESS';
export const CHECK_NAME_OWNERSHIP_ERROR = 'CHECK_NAME_OWNERSHIP_ERROR';

// name ownership statuses
export const NAME_OWNERSHIP_NOT_REGISTERED = 'NAME_OWNERSHIP_NOT_REGISTERED';
export const NAME_OWNERSHIP_ALREADY_OWNED = 'NAME_OWNERSHIP_ALREADY_OWNED';
export const NAME_OWNERSHIP_REGISTERED_BY_OTHER_USER = 'NAME_OWNERSHIP_REGISTERED_BY_OTHER_USER';

export async function internalNameOwnership(root, discharge, snapName) {
  // first request package_upload macaroon to see if name is registered
  // in the store
  const url = `${conf.get('STORE_API_URL')}/acl/`;
  const aclResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      packages: [{ name: snapName }],
      permissions: ['package_upload']
    })
  });

  const aclJson = await aclResponse.json();

  if (aclResponse.status === 200 && aclJson.macaroon) {
    // name is registered, so try to register it (again) to find who owns it
    const registerResponse = await requestRegisterName(root, discharge, snapName);
    const registerJson = await registerResponse.json();

    // expected result is 409 Conflict, because name is already registered
    if (registerResponse.status === 409) {
      // if code is "already_owned" - current user already owns the name
      // otherwise (code is "already_registered" or else) name is owned by someone else
      return (registerJson.code === 'already_owned')
        ? NAME_OWNERSHIP_ALREADY_OWNED
        : NAME_OWNERSHIP_REGISTERED_BY_OTHER_USER;
    } else {
      // unexpected response from name register api
      throw getError(registerResponse, {
        status: 'error',
        code: 'unexpected-register-response',
        payload: registerJson
      });
    }
  } else {
    return NAME_OWNERSHIP_NOT_REGISTERED;
  }
}

export function checkNameOwnership(name) {
  if (!name) {
    throw new Error('Snap `name` is required param of `checkNameOwnership`');
  }

  return async (dispatch) => {
    dispatch({
      type: CHECK_NAME_OWNERSHIP_REQUEST,
      payload: { name }
    });

    try {
      const { root, discharge } = await getPackageUploadRequestMacaroon();
      const status = await internalNameOwnership(root, discharge, name);

      dispatch({
        type: CHECK_NAME_OWNERSHIP_SUCCESS,
        payload: { name, status }
      });
    } catch (error) {
      dispatch({
        type: CHECK_NAME_OWNERSHIP_ERROR,
        error: true,
        payload: { name, error }
      });
    }
  };
}
