import expect from 'expect';

import { repositoryInput } from '../../../../../src/common/reducers/repository-input';
import * as ActionTypes from '../../../../../src/common/actions/repository-input';

describe('repositoryInput reducers', () => {
  const initialState = {
    isFetching: false,
    inputValue: '',
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
        type: ActionTypes.SET_GITHUB_REPOSITORY,
        payload: ''
      };
    });

    it('should change repository input value', () => {
      action.payload = 'foo';

      expect(repositoryInput(initialState, action)).toInclude({
        inputValue: 'foo'
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

  context('CREATE_SNAP', () => {
    it('stores fetching status when repository is being created', () => {
      const action = {
        type: ActionTypes.CREATE_SNAP,
        payload: 'dummy/repo'
      };

      expect(repositoryInput(initialState, action)).toEqual({
        ...initialState,
        isFetching: true
      });
    });
  });

  context('CREATE_SNAP_ERROR', () => {
    it('handles snap creation failure', () => {
      const state = {
        ...initialState,
        isFetching: true
      };

      const action = {
        type: ActionTypes.CREATE_SNAP_ERROR,
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
