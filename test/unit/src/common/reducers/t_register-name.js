import expect from 'expect';

import { registerName } from '../../../../../src/common/reducers/register-name';
import * as ActionTypes from '../../../../../src/common/actions/register-name';

describe('registerName reducers', () => {
  const initialState = {};

  const initialStatus = {
    snapName: null,
    isFetching: false,
    success: false,
    error: null
  };

  const id = 'dummy/repo';
  const snapName = 'test-snap';

  it('should return the initial state', () => {
    expect(registerName(undefined, {})).toEqual(initialState);
  });

  context('REGISTER_NAME', () => {
    it('stores fetching status and snap name when name is being ' +
       'registered', () => {
      const action = {
        type: ActionTypes.REGISTER_NAME,
        payload: { id, snapName }
      };

      expect(registerName(initialState, action)[id]).toEqual({
        ...initialStatus,
        snapName,
        isFetching: true
      });
    });
  });

  context('REGISTER_NAME_SUCCESS', () => {
    it('handles name registration success', () => {
      const state = {
        ...initialState,
        [id]: {
          ...initialStatus,
          snapName,
          isFetching: true
        }
      };

      const action = {
        type: ActionTypes.REGISTER_NAME_SUCCESS,
        payload: { id },
        error: true
      };

      expect(registerName(state, action)[id]).toEqual({
        ...state[id],
        isFetching: false,
        success: true,
        error: null
      });
    });
  });

  context('REGISTER_NAME_ERROR', () => {
    it('handles name registration failure', () => {
      const state = {
        ...initialState,
        [id]: {
          ...initialStatus,
          snapName,
          isFetching: true
        }
      };

      const action = {
        type: ActionTypes.REGISTER_NAME_ERROR,
        payload: {
          id,
          error: new Error('Something went wrong!')
        },
        error: true
      };

      expect(registerName(state, action)[id]).toEqual({
        ...state[id],
        isFetching: false,
        success: false,
        error: action.payload.error
      });
    });
  });

  context('REGISTER_NAME_CLEAR', () => {
    it('handles name registration clearing', () => {
      const state = {
        ...initialState,
        [id]: {
          ...initialStatus,
          snapName,
          success: true,
          isFetching: true
        }
      };

      const action = {
        type: ActionTypes.REGISTER_NAME_CLEAR,
        payload: {
          id
        }
      };

      expect(registerName(state, action)[id]).toEqual({
        snapName: null,
        isFetching: false,
        success: false,
        error: null
      });
    });
  });
});
