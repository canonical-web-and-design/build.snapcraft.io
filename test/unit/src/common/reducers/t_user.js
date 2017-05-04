import expect from 'expect';

import { user, UPDATE_USER } from '../../../../../src/common/reducers/user';
import { ORGANIZATIONS_SUCCESS } from '../../../../../src/common/actions/organizations';

describe('user reducers', () => {
  const initialState = null;

  it('should return the initial state', () => {
    expect(user(undefined, {})).toEqual(initialState);
  });

  context('ORGANIZATIONS_SUCCESS', () => {
    const state = {
      orgs: [{ login: 'oldOrg' }]
    };

    const action = {
      type: ORGANIZATIONS_SUCCESS,
      payload: {
        response: {
          orgs: [{ login: 'org1' }, { login: 'org2' }]
        }
      }
    };

    it('should update orgs for user', () => {
      expect(user(state, action)).toInclude({
        orgs: action.payload.response.orgs
      });
    });
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
