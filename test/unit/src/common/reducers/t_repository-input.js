import expect from 'expect';

import { repositoryInput } from '../../../../../src/common/reducers/repository-input';
import * as ActionTypes from '../../../../../src/common/actions/repository-input';

describe('repositoryInput reducers', () => {
  const initialState = {
    isFetching: false,
    inputValue: '',
    repository: null,
    repositoryUrl: null,
    success: false,
    error: false
  };

  it('should return the initial state', () => {
    expect(repositoryInput(undefined, {})).toEqual(initialState);
  });

  context('SET_GITHUB_REPOSITORY', () => {
    let action;

    beforeEach(() => {
      action = {
        type: ActionTypes.SET_GITHUB_REPOSITORY
      };
    });

    it('should change repository input value', () => {
      action.payload = 'foo';

      expect(repositoryInput(initialState, action)).toInclude({
        inputValue: 'foo'
      });
    });

    it('should save repository name for valid user/repo pair', () => {
      action.payload = 'foo/bar';

      expect(repositoryInput(initialState, action)).toInclude({
        repository: 'foo/bar'
      });
    });

    it('should save repository name for valid repo URL', () => {
      action.payload = 'http://github.com/foo/bar';

      expect(repositoryInput(initialState, action)).toInclude({
        repository: 'foo/bar'
      });
    });

    it('should clear repository name for invalid input', () => {
      action.payload = 'foo bar';

      const state = {
        ...initialState,
        repository: 'foo/bar'
      };

      expect(repositoryInput(state, action)).toInclude({
        repository: null
      });
    });

    it('should reset error status', () => {
      const state = {
        ...initialState,
        error: new Error('Test')
      };

      expect(repositoryInput(state, action).error).toBe(false);
    });

    it('should reset success status', () => {
      const state = {
        ...initialState,
        success: true
      };

      expect(repositoryInput(state, action).success).toBe(false);
    });
  });

  context('VERIFY_GITHUB_REPOSITORY', () => {
    it('should store fetching status when repository is verified via GH API', () => {
      const action = {
        type: ActionTypes.VERIFY_GITHUB_REPOSITORY,
        payload: 'dummy/repo'
      };

      expect(repositoryInput(initialState, action)).toEqual({
        ...initialState,
        isFetching: true
      });
    });
  });

  context('VERIFY_GITHUB_REPOSITORY_SUCCESS', () => {
    it('should handle verify repo success', () => {
      const state = {
        ...initialState,
        repository: 'dummy/repo',
        isFetching: true
      };

      const action = {
        type: ActionTypes.VERIFY_GITHUB_REPOSITORY_SUCCESS,
        payload: 'http://github.com/dummy/repo.git'
      };

      expect(repositoryInput(state, action)).toEqual({
        ...state,
        isFetching: false,
        repositoryUrl: 'http://github.com/dummy/repo.git',
        success: true
      });
    });

    it('should clean error', () => {
      const state = {
        ...initialState,
        repository: 'dummy/repo',
        error: new Error('Previous error')
      };

      const action = {
        type: ActionTypes.VERIFY_GITHUB_REPOSITORY_SUCCESS,
        payload: 'http://github.com/dummy/repo.git'
      };

      expect(repositoryInput(state, action).error).toBe(false);
    });
  });

  context('VERIFY_GITHUB_REPOSITORY_ERROR', () => {
    it('should handle verify repo failure', () => {
      const state = {
        ...initialState,
        repository: 'dummy/repo',
        isFetching: true
      };

      const action = {
        type: ActionTypes.VERIFY_GITHUB_REPOSITORY_ERROR,
        payload: new Error('Something went wrong!'),
        error: true
      };

      expect(repositoryInput(state, action)).toEqual({
        ...state,
        isFetching: false,
        success: false,
        error: action.payload
      });
    });
  });
});
