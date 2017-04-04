import 'isomorphic-fetch';
import { MacaroonsBuilder } from 'macaroons.js';

import { getCaveats } from '../../common/helpers/macaroons';
import { conf } from '../helpers/config';
import logging from '../logging';

const logger = logging.getLogger('express');

const dumpCaveats = (rawMacaroon) => {
  const macaroon = MacaroonsBuilder.deserialize(rawMacaroon);
  const caveats = [];
  for (const caveat of getCaveats(macaroon)) {
    if (caveat.verificationKeyId === '') {
      caveats.push(caveat.caveatId);
    } else {
      caveats.push(`Discharge required from ${caveat.location}`);
    }
  }
  return caveats;
};

export const registerName = async (req, res) => {
  const snapName = req.body.snap_name;
  const root = req.body.root;
  const discharge = req.body.discharge;

  const url = `${conf.get('STORE_API_URL')}/register-name/`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Macaroon root="${root}", discharge="${discharge}"`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ snap_name: snapName })
  });
  const json = await response.json();
  if (response.status === 401) {
    // Debug https://github.com/canonical-ols/build.snapcraft.io/issues/527
    logger.info(`Failed to register name "${snapName}"`);
    logger.info(`Root macaroon: ${dumpCaveats(root)}`);
    logger.info(`Discharge macaroon: ${dumpCaveats(discharge)}`);
    logger.info(
      `WWW-Authenticate: ${response.headers.get('WWW-Authenticate')}`);
  }
  return res.status(response.status).send(json);
};

export const getAccount = async (req, res) => {
  const root = req.query.root;
  const discharge = req.query.discharge;

  const response = await fetch(`${conf.get('STORE_API_URL')}/account`, {
    headers: {
      'Authorization': `Macaroon root="${root}", discharge="${discharge}"`,
      'Accept': 'application/json'
    }
  });
  const json = await response.json();
  return res.status(response.status).send(json);
};

export const patchAccount = async (req, res) => {
  const shortNamespace = req.body.short_namespace;
  const root = req.body.root;
  const discharge = req.body.discharge;

  const response = await fetch(`${conf.get('STORE_API_URL')}/account`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Macaroon root="${root}", discharge="${discharge}"`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ short_namespace: shortNamespace })
  });
  const text = await response.text();
  let json;
  if (text === '') {
    json = null;
  } else {
    json = JSON.parse(text);
  }
  return res.status(response.status).send(json);
};

export const signAgreement = async (req, res) => {
  const latestTosAccepted = req.body.latest_tos_accepted;
  const root = req.body.root;
  const discharge = req.body.discharge;

  const response = await fetch(`${conf.get('STORE_API_URL')}/agreement/`, {
    method: 'POST',
    headers: {
      'Authorization': `Macaroon root="${root}", discharge="${discharge}"`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ latest_tos_accepted: latestTosAccepted })
  });
  const json = await response.json();
  return res.status(response.status).send(json);
};
