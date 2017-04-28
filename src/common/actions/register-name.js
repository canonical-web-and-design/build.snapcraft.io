import 'isomorphic-fetch';
import localforage from 'localforage';
import { MacaroonsBuilder } from 'macaroons.js';

import { APICompatibleError, checkStatus, getError } from '../helpers/api';
import { conf } from '../helpers/config';
import { checkPackageUploadRequest, getAccountInfo } from './auth-store';
import { requestBuilds } from './snap-builds';

const BASE_URL = conf.get('BASE_URL');

// action types
export const REGISTER_NAME = 'REGISTER_NAME';
export const REGISTER_NAME_SUCCESS = 'REGISTER_NAME_SUCCESS';
export const REGISTER_NAME_ERROR = 'REGISTER_NAME_ERROR';
export const REGISTER_NAME_CLEAR = 'REGISTER_NAME_CLEAR';

export const CHECK_NAME_OWNERSHIP_REQUEST = 'CHECK_NAME_OWNERSHIP_REQUEST';
export const CHECK_NAME_OWNERSHIP_SUCCESS = 'CHECK_NAME_OWNERSHIP_SUCCESS';
export const CHECK_NAME_OWNERSHIP_ERROR = 'CHECK_NAME_OWNERSHIP_ERROR';

// XXX cjwatson 2017-02-08: Hardcoded for now, but should eventually be
// configurable.
const STORE_SERIES = '16';
const STORE_CHANNELS = ['edge'];

// name ownership statuses
export const NAME_OWNERSHIP_NOT_REGISTERED = 'NAME_OWNERSHIP_NOT_REGISTERED';
export const NAME_OWNERSHIP_ALREADY_OWNED = 'NAME_OWNERSHIP_ALREADY_OWNED';
export const NAME_OWNERSHIP_REGISTERED_BY_OTHER_USER = 'NAME_OWNERSHIP_REGISTERED_BY_OTHER_USER';

export async function getPackageUploadRequestMacaroon() {
  let packageUploadRequest;
  try {
    packageUploadRequest = await localforage.getItem('package_upload_request');
  } catch (error) {
    packageUploadRequest = null;
  }
  if (packageUploadRequest === null) {
    throw new APICompatibleError({
      code: 'not-logged-into-store',
      message: 'Not logged into store',
      detail: 'No package_upload_request macaroons in local storage'
    });
  }
  let macaroons;
  try {
    macaroons = checkPackageUploadRequest(
      packageUploadRequest.root, packageUploadRequest.discharge
    );
  } catch (e) {
    throw new APICompatibleError({
      code: 'not-logged-into-store',
      message: 'Not logged into store',
      detail: `Checking package_upload_request macaroons failed: ${e}`
    });
  }
  const root = macaroons.root.serialize();
  const discharge = MacaroonsBuilder.modify(macaroons.root)
    .prepare_for_request(macaroons.discharge)
    .getMacaroon()
    .serialize();
  return { root, discharge };
}

async function signAgreement(root, discharge) {
  const response = await fetch(`${BASE_URL}/api/store/agreement`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      latest_tos_accepted: true,
      root,
      discharge
    })
  });
  if (response.status >= 200 && response.status < 300) {
    return null;
  } else {
    const json = await response.json();
    const payload = json.error_list ? json.error_list[0] : json;
    throw getError(response, { status: 'error', payload });
  }
}

async function requestRegisterName(root, discharge, snapName) {
  return await fetch(`${BASE_URL}/api/store/register-name`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      snap_name: snapName,
      root,
      discharge
    })
  });
}

export async function internalRegisterName(root, discharge, snapName) {
  const response = await requestRegisterName(root, discharge, snapName);

  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    const json = await response.json();
    if (response.status === 409 && json.code === 'already_owned') {
      return { status: 201 };
    } else {
      throw getError(response, { status: 'error', payload: json });
    }
  }
}

async function getPackageUploadMacaroon(root, discharge, snapName) {
  const response = await fetch(`${conf.get('STORE_API_URL')}/acl/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Macaroon root="${root}", discharge="${discharge}"`
    },
    body: JSON.stringify({
      packages: [{ name: snapName, series: STORE_SERIES }],
      permissions: ['package_upload'],
      channels: STORE_CHANNELS
    })
  });
  const json = await response.json();
  if (response.status !== 200 || !json.macaroon) {
    throw new APICompatibleError({
      code: 'snap-name-not-registered',
      message: 'Snap name is not registered in the store',
      snap_name: snapName
    });
  }
  return json.macaroon;
}

export function registerName(repository, snapName, options={}) {
  return async (dispatch) => {
    const { fullName } = repository;

    dispatch({
      type: REGISTER_NAME,
      payload: { id: fullName, snapName }
    });

    try {
      const { root, discharge } = await getPackageUploadRequestMacaroon();
      if (options.signAgreement) {
        await signAgreement(root, discharge);
        await dispatch(getAccountInfo(options.signAgreement, {
          root, discharge
        }));
      }
      await internalRegisterName(root, discharge, snapName, repository.url);
      const packageUploadMacaroon = await getPackageUploadMacaroon(
        root, discharge, snapName
      );
      const authorizeUrl = `${BASE_URL}/api/launchpad/snaps/authorize`;
      const response = await fetch(authorizeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repository_url: repository.url,
          snap_name: snapName,
          series: STORE_SERIES,
          channels: STORE_CHANNELS,
          macaroon: packageUploadMacaroon
        }),
        credentials: 'same-origin'
      });
      await checkStatus(response);
      await dispatch(registerNameSuccess(fullName, snapName));
      if (options.requestBuilds) {
        await dispatch(requestBuilds(repository.url));
      }
    } catch (error) {
      dispatch(registerNameError(fullName, error));
    }
  };
}

export function registerNameSuccess(id, snapName) {
  return {
    type: REGISTER_NAME_SUCCESS,
    payload: { id, snapName }
  };
}

export function registerNameError(id, error) {
  return {
    type: REGISTER_NAME_ERROR,
    payload: {
      id,
      error
    },
    error: true
  };
}

export function registerNameClear(id) {
  return {
    type: REGISTER_NAME_CLEAR,
    payload: {
      id
    }
  };
}

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

export function checkNameOwnership(id, snapName) {
  if (!id || !snapName) {
    throw new Error('Snap `id` and `snapName` are required params of `checkNameOwnership`');
  }

  return async (dispatch) => {
    dispatch({
      type: CHECK_NAME_OWNERSHIP_REQUEST,
      payload: { id, snapName }
    });

    try {
      const { root, discharge } = await getPackageUploadRequestMacaroon();
      const status = await internalNameOwnership(root, discharge, snapName);

      dispatch({
        type: CHECK_NAME_OWNERSHIP_SUCCESS,
        payload: { id, snapName, status }
      });
    } catch (error) {
      dispatch({
        type: CHECK_NAME_OWNERSHIP_ERROR,
        error: true,
        payload: { id, snapName, error: error }
      });
    }
  };
}
