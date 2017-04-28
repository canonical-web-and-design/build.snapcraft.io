import 'isomorphic-fetch';
import localforage from 'localforage';
import { MacaroonsBuilder } from 'macaroons.js';
import moment from 'moment';
import qs from 'qs';
import url from 'url';

import { checkStatus, getError, getMacaroonAuthHeader } from '../helpers/api';
import { conf } from '../helpers/config';
import { getCaveats } from '../helpers/macaroons';
import { getPackageUploadRequestMacaroon } from './register-name';

const BASE_URL = conf.get('BASE_URL');
const STORE_API_URL = conf.get('STORE_API_URL');

export const SIGN_INTO_STORE = 'SIGN_INTO_STORE';
export const SIGN_INTO_STORE_SUCCESS = 'SIGN_INTO_STORE_SUCCESS';
export const SIGN_INTO_STORE_ERROR = 'SIGN_INTO_STORE_ERROR';
export const GET_SSO_DISCHARGE = 'GET_SSO_DISCHARGE';
export const GET_SSO_DISCHARGE_SUCCESS = 'GET_SSO_DISCHARGE_SUCCESS';
export const GET_SSO_DISCHARGE_ERROR = 'GET_SSO_DISCHARGE_ERROR';
export const CHECK_SIGNED_INTO_STORE = 'CHECK_SIGNED_INTO_STORE';
export const CHECK_SIGNED_INTO_STORE_SUCCESS = 'CHECK_SIGNED_INTO_STORE_SUCCESS';
export const CHECK_SIGNED_INTO_STORE_ERROR = 'CHECK_SIGNED_INTO_STORE_ERROR';
export const GET_ACCOUNT_INFO = 'GET_ACCOUNT_INFO';
export const GET_ACCOUNT_INFO_SUCCESS = 'GET_ACCOUNT_INFO_SUCCESS';
export const GET_ACCOUNT_INFO_ERROR = 'GET_ACCOUNT_INFO_ERROR';
export const SIGN_AGREEMENT_SUCCESS = 'SIGN_AGREEMENT_SUCCESS';
export const SIGN_OUT_OF_STORE_ERROR = 'SIGN_OUT_OF_STORE_ERROR';

export function extractExpiresCaveat(macaroon) {
  const storeLocation = url.parse(STORE_API_URL).host;
  for (const caveat of getCaveats(macaroon)) {
    if (caveat.verificationKeyId === '') {
      const parts = caveat.caveatId.split('|');
      if (parts[0] === storeLocation && parts[1] === 'expires') {
        return moment.utc(parts[2]);
      }
    }
  }
}

export function extractSSOCaveat(macaroon) {
  const ssoLocation = url.parse(conf.get('UBUNTU_SSO_URL')).host;
  const ssoCaveats = [];
  for (const caveat of getCaveats(macaroon)) {
    if (caveat.verificationKeyId !== '' && caveat.location === ssoLocation) {
      ssoCaveats.push(caveat);
    }
  }
  if (ssoCaveats.length === 0) {
    throw new Error('Macaroon has no SSO caveats.');
  } else if (ssoCaveats.length > 1) {
    throw new Error('Macaroon has multiple SSO caveats.');
  }
  return ssoCaveats[0].caveatId;
}

