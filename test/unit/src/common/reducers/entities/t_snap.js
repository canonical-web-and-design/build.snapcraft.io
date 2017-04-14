import expect from 'expect';

import snap from '../../../../../../src/common/reducers/entities/snap.js';
import * as ActionTypes from '../../../../../../src/common/actions/register-name';

describe('snaps entities', function() {

  let state = {
    store_name: 'test-name'
  };

  context('register name actions', () => {
    it('REGISTER_NAME_SUCCESS should update registered name', function() {
      expect(snap(state, {
        type: ActionTypes.REGISTER_NAME_SUCCESS,
        payload: {
          snapName: 'test-name-changed'
        }
      }).store_name).toEqual('test-name-changed');
    });
  });

  context('name ownership actions', () => {
    let state = {
      snapcraft_data: {
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
      expect(snap(state, requestAction).snapcraft_data.isFetching).toBe(true);
    });

    it('CHECK_NAME_OWNERSHIP_SUCCESS should update isFetching state', function() {
      expect(snap(state, successAction).snapcraft_data.isFetching).toBe(false);
    });

    it('CHECK_NAME_OWNERSHIP_SUCCESS should set name ownership status', function() {
      expect(snap(state, successAction).snapcraft_data.nameOwnershipStatus).toBe('test-status');
    });

    it('CHECK_NAME_OWNERSHIP_ERROR should update isFetching state', function() {
      expect(snap(state, errorAction).snapcraft_data.isFetching).toBe(false);
    });

    it('CHECK_NAME_OWNERSHIP_ERROR should reset name ownership status', function() {
      expect(snap(state, errorAction).snapcraft_data.nameOwnershipStatus).toBe(null);
    });
  });

});
