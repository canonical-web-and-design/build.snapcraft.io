import expect from 'expect';

import { repositoriesStatus } from '../../../../../src/common/reducers/repositories-status';
import * as ActionTypes from '../../../../../src/common/actions/create-snap';

describe('repositoriesStatus reducers', () => {
  const initialState = {};

  const initialStatus = {
    isFetching: false,
    error: null
  };

  const id = 'dummy/repo';

  it('should return the initial state', () => {
    expect(repositoriesStatus(undefined, {})).toEqual(initialState);
  });

  context('CREATE_SNAP', () => {
    it('stores fetching status when repository is being created', () => {
      const action = {
        type: ActionTypes.CREATE_SNAP,
        payload: { id }
      };

      expect(repositoriesStatus(initialState, action)[id]).toEqual({
        ...initialStatus,
        isFetching: true
      });
    });
  });

  context('CREATE_SNAP_ERROR', () => {
    it('handles snap creation failure', () => {
      const state = {
        ...initialState,
        isFetching: true
      };

      const action = {
        type: ActionTypes.CREATE_SNAP_ERROR,
        payload: {
          id,
          error: new Error('Something went wrong!')
        },
        error: true
      };

      expect(repositoriesStatus(state, action)[id]).toEqual({
        ...state,
        isFetching: false,
        success: false,
        error: action.payload.error
      });
    });
  });
});