async function getPackageUploadRequestPermission() {
  const lifetime = conf.get('STORE_PACKAGE_UPLOAD_REQUEST_LIFETIME');

  const response = await fetch(`${STORE_API_URL}/acl/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      permissions: ['package_upload_request', 'edit_account'],
      channels: conf.get('STORE_ALLOWED_CHANNELS'),
      expires: moment.utc()
        .add(lifetime, 'seconds')
        .format('YYYY-MM-DD[T]HH:mm:ss.SSS')
    })
  });
  // TODO: This needs better error handling see #691
  const json = await response.json();
  if (response.status !== 200 || !json.macaroon) {
    throw new Error('The store did not return a valid macaroon.');
  }
  const rootRaw = json['macaroon'];
  const root = MacaroonsBuilder.deserialize(rootRaw);
  const caveatId = extractSSOCaveat(root);
  await localforage.setItem('package_upload_request', { root: rootRaw });
  return caveatId;
}

export function signIntoStore(location) { // location for tests
  return async (dispatch) => {
    dispatch({ type: SIGN_INTO_STORE });

    try {
      const caveatId = await getPackageUploadRequestPermission();
      const loginQuery = {
        starting_url: (location || window.location).href,
        caveat_id: caveatId
      };
      (location || window.location).href =
        `${BASE_URL}/login/authenticate?${qs.stringify(loginQuery)}`;
    } catch (error) {
      dispatch(signIntoStoreError(error));
    }
  };
}

export function signIntoStoreError(error) {
  return {
    type: SIGN_INTO_STORE_ERROR,
    payload: error,
    error: true
  };
}

export function checkPackageUploadRequest(rootRaw, dischargeRaw) {
  // We can't do full verification here, but at least make sure that the
  // caveat ID matches.
  const root = MacaroonsBuilder.deserialize(rootRaw);
  const expires = extractExpiresCaveat(root);
  if (expires && expires <= moment.utc()) {
    throw new Error('Store root macaroon has expired.');
  }
  const caveatId = extractSSOCaveat(root);
  const discharge = MacaroonsBuilder.deserialize(dischargeRaw);
  if (discharge.identifier !== caveatId) {
    throw new Error('SSO discharge macaroon does not match store root ' +
                    'macaroon.');
  }
  return { root, discharge };
}

export function getSSODischarge() {
  return async (dispatch) => {
    dispatch({ type: GET_SSO_DISCHARGE });

    try {
      const response = await fetch(`${BASE_URL}/login/sso-discharge`, {
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
      });
      await checkStatus(response);
      const json = await response.json();
      const dischargeRaw = json.payload.discharge;
      const packageUploadRequest = await localforage.getItem(
        'package_upload_request'
      );
      if (packageUploadRequest === null) {
        throw new Error('No store root macaroon saved in local storage.');
      }
      checkPackageUploadRequest(packageUploadRequest.root, dischargeRaw);
      await localforage.setItem('package_upload_request', {
        ...packageUploadRequest,
        discharge: dischargeRaw
      });
      try {
        await fetch(`${BASE_URL}/login/sso-discharge`, {
          method: 'DELETE',
          credentials: 'same-origin'
        });
      } catch (error) {
        // It's obviously better if this succeeds, but we can't do anything
        // useful about it if it fails; better to just let the user carry
        // on.
      }
      dispatch(getSSODischargeSuccess());
    } catch (error) {
      dispatch(getSSODischargeError(error));
    }
  };
}

export function getSSODischargeSuccess() {
  return {
    type: GET_SSO_DISCHARGE_SUCCESS
  };
}

export function getSSODischargeError(error) {
  return {
    type: GET_SSO_DISCHARGE_ERROR,
    payload: error,
    error: true
  };
}

export function checkSignedIntoStore() {
  return async (dispatch) => {
    dispatch({ type: CHECK_SIGNED_INTO_STORE });
    try {
      const packageUploadRequest = await localforage.getItem(
        'package_upload_request'
      );
      let authenticated;
      if (packageUploadRequest === null) {
        authenticated = false;
      } else {
        try {
          checkPackageUploadRequest(
            packageUploadRequest.root, packageUploadRequest.discharge
          );
          authenticated = true;
        } catch (e) {
          authenticated = false;
        }
      }
      dispatch(checkSignedIntoStoreSuccess(authenticated));
    } catch (error) {
      dispatch(checkSignedIntoStoreError(error));
    }
  };
}

function checkSignedIntoStoreSuccess(authenticated) {
  return {
    type: CHECK_SIGNED_INTO_STORE_SUCCESS,
    payload: authenticated
  };
}

function checkSignedIntoStoreError(error) {
  return {
    type: CHECK_SIGNED_INTO_STORE_ERROR,
    payload: error,
    error: true
  };
}

async function fetchAccountInfo(root, discharge) {
  const authHeader = getMacaroonAuthHeader(root, discharge);
  const response = await fetch(`${STORE_API_URL}/account`, {
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/json'
    }
  });
  if (response.status >= 200 && response.status < 300) {
    return { signedAgreement: true, hasShortNamespace: true };
  } else {
    // TODO: This needs better error handling see #691
    const json = await response.json();
    const payload = json.error_list ? json.error_list[0] : json;
    if (response.status === 403 && payload.code === 'user-not-ready') {
      const data = { signedAgreement: null, hasShortNamespace: null };
      if (payload.message.indexOf('has not signed agreement') !== -1) {
        data.signedAgreement = false;
      }
      if (payload.message.indexOf('missing short namespace') !== -1) {
        data.hasShortNamespace = false;
      }
      return data;
    } else {
      throw getError(response, { status: 'error', payload });
    }
  }
}

async function setShortNamespace(root, discharge, userName) {
  const authHeader = getMacaroonAuthHeader(root, discharge);
  // Try setting the short namespace to the SSO username.  This may not
  // work, but it's the best we can do automatically.
  const response = await fetch(`${STORE_API_URL}/account`, {
    method: 'PATCH',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ short_namespace: userName })
  });

  if (response.status >= 200 && response.status < 300) {
    const data = await fetchAccountInfo(root, discharge);
    // fetchAccountInfo might not be able to work out whether a short
    // namespace is set in some cases, but we know it is since we just set
    // it.
    if (data.hasShortNamespace === null) {
      data.hasShortNamespace = true;
    }
    return data;
  } else {
    // TODO: This needs better error handling see #691
    const json = await response.json();
    const payload = json.error_list ? json.error_list[0] : json;
    if (response.status === 403 && payload.code === 'user-not-ready' &&
        payload.message.indexOf('has not signed agreement') !== -1) {
      return { signedAgreement: false, hasShortNamespace: false };
    } else {
      throw getError(response, { status: 'error', payload });
    }
  }
}

export function getAccountInfo(userName, macaroons) {
  return async (dispatch) => {
    dispatch({ type: GET_ACCOUNT_INFO });

    try {
      let root;
      let discharge;
      if (macaroons !== undefined) {
        ({ root, discharge } = macaroons);
      } else {
        ({ root, discharge } = await getPackageUploadRequestMacaroon());
      }
      let data = await fetchAccountInfo(root, discharge);
      if (data.hasShortNamespace === false) {
        data = await setShortNamespace(root, discharge, userName);
      }
      dispatch(getAccountInfoSuccess(data));
    } catch (error) {
      dispatch(getAccountInfoError(error));
    }
  };
}

function getAccountInfoSuccess(data) {
  return {
    type: GET_ACCOUNT_INFO_SUCCESS,
    payload: data
  };
}

function getAccountInfoError(error) {
  return {
    type: GET_ACCOUNT_INFO_ERROR,
    payload: error,
    error: true
  };
}

export function signAgreementSuccess() {
  return { type: SIGN_AGREEMENT_SUCCESS };
}

export function signOut(location) { // location for tests
  return async (dispatch) => {
    try {
      await localforage.removeItem('package_upload_request');
      (location || window.location).href = `${BASE_URL}/auth/logout`;
    } catch (error) {
      dispatch(signOutError(error));
    }
  };
}

function signOutError(error) {
  return {
    type: SIGN_OUT_OF_STORE_ERROR,
    payload: error,
    error: true
  };
}
