import expect from 'expect';

import {
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
});
