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
