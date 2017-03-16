import expect from 'expect';
import { isFSA } from 'flux-standard-action';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
  setGitHubRepository
} from '../../../../../src/common/actions/create-snap';
import * as ActionTypes from '../../../../../src/common/actions/create-snap';

const middlewares = [ thunk ];
const mockStore = configureMockStore(middlewares);

describe('create snap actions', () => {
  const initialState = {
    isFetching: false,
    inputValue: '',
    repository: {
      fullName: null
    },
    statusMessage: '',
    success: false,
    error: false
  };

  let store;
  let action;

  beforeEach(() => {
    store = mockStore(initialState);
  });

  context('setGitHubRepository', () => {
    let payload = 'foo/bar';

    beforeEach(() => {
      action = setGitHubRepository(payload);
    });

    it('should create an action to update repository name', () => {
      const expectedAction = {
        type: ActionTypes.SET_GITHUB_REPOSITORY,
        payload
      };

      store.dispatch(action);
      expect(store.getActions()).toInclude(expectedAction);
    });

    it('should create a valid flux standard action', () => {
      expect(isFSA(action)).toBe(true);
    });
  });
});
