import 'isomorphic-fetch';
import localforage from 'localforage';
import { MacaroonsBuilder } from 'macaroons.js';

import { APICompatibleError, checkStatus } from '../helpers/api';
import { conf } from '../helpers/config';

const BASE_URL = conf.get('BASE_URL');

export const REGISTER_NAME = 'REGISTER_NAME';
export const REGISTER_NAME_SUCCESS = 'REGISTER_NAME_SUCCESS';
export const REGISTER_NAME_ERROR = 'REGISTER_NAME_ERROR';

export function registerName(fullName, snapName) {
  return (dispatch) => {
    dispatch({
      type: REGISTER_NAME,
      payload: { id: fullName, snapName }
    });

    return localforage.getItem('package_upload_request')
      .catch(() => {
        throw new APICompatibleError({
          code: 'not-logged-into-store',
          message: 'Not logged into store',
          detail: 'No package_upload_request macaroons in local storage'
        });
      })
      .then((packageUploadRequest) => {
        let rootMacaroon;
        let dischargeMacaroon;
        try {
          rootMacaroon = MacaroonsBuilder.deserialize(
              packageUploadRequest.root);
          dischargeMacaroon = MacaroonsBuilder.deserialize(
              packageUploadRequest.discharge);
        } catch (e) {
          throw new APICompatibleError({
            code: 'not-logged-into-store',
            message: 'Not logged into store',
            detail: `Cannot deserialise package_upload_request macaroons: ${e}`
          });
        }
        const root = rootMacaroon.serialize();
        const discharge = MacaroonsBuilder.modify(rootMacaroon)
          .prepare_for_request(dischargeMacaroon)
          .getMacaroon()
          .serialize();
        return fetch(`${BASE_URL}/api/store/register-name`, {
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
      })
      .then(checkStatus)
      .catch((error) => {
        const response = error.response;
        if (response && response.status === 409 &&
            error.json.code === 'already_owned') {
          return { status: 201 };
        }
        throw error;
      })
      .then(() => dispatch(registerNameSuccess(fullName)))
      .catch((error) => dispatch(registerNameError(fullName, error)));
  };
}

export function registerNameSuccess(id) {
  return {
    type: REGISTER_NAME_SUCCESS,
    payload: { id }
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
