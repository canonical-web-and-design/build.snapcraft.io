import expect from 'expect';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
  fetchUserSnaps,
  removeSnap
} from '../../../../../src/common/actions/snaps';
import * as ActionTypes from '../../../../../src/common/actions/snaps';
import { CALL_API } from '../../../../../src/common/middleware/call-api';

const middlewares = [ thunk ];
const mockStore = configureMockStore(middlewares);

describe('repositories actions', () => {
  const initialState = {
    isFetching: false,
    success: false,
    error: null,
    snaps: null
  };

  let store;

  beforeEach(() => {
    store = mockStore(initialState);
  });

  context('fetchUserSnaps', () => {
    it('should invoke CALL_API', async () => {
      await store.dispatch(fetchUserSnaps('anowner'));
      expect(store.getActions()).toHaveActionsMatching((action) => {
        return !!action[CALL_API];
      });
    });

    it('should invoke supply success and failure actions when invoking CALL_API', async () => {
      await store.dispatch(fetchUserSnaps('anowner'));
      expect(store.getActions()).toHaveActionsMatching((action) => {
        return action[CALL_API].types[0] == ActionTypes.FETCH_SNAPS_SUCCESS
          && action[CALL_API].types[1] == ActionTypes.FETCH_SNAPS_ERROR;
      });
    });
  });

  context('removeSnap', () => {
    it('should invoke CALL_API', async () => {
      await store.dispatch(removeSnap('anowner'));
      expect(store.getActions()).toHaveActionsMatching((action) => {
        return !!action[CALL_API];
      });
    });

    it('should invoke supply success and failure actions when invoking CALL_API', async () => {
      await store.dispatch(removeSnap('anowner'));
      expect(store.getActions()).toHaveActionsMatching((action) => {
        return action[CALL_API].types[0] == ActionTypes.REMOVE_SNAP_SUCCESS
          && action[CALL_API].types[1] == ActionTypes.REMOVE_SNAP_ERROR;
      });
    });
  });
});
