import expect from 'expect';

import { repositoriesStatus } from '../../../../../src/common/reducers/repositories-status';
import * as ActionTypes from '../../../../../src/common/actions/create-snap';

describe('repositoriesStatus reducers', () => {
  const initialState = {};

  const initialStatus = {
    isFetching: false,
    success: false,
    error: null
  };

  const id = 'dummy/repo';

  it('should return the initial state', () => {
    expect(repositoriesStatus(undefined, {})).toEqual(initialState);
  });

  context('CREATE_SNAPS_START', () => {
    it('clears out any existing state', () => {
      const state = {
        ...initialState,
        [id]: initialStatus
      };

      const action = { type: ActionTypes.CREATE_SNAPS_START };

      expect(repositoriesStatus(state, action)).toEqual({});
    });
  });

  context('CREATE_SNAP', () => {
    it('stores fetching status when snap is being created', () => {
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

  context('CREATE_SNAP_SUCCESS', () => {
    it('handles snap creation success', () => {
      const state = {
        ...initialState,
        [id]: {
          ...initialStatus,
          isFetching: true
        }
      };

      const action = {
        type: ActionTypes.CREATE_SNAP_SUCCESS,
        payload: { id },
        error: true
      };

      expect(repositoriesStatus(state, action)[id]).toEqual({
        ...state[id],
        isFetching: false,
        success: true,
        error: null
      });
    });
  });

  context('CREATE_SNAP_ERROR', () => {
    it('handles snap creation failure', () => {
      const state = {
        ...initialState,
        [id]: {
          ...initialStatus,
          isFetching: true
        }
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
        ...state[id],
        isFetching: false,
        success: false,
        error: action.payload.error
      });
    });
  });
});
