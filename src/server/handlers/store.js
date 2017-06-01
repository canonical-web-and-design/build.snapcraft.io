import 'isomorphic-fetch';
import qs from 'qs';

import { conf } from '../helpers/config';

const STORE_SEARCH_API_URL = conf.get('STORE_SEARCH_API_URL');

export const getSnapDetails = async (req, res) => {
  const snapName = req.params.name;

  const query = qs.stringify(req.query, {
    filter: ['fields', 'channel']
  });

  let fetchUrl = `${STORE_SEARCH_API_URL}/snaps/details/${snapName}`;
  if (query.length) {
    fetchUrl = `${fetchUrl}?${query}`;
  }

  try {
    const response = await fetch(fetchUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Ubuntu-Series': '16'
      }
    });
    const json = await response.json();

    res.status(response.status).send({
      status: json.error_list ? 'error' : 'success',
      ...json
    });
  } catch (error) {
    return res.status(500).send({
      status: 'error',
      code: 'store-cpi-api-failure',
      message: error.message
    });
  }
};
