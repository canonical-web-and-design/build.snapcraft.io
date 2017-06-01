import expect from 'expect';

import {
  fetchSnapStableRelease,
  fetchUserSnaps,
  removeSnap
} from '../../../../../src/common/actions/snaps';
import * as ActionTypes from '../../../../../src/common/actions/snaps';
import { CALL_API } from '../../../../../src/common/middleware/call-api';

describe('repositories actions', () => {
  context('fetchUserSnaps', () => {
    it('should supply request, success and failure actions when invoking CALL_API', () => {
      expect(fetchUserSnaps('anowner')[CALL_API].types).toEqual([
        ActionTypes.FETCH_SNAPS,
        ActionTypes.FETCH_SNAPS_SUCCESS,
        ActionTypes.FETCH_SNAPS_ERROR
      ]);
    });

    it('should supply a request schema with a path containing the repo URL', () => {
      expect(fetchUserSnaps('anowner')[CALL_API].path).toInclude('anowner');
    });
  });

  context('removeSnap', () => {
    it('should supply request, success and failure actions when invoking CALL_API', () => {
      expect(removeSnap('https://github.com/anowner/aname')[CALL_API].types).toEqual([
        ActionTypes.REMOVE_SNAP,
        ActionTypes.REMOVE_SNAP_SUCCESS,
        ActionTypes.REMOVE_SNAP_ERROR
      ]);
    });

    it('should supply a payload with the repository to be deleted', () => {
      const repositoryUrl = 'https://github.com/anowner/aname';
      expect(removeSnap(repositoryUrl).payload.repository_url).toEqual(repositoryUrl);
    });

    it('should supply request schema with a body containing the repo URL', () => {
      const repositoryUrl = 'https://github.com/anowner/aname';
      expect(removeSnap(repositoryUrl)[CALL_API].options.body).toInclude(repositoryUrl);
    });
  });

  context('fetchSnapStableRelease', () => {
    const repositoryUrl = 'https://github.com/anowner/aname';
    const snapName = 'test-snap';

    let action;

    beforeEach(() => {
      action = fetchSnapStableRelease(repositoryUrl, snapName);
    });

    it('should supply request, success and failure actions when invoking CALL_API', () => {
      expect(action[CALL_API].types).toEqual([
        ActionTypes.FETCH_SNAP_DETAILS,
        ActionTypes.FETCH_SNAP_DETAILS_SUCCESS,
        ActionTypes.FETCH_SNAP_DETAILS_ERROR
      ]);
    });

    it('should supply a payload with the repository url for given snap', () => {
      expect(action.payload.id).toEqual(repositoryUrl);
    });

    it('should request snap details for given snap and stable channel', () => {
      expect(action[CALL_API].path).toInclude(snapName);
      expect(action[CALL_API].path).toInclude('channel=stable');
    });
  });
});
