import expect from 'expect';

import {
  fetchUserOrganizations
} from '../../../../../src/common/actions/organizations';
import * as ActionTypes from '../../../../../src/common/actions/organizations';
import { CALL_API } from '../../../../../src/common/middleware/call-api';

describe('organizations actions', () => {
  describe('fetchUserOrganizations', () => {
    const owner = 'anowner';

    it('should supply request, success and failure actions when invoking CALL_API', () => {
      expect(fetchUserOrganizations(owner)[CALL_API].types).toEqual([
        ActionTypes.ORGANIZATIONS_REQUEST,
        ActionTypes.ORGANIZATIONS_SUCCESS,
        ActionTypes.ORGANIZATIONS_FAILURE
      ]);
    });

    it('should supply a request path containing the owner', () => {
      expect(fetchUserOrganizations(owner)[CALL_API].path).toInclude(owner);
    });

  });
});
