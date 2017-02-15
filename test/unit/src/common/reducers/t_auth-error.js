import expect from 'expect';

import { authError } from '../../../../../src/common/reducers/auth-error';
import * as ActionTypes from '../../../../../src/common/actions/auth-error';

describe('authError reducer', () => {
  const initialState = {};

  it('returns the initial state', () => {
    expect(authError(undefined, {})).toEqual(initialState);
  });

  context('AUTH_ERROR', () => {
    it('stores the error', () => {
      const action = {
        type: ActionTypes.AUTH_ERROR,
        message: 'Something went wrong'
      };

      expect(authError(initialState, action)).toEqual({
        message: 'Something went wrong'
      });
    });
  });
});
