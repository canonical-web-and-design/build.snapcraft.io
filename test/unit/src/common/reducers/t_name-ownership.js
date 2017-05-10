import expect from 'expect';

import { nameOwnership } from '../../../../../src/common/reducers/name-ownership';
import * as ActionTypes from '../../../../../src/common/actions/name-ownership';

describe('name ownership reducers', () => {
  const initialState = {};
  let state = {};

  it('should return the initial state', () => {
    expect(nameOwnership(undefined, {})).toEqual(initialState);
  });

  const requestAction = {
    type: ActionTypes.CHECK_NAME_OWNERSHIP_REQUEST,
    payload: {
      name: 'test-name',
    }
  };

  const successAction = {
    type: ActionTypes.CHECK_NAME_OWNERSHIP_SUCCESS,
    payload: {
      name: 'test-name',
      status: 'test-status'
    }
  };

  const errorAction = {
    type: ActionTypes.CHECK_NAME_OWNERSHIP_ERROR,
    payload: {
      name: 'test-name',
      status: 'test-status',
      error: 'Something is wrong'
    }
  };

  it('CHECK_NAME_OWNERSHIP_REQUEST should update isFetching state', function() {
    expect(nameOwnership(state, requestAction)['test-name'].isFetching).toBe(true);
  });

  it('CHECK_NAME_OWNERSHIP_SUCCESS should update isFetching state', function() {
    expect(nameOwnership(state, successAction)['test-name'].isFetching).toBe(false);
  });

  it('CHECK_NAME_OWNERSHIP_SUCCESS should set name ownership status', function() {
    expect(nameOwnership(state, successAction)['test-name'].status).toBe('test-status');
  });

  it('CHECK_NAME_OWNERSHIP_ERROR should update isFetching state', function() {
    expect(nameOwnership(state, errorAction)['test-name'].isFetching).toBe(false);
  });

  it('CHECK_NAME_OWNERSHIP_ERROR should reset name ownership status', function() {
    expect(nameOwnership(state, errorAction)['test-name'].status).toBe(null);
  });

  it('CHECK_NAME_OWNERSHIP_ERROR should store error object', function() {
    expect(nameOwnership(state, errorAction)['test-name'].error).toEqual('Something is wrong');
  });
});
