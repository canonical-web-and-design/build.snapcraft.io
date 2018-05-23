import 'isomorphic-fetch';
import localforage from 'localforage';
import { MacaroonsBuilder } from 'macaroons.js';

import { APICompatibleError, checkStatus, getError, getMacaroonAuthHeader } from '../helpers/api';
import { conf } from '../helpers/config';
import { checkPackageUploadRequest, getAccountInfo } from './auth-store';
import { requestBuilds } from './snap-builds';
import { authExpired } from './auth-error';

const BASE_URL = conf.get('BASE_URL');
const STORE_API_URL = conf.get('STORE_API_URL');

// action types
export const REGISTER_NAME = 'REGISTER_NAME';
export const REGISTER_NAME_SUCCESS = 'REGISTER_NAME_SUCCESS';
export const REGISTER_NAME_ERROR = 'REGISTER_NAME_ERROR';
export const REGISTER_NAME_CLEAR = 'REGISTER_NAME_CLEAR';

// XXX cjwatson 2017-02-08: Hardcoded for now, but should eventually be
// configurable.
export const STORE_SERIES = '16';
export const STORE_CHANNELS = ['edge'];

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
  const authHeader = getMacaroonAuthHeader(root, discharge);
  const response = await fetch(`${STORE_API_URL}/agreement/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': authHeader,
    },
    body: JSON.stringify({
      latest_tos_accepted: true,
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

export async function requestRegisterName(root, discharge, snapName) {
  const authHeader = getMacaroonAuthHeader(root, discharge);
  return await fetch(`${STORE_API_URL}/register-name/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': authHeader,
    },
    body: JSON.stringify({
      snap_name: snapName,
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
  const authHeader = getMacaroonAuthHeader(root, discharge);
  const response = await fetch(`${STORE_API_URL}/acl/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': authHeader,
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
      // detect if session has expired in the meantime
      if (error.response && error.response.status === 401) {
        dispatch(authExpired(error));
      }
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
