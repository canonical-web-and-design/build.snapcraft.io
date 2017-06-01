import expect from 'expect';

import * as RegisterNameActionTypes from '../../../../../../src/common/actions/register-name';
import snap from '../../../../../../src/common/reducers/entities/snap';
import { FETCH_SNAP_DETAILS_SUCCESS, FETCH_SNAP_DETAILS_ERROR } from '../../../../../../src/common/actions/snaps';

describe('snaps entities', function() {

  let state = {
    storeName: 'test-name'
  };

  context('on register name actions', () => {
    const initialStatus = {
      isFetching: false,
      success: false,
      error: null
    };

    const id = 'http://github.com/dummy/repo';
    const snapName = 'test-snap';

    it('should store fetching status on REGISTER_NAME', () => {
      const action = {
        type: RegisterNameActionTypes.REGISTER_NAME,
        payload: { id, snapName }
      };

      expect(snap(state, action).registerNameStatus).toEqual({
        ...initialStatus,
        isFetching: true
      });
    });

    it('should store fetching status on REGISTER_NAME_SUCCESS', () => {
      const action = {
        type: RegisterNameActionTypes.REGISTER_NAME_SUCCESS,
        payload: { id, snapName }
      };

      expect(snap(state, action).registerNameStatus).toEqual({
        ...initialStatus,
        isFetching: false,
        error: null,
        success: true
      });
    });

    it('should update registered name on REGISTER_NAME_SUCCESS', function() {
      expect(snap(state, {
        type: RegisterNameActionTypes.REGISTER_NAME_SUCCESS,
        payload: {
          snapName: 'test-name-changed'
        }
      }).storeName).toEqual('test-name-changed');
    });

    it('should store fetching status on REGISTER_NAME_ERROR', () => {
      const action = {
        type: RegisterNameActionTypes.REGISTER_NAME_ERROR,
        payload: {
          id,
          error: new Error('Something went wrong!')
        },
        error: true
      };

      expect(snap(state, action).registerNameStatus).toEqual({
        ...initialStatus,
        isFetching: false,
        success: false,
        error: action.payload.error
      });
    });

    it('should store fetching status on REGISTER_NAME_CLEAR', () => {
      const action = {
        type: RegisterNameActionTypes.REGISTER_NAME_CLEAR,
        payload: { id }
      };

      expect(snap(state, action).registerNameStatus).toEqual({
        ...initialStatus
      });
    });
  });

  context('on snap details actions', () => {
    const id = 'http://github.com/dummy/repo';

    it('should set stable revision to true on FETCH_SNAP_DETAILS_SUCCESS', () => {
      const action = {
        type: FETCH_SNAP_DETAILS_SUCCESS,
        payload: { id, response: { status: 'success' } }
      };

      expect(snap(state, action)).toEqual({
        ...state,
        stableRevision: true
      });
    });

    it('should set stable revision to false on FETCH_SNAP_DETAILS_ERROR', () => {
      const action = {
        type: FETCH_SNAP_DETAILS_ERROR,
        payload: { id, response: { status: 'error' } }
      };

      expect(snap(state, action)).toEqual({
        ...state,
        stableRevision: false
      });
    });
  });

});
