import 'isomorphic-fetch';
import localforage from 'localforage';
import { MacaroonsBuilder } from 'macaroons.js';
import url from 'url';

import { checkStatus } from '../helpers/api';
import { conf } from '../helpers/config';

const BASE_URL = conf.get('BASE_URL');

export const GET_SSO_DISCHARGE = 'GET_SSO_DISCHARGE';
export const GET_SSO_DISCHARGE_SUCCESS = 'GET_SSO_DISCHARGE_SUCCESS';
export const GET_SSO_DISCHARGE_ERROR = 'GET_SSO_DISCHARGE_ERROR';

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
        // We can't do full verification here, but at least make sure that
        // the caveat ID matches.
        if (packageUploadRequest === null) {
          throw new Error('No store root macaroon saved in local storage.');
        }
        const root = MacaroonsBuilder.deserialize(packageUploadRequest.root);
        const caveatId = extractSSOCaveat(root);
        const discharge = MacaroonsBuilder.deserialize(dischargeRaw);
        if (discharge.identifier !== caveatId) {
          throw new Error('SSO discharge macaroon does not match store root ' +
                          'macaroon.');
        }
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
