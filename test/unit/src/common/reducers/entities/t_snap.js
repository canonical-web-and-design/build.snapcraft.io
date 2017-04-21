import expect from 'expect';

import * as RegisterNameActionTypes from '../../../../../../src/common/actions/register-name';
import snap from '../../../../../../src/common/reducers/entities/snap.js';
import * as ActionTypes from '../../../../../../src/common/actions/register-name';

describe('snaps entities', function() {

  let state = {
    storeName: 'test-name'
  };

  context('name ownership actions', () => {
    let state = {
      snapcraftData: {
        name: 'test-name'
      }
    };

    const requestAction = {
      type: ActionTypes.CHECK_NAME_OWNERSHIP_REQUEST,
      payload: {
        id: 'snapId',
        snapName: 'test-name',
      }
    };

    const successAction = {
      type: ActionTypes.CHECK_NAME_OWNERSHIP_SUCCESS,
      payload: {
        id: 'snapId',
        snapName: 'test-name',
        status: 'test-status'
      }
    };

    const errorAction = {
      type: ActionTypes.CHECK_NAME_OWNERSHIP_ERROR,
      payload: {
        id: 'snapId',
        snapName: 'test-name',
        status: 'test-status'
      }
    };

    it('CHECK_NAME_OWNERSHIP_REQUEST should update isFetching state', function() {
      expect(snap(state, requestAction).snapcraftData.isFetching).toBe(true);
    });

    it('CHECK_NAME_OWNERSHIP_SUCCESS should update isFetching state', function() {
      expect(snap(state, successAction).snapcraftData.isFetching).toBe(false);
    });

    it('CHECK_NAME_OWNERSHIP_SUCCESS should set name ownership status', function() {
      expect(snap(state, successAction).snapcraftData.nameOwnershipStatus).toBe('test-status');
    });

    it('CHECK_NAME_OWNERSHIP_ERROR should update isFetching state', function() {
      expect(snap(state, errorAction).snapcraftData.isFetching).toBe(false);
    });

    it('CHECK_NAME_OWNERSHIP_ERROR should reset name ownership status', function() {
      expect(snap(state, errorAction).snapcraftData.nameOwnershipStatus).toBe(null);
    });
  
  });

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

});
