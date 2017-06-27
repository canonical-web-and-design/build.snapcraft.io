import expect from 'expect';

import {
  fetchUserRepositories
} from '../../../../../src/common/actions/repositories';
import * as ActionTypes from '../../../../../src/common/actions/repositories';
import { CALL_API } from '../../../../../src/common/middleware/call-api';

describe('repositories actions', () => {
  describe('fetchUserRepositories', () => {
    context('when not supplied with a page number', () => {
      let pageNumber;

      beforeEach(() => {
        pageNumber = null;
      });

      it('should supply request, success and failure actions when invoking CALL_API', () => {
        expect(fetchUserRepositories(pageNumber)[CALL_API].types).toEqual([
          ActionTypes.REPOSITORIES_REQUEST,
          ActionTypes.REPOSITORIES_SUCCESS,
          ActionTypes.REPOSITORIES_FAILURE,
          ActionTypes.REPOSITORIES_DELAYED
        ]);
      });
    });

    context('when supplied with a page number', () => {
      let pageNumber;

      beforeEach(() => {
        pageNumber = 123;
      });

      it('should supply a request path containing the page number', () => {
        expect(fetchUserRepositories(pageNumber)[CALL_API].path).toInclude(123);
      });
    });
  });
});
