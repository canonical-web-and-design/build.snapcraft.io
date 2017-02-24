import 'isomorphic-fetch';
import localforage from 'localforage';
import { MacaroonsBuilder } from 'macaroons.js';
import moment from 'moment';
import qs from 'qs';
import url from 'url';

import { checkStatus } from '../helpers/api';
import { conf } from '../helpers/config';

const BASE_URL = conf.get('BASE_URL');

export const SIGN_INTO_STORE = 'SIGN_INTO_STORE';
export const SIGN_INTO_STORE_SUCCESS = 'SIGN_INTO_STORE_SUCCESS';
export const SIGN_INTO_STORE_ERROR = 'SIGN_INTO_STORE_ERROR';
export const GET_SSO_DISCHARGE = 'GET_SSO_DISCHARGE';
export const GET_SSO_DISCHARGE_SUCCESS = 'GET_SSO_DISCHARGE_SUCCESS';
export const GET_SSO_DISCHARGE_ERROR = 'GET_SSO_DISCHARGE_ERROR';
export const CHECK_SIGNED_INTO_STORE = 'CHECK_SIGNED_INTO_STORE';
export const CHECK_SIGNED_INTO_STORE_SUCCESS = 'CHECK_SIGNED_INTO_STORE_SUCCESS';
export const CHECK_SIGNED_INTO_STORE_ERROR = 'CHECK_SIGNED_INTO_STORE_ERROR';
export const SIGN_OUT_OF_STORE_ERROR = 'SIGN_OUT_OF_STORE_ERROR';

// Hardcoded since macaroons.js doesn't export these.
const CAVEAT_PACKET_TYPE_CID = 3;
const CAVEAT_PACKET_TYPE_VID = 4;
const CAVEAT_PACKET_TYPE_CL = 5;

export function* getCaveats(macaroon) {
  let currentCaveat = null;
  for (const caveatPacket of macaroon.caveatPackets) {
    switch (caveatPacket.type) {
      case CAVEAT_PACKET_TYPE_CID:
        if (currentCaveat !== null) {
          yield currentCaveat;
        }
        currentCaveat = {
          caveatId: caveatPacket.getValueAsText(),
          verificationKeyId: '',
          location: ''
        };
        break;
      case CAVEAT_PACKET_TYPE_VID:
        currentCaveat.verificationKeyId = caveatPacket.getValueAsText();
        break;
      case CAVEAT_PACKET_TYPE_CL:
        currentCaveat.location = caveatPacket.getValueAsText();
        break;
    }
  }
  if (currentCaveat !== null) {
    yield currentCaveat;
  }
}

export function extractExpiresCaveat(macaroon) {
  const storeLocation = url.parse(conf.get('STORE_API_URL')).host;
  for (const caveat of getCaveats(macaroon)) {
    if (caveat.verificationKeyId === '') {
      const parts = caveat.caveatId.split('|');
      if (parts[0] === storeLocation && parts[1] === 'expires') {
        return moment(parts[2]);
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

function getPackageUploadRequestPermission() {
  const lifetime = conf.get('STORE_PACKAGE_UPLOAD_REQUEST_LIFETIME');
  let caveatId;

  return fetch(`${conf.get('STORE_API_URL')}/acl/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      permissions: ['package_upload_request', 'edit_account'],
      channels: conf.get('STORE_ALLOWED_CHANNELS'),
      expires: moment()
        .add(lifetime, 'seconds')
        .format('YYYY-MM-DD[T]HH:mm:ss.SSS')
    })
  })
    .then((response) => response.json().then((json) => {
      if (response.status !== 200 || !json.macaroon) {
        throw new Error('The store did not return a valid macaroon.');
      }
      const rootRaw = json['macaroon'];
      const root = MacaroonsBuilder.deserialize(rootRaw);
      caveatId = extractSSOCaveat(root);
      return localforage.setItem('package_upload_request', {
        root: rootRaw,
      });
    }))
    .then(() => caveatId);
}

export function signIntoStore(location) { // location for tests
  return (dispatch) => {
    dispatch({ type: SIGN_INTO_STORE });

    return getPackageUploadRequestPermission()
      .then((caveatId) => {
        const loginQuery = {
          starting_url: (location || window.location).href,
          caveat_id: caveatId
        };
        (location || window.location).href =
          `${BASE_URL}/login/authenticate?${qs.stringify(loginQuery)}`;
      })
      .catch((error) => {
        dispatch(signIntoStoreError(error));
      });
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
  if (expires && expires <= moment()) {
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
  let dischargeRaw;
  return (dispatch) => {
    dispatch({ type: GET_SSO_DISCHARGE });

    return fetch(`${BASE_URL}/login/sso-discharge`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin'
    })
      .then(checkStatus)
      .then((response) => response.json())
      .then((json) => {
        dischargeRaw = json.payload.discharge;
        return localforage.getItem('package_upload_request');
      })
      .then((packageUploadRequest) => {
        if (packageUploadRequest === null) {
          throw new Error('No store root macaroon saved in local storage.');
        }
        checkPackageUploadRequest(packageUploadRequest.root, dischargeRaw);
        return localforage.setItem('package_upload_request', {
          ...packageUploadRequest,
          discharge: dischargeRaw
        });
      })
      .then(() => {
        // It's obviously better if this succeeds, but we can't do anything
        // useful about it if it fails; better to just let the user carry
        // on.
        return fetch(`${BASE_URL}/login/sso-discharge`, {
          method: 'DELETE',
          credentials: 'same-origin'
        }).catch(() => {});
      })
      .then(() => dispatch(getSSODischargeSuccess()))
      .catch((error) => dispatch(getSSODischargeError(error)));
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
  return (dispatch) => {
    dispatch({ type: CHECK_SIGNED_INTO_STORE });
    return localforage.getItem('package_upload_request')
      .then((packageUploadRequest) => {
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
        return dispatch(checkSignedIntoStoreSuccess(authenticated));
      })
      .catch((error) => dispatch(checkSignedIntoStoreError(error)));
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

export function signOut(location) { // location for tests
  return (dispatch) => {
    return localforage.removeItem('package_upload_request')
      .then(() => {
        (location || window.location).href = `${BASE_URL}/auth/logout`;
      })
      .catch((error) => dispatch(signOutError(error)));
  };
}

function signOutError(error) {
  return {
    type: SIGN_OUT_OF_STORE_ERROR,
    payload: error,
    error: true
  };
}
