import expect from 'expect';

import { repositories } from '../../../../../src/common/reducers/repositories';
import * as ActionTypes from '../../../../../src/common/actions/repositories';


describe('repositories reducers', () => {
  const initialState = {
    isFetching: false,
    success: false,
    pageLinks: {},
    error: null,
    repos: []
  };

  const REPOS = [{
    full_name: 'anowner/aname',
    name: 'aname',
    owner: { login: 'anowner' }
  },
  {
    full_name: 'test/test',
    name: 'test',
    owner: { login: 'test' }
  }];

  it('should return the initial state', () => {
    expect(repositories(undefined, {})).toEqual(initialState);
  });

  context('FETCH_REPOSITORIES', () => {
    const action = {
      type: ActionTypes.FETCH_REPOSITORIES,
      payload: 'test'
    };

    it('should store fetching status when fetching builds', () => {
      expect(repositories(initialState, action)).toEqual({
        ...initialState,
        isFetching: true
      });
    });
  });

  context('SET_REPOSITORIES', () => {
    const state = {
      ...initialState,
      isFetching: true,
      error: 'Previous error'
    };

    const action = {
      type: ActionTypes.SET_REPOSITORIES,
      payload: {
        repos: REPOS
      }
    };

    it('should store parsed repository data', () => {
      repositories(state, action).repos.forEach((repo, i) => {
        expect(repo.fullName).toEqual(REPOS[i].full_name);
        expect(repo.name).toEqual(REPOS[i].name);
        expect(repo.owner).toEqual(REPOS[i].owner.login);
      });
    });

    it('should store full repository info', () => {
      repositories(state, action).repos.forEach((repo, i) => {
        expect(repo.repo).toEqual(REPOS[i]);
      });
    });

    it('should stop fetching', () => {
      expect(repositories(state, action).isFetching).toBe(false);
    });

    it('should store success state', () => {
      expect(repositories(state, action).success).toBe(true);
    });

    it('should clean error', () => {
      expect(repositories(state, action).error).toBe(null);
    });
  });

  context('FETCH_REPOSITORIES_ERROR', () => {
    const state = {
      ...initialState,
      success: true,
      repos: REPOS,
      isFetching: true
    };

    const action = {
      type: ActionTypes.FETCH_REPOSITORIES_ERROR,
      payload: 'Something went wrong!',
      error: true
    };

    it('should handle fetch failure', () => {
      expect(repositories(state, action)).toEqual({
        ...state,
        isFetching: false,
        success: false,
        error: action.payload
      });
    });
  });
});
