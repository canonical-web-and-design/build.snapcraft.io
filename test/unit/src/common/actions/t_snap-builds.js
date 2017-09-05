import expect from 'expect';

import {
  fetchSnap,
  fetchBuilds,
  requestBuilds
} from '../../../../../src/common/actions/snap-builds';
import * as ActionTypes from '../../../../../src/common/actions/snap-builds';
import { CALL_API } from '../../../../../src/common/middleware/call-api';

describe('snap builds actions', () => {
  let action;

  const repo = 'dummy/repo';
  const repositoryUrl = `https://github.com/${repo}`;

  context('fetchBuilds', () => {
    const snapUrl = 'https://api.launchpad.net/devel/~foo/+snap/bar';
    let action;

    beforeEach(() => {
      action = fetchBuilds(repositoryUrl, snapUrl);
    });

    it('should supply a path', () => {
      expect(action[CALL_API].path).toEqual(
        `/api/launchpad/builds?snap=${encodeURIComponent(snapUrl)}`
      );
    });

    it('should supply request, success and failure action types', () => {
      expect(action[CALL_API].types).toEqual([
        ActionTypes.FETCH_BUILDS,
        ActionTypes.FETCH_BUILDS_SUCCESS,
        ActionTypes.FETCH_BUILDS_ERROR
      ]);
    });

    it('should set the credentials option to same-origin', () => {
      expect(action[CALL_API].options.credentials).toEqual('same-origin');
    });

    it('should supply a payload containing the repo full-name', () => {
      expect(action.payload.id).toEqual(repo);
    });
  });

  context('fetchSnap', () => {
    beforeEach(() => {
      action = fetchSnap(repositoryUrl);
    });

    it('should supply a path', () => {
      expect(action[CALL_API].path).toEqual(
        `/api/launchpad/snaps?repository_url=${encodeURIComponent(repositoryUrl)}`
      );
    });

    it('should supply request, success and failure action types', () => {
      expect(action[CALL_API].types).toEqual([
        ActionTypes.FETCH_BUILDS,
        ActionTypes.FETCH_SNAP_SUCCESS
      ]);
    });

    it('should supply a payload containing the repo full-name', () => {
      expect(action.payload.id).toEqual(repositoryUrl);
    });
  });

  context('requestBuilds', () => {
    let action;

    beforeEach(() => {
      action = requestBuilds(repositoryUrl);
    });

    it('should supply a path', () => {
      expect(action[CALL_API].path).toEqual(
        '/api/launchpad/snaps/request-builds'
      );
    });

    it('should supply request, success and failure action types', () => {
      expect(action[CALL_API].types).toEqual([
        ActionTypes.FETCH_BUILDS,
        ActionTypes.REQUEST_BUILDS_SUCCESS,
        ActionTypes.FETCH_BUILDS_ERROR
      ]);
    });

    it('should set the credentials option to same-origin', () => {
      expect(action[CALL_API].options.credentials).toEqual('same-origin');
    });

    it('should set the HTTP request method option to POST', () => {
      expect(action[CALL_API].options.method).toEqual('POST');
    });

    it('should set the Content-Type request header to "application/json"', () => {
      expect(action[CALL_API].options.headers['Content-Type']).toEqual('application/json');
    });

    it('should supply a request body containing the repo name', () => {
      expect(action[CALL_API].options.body).toEqual(
        JSON.stringify({ repository_url: repositoryUrl })
      );
    });

    it('should supply a payload containing the repo full-name', () => {
      expect(action.payload.id).toEqual(repo);
    });
  });
});
