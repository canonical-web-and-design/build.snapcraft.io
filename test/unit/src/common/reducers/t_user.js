import expect from 'expect';

import { user, UPDATE_USER } from '../../../../../src/common/reducers/user';

describe('user reducers', () => {
  const initialState = null;

  it('should return the initial state', () => {
    expect(user(undefined, {})).toEqual(initialState);
  });

  context('UPDATE_USER', () => {
    const state = {
      id: 1234,
      name: 'Joe Doe',
      login: 'jdoe'
    };

    const action = {
      type: UPDATE_USER,
      payload: {
        name: 'John Doeh',
        test: 'Test'
      }
    };

    it('should update properties from payload', () => {
      expect(user(state, action)).toInclude({
        name: 'John Doeh'
      });
    });

    it('should not touch propeties not listed in payload', () => {
      expect(user(state, action)).toInclude({
        id: 1234
      });
    });

    it('should add new propeties from payload', () => {
      expect(user(state, action)).toInclude({
        test: 'Test'
      });
    });

  });

});
