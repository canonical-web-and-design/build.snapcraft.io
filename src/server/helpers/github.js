/* Copyright 2016 Canonical Ltd.  This software is licensed under the
 * GNU Affero General Public License version 3 (see the file LICENSE).
 *
 * Helpers for interacting with GitHub.
 */

import request from 'request';

import { conf } from '../helpers/config';

const GITHUB_API_ENDPOINT = conf.get('GITHUB_API_ENDPOINT');
const HTTP_PROXY = conf.get('HTTP_PROXY');

export const requestGitHub = (options, callback) => {
  const params = {
    ...options,
    proxy: HTTP_PROXY
  };
  params.uri = GITHUB_API_ENDPOINT + params.uri;
  if (!params.headers) {
    params.headers = {};
  }
  params.headers['User-Agent'] = 'SnapcraftBuild';
  return request(params, callback);
};

requestGitHub.get = (uri, options, callback) => {
  const params = { ...options };
  params.uri = uri;
  params.method = 'GET';
  return requestGitHub(params, callback);
};

requestGitHub.post = (uri, options, callback) => {
  const params = { ...options };
  params.uri = uri;
  params.method = 'POST';
  return requestGitHub(params, callback);
};

export default requestGitHub;
