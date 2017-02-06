/* Copyright 2016 Canonical Ltd.  This software is licensed under the
 * GNU Affero General Public License version 3 (see the file LICENSE).
 *
 * Helpers for interacting with GitHub.
 */

import request from 'request';
import url from 'url';

import { conf } from '../helpers/config';

const GITHUB_API_ENDPOINT = conf.get('GITHUB_API_ENDPOINT');
const HTTP_PROXY = conf.get('HTTP_PROXY');

export const requestGitHub = (options) => {
  return new Promise((resolve, reject) => {
    const params = {
      ...options,
      proxy: HTTP_PROXY
    };
    params.uri = GITHUB_API_ENDPOINT + params.uri;
    if (!params.headers) {
      params.headers = {};
    }
    if (params.token) {
      params.headers['Authorization'] = `token ${params.token}`;
      delete params.token;
    } else {
      // Make request with service authorisation rather than user
      // authorisation.  This should be kept to a minimum because GitHub
      // imposes a rate limit on each authorisation token, and so a central
      // service-level authorisation token doesn't scale well to a large
      // number of users.
      const parsedUri = url.parse(params.uri, true);
      delete parsedUri.search;
      parsedUri.query.client_id = conf.get('GITHUB_AUTH_CLIENT_ID');
      parsedUri.query.client_secret = conf.get('GITHUB_AUTH_CLIENT_SECRET');
      params.uri = url.format(parsedUri);
    }
    params.headers['User-Agent'] = 'SnapcraftBuild';
    request(params, (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
};

requestGitHub.get = (uri, options) => {
  const params = { ...options, uri, method: 'GET' };
  return requestGitHub(params);
};

requestGitHub.post = (uri, options) => {
  const params = { ...options, uri, method: 'POST' };
  return requestGitHub(params);
};

export default requestGitHub;
