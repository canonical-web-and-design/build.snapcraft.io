import expect from 'expect';

import { repository } from '../../../../../src/common/reducers/repository';
import * as ActionTypes from '../../../../../src/common/actions/create-snap';

describe('repository reducers', () => {
  const initialState = null;

  it('should return the initial state', () => {
    expect(repository(undefined, {})).toEqual(initialState);
  });

  context('SET_GITHUB_REPOSITORY', () => {
    let action;

    beforeEach(() => {
      action = {
        type: ActionTypes.SET_GITHUB_REPOSITORY,
        payload: ''
      };
    });

    it('should save repository name for valid user/repo pair', () => {
      action.payload = 'foo/bar';

      expect(repository(initialState, action)).toInclude({
        fullName: 'foo/bar'
      });
    });

    it('should save repository name for valid repo URL', () => {
      action.payload = 'http://github.com/foo/bar';

      expect(repository(initialState, action)).toInclude({
        fullName: 'foo/bar'
      });
    });

    it('should clear repository for invalid input', () => {
      action.payload = 'foo bar';

      const state = {
        fullName: 'foo/bar'
      };

      expect(repository(state, action)).toBe(null);
    });

  });

});
