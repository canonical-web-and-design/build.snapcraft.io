import 'isomorphic-fetch';

import { conf } from '../helpers/config';

export const registerName = (req, res) => {
  const snapName = req.body.snap_name;
  const root = req.body.root;
  const discharge = req.body.discharge;

  return fetch(`${conf.get('STORE_API_URL')}/register-name/`, {
    method: 'POST',
    headers: {
      'Authorization': `Macaroon root="${root}", discharge="${discharge}"`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ snap_name: snapName })
  }).then((response) => {
    return response.json().then((json) => {
      return res.status(response.status).send(json);
    });
  });
};

export const getAccount = (req, res) => {
  const root = req.query.root;
  const discharge = req.query.discharge;

  return fetch(`${conf.get('STORE_API_URL')}/account`, {
    headers: {
      'Authorization': `Macaroon root="${root}", discharge="${discharge}"`,
      'Accept': 'application/json'
    }
  }).then((response) => {
    return response.json().then((json) => {
      return res.status(response.status).send(json);
    });
  });
};

export const patchAccount = (req, res) => {
  const shortNamespace = req.body.short_namespace;
  const root = req.body.root;
  const discharge = req.body.discharge;

  return fetch(`${conf.get('STORE_API_URL')}/account`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Macaroon root="${root}", discharge="${discharge}"`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ short_namespace: shortNamespace })
  }).then((response) => {
    return response.text().then((text) => {
      let json;
      if (text === '') {
        json = null;
      } else {
        json = JSON.parse(text);
      }
      return res.status(response.status).send(json);
    });
  });
};

export const signAgreement = (req, res) => {
  const latestTosAccepted = req.body.latest_tos_accepted;
  const root = req.body.root;
  const discharge = req.body.discharge;

  return fetch(`${conf.get('STORE_API_URL')}/agreement/`, {
    method: 'POST',
    headers: {
      'Authorization': `Macaroon root="${root}", discharge="${discharge}"`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ latest_tos_accepted: latestTosAccepted })
  }).then((response) => {
    return response.json().then((json) => {
      return res.status(response.status).send(json);
    });
  });
};
