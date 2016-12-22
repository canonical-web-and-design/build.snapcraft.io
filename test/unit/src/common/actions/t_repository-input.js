import expect from 'expect';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import nock from 'nock';
import { isFSA } from 'flux-standard-action';
import url from 'url';

import {
  createSnap,
  createSnapError,
  setGitHubRepository,
  verifyGitHubRepository,
  verifyGitHubRepositorySuccess,
  verifyGitHubRepositoryError
} from '../../../../../src/common/actions/repository-input';
import * as ActionTypes from '../../../../../src/common/actions/repository-input';
import conf from '../../../../../src/common/helpers/config';

const middlewares = [ thunk ];
const mockStore = configureMockStore(middlewares);

describe('repository input actions', () => {
  const initialState = {
    isFetching: false,
    inputValue: '',
    repository: null,
    repositoryUrl: null,
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

  context('verifyGitHubRepositorySuccess', () => {
    let payload = 'http://github.com/foo/bar.git';

    beforeEach(() => {
      action = verifyGitHubRepositorySuccess(payload);
    });

    it('should create an action to save github repo url on success', () => {
      const expectedAction = {
        type: ActionTypes.VERIFY_GITHUB_REPOSITORY_SUCCESS,
        payload
      };

      store.dispatch(action);
      expect(store.getActions()).toInclude(expectedAction);
    });

    it('should create a valid flux standard action', () => {
      expect(isFSA(action)).toBe(true);
    });
  });

  context('verifyGitHubRepositoryError', () => {
    let payload = 'Something went wrong!';

    beforeEach(() => {
      action = verifyGitHubRepositoryError(payload);
    });

    it('should create an action to store github repo error on failure', () => {
      const expectedAction = {
        type: ActionTypes.VERIFY_GITHUB_REPOSITORY_ERROR,
        error: true,
        payload
      };

      store.dispatch(action);
      expect(store.getActions()).toInclude(expectedAction);
    });

    it('should create a valid flux standard action', () => {
      expect(isFSA(action)).toBe(true);
    });
  });

  context('verifyGitHubRepository', () => {
    const GITHUB_API_ENDPOINT = conf.get('GITHUB_API_ENDPOINT');
    let scope;

    beforeEach(() => {
      scope = nock(GITHUB_API_ENDPOINT);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('should save GitHub repo on successful verification', () => {
      scope.get('/repos/foo/bar/contents/snapcraft.yaml')
        .reply(200, {
          'name': 'snapcraft.yaml'
        });

      return store.dispatch(verifyGitHubRepository('foo/bar'))
        .then(() => {
          expect(store.getActions()).toHaveActionOfType(
            ActionTypes.VERIFY_GITHUB_REPOSITORY_SUCCESS
          );
        });
    });

    it('should store error on GitHub verification failure', () => {
      scope.get('/repos/foo/bar/contents/snapcraft.yaml')
        .reply(404, {
          'message': 'Not Found',
          'documentation_url': 'https://developer.github.com/v3'
        });

      return store.dispatch(verifyGitHubRepository('foo/bar'))
        .then(() => {
          expect(store.getActions()).toHaveActionOfType(
            ActionTypes.VERIFY_GITHUB_REPOSITORY_ERROR
          );
        });
    });
  });

  context('createSnap', () => {
    const BASE_URL = conf.get('BASE_URL');
    let scope;

    beforeEach(() => {
      scope = nock(BASE_URL);
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('redirects to /login/authenticate on successful creation', () => {
      scope.post('/api/launchpad/snaps')
        .reply(201, {
          status: 'success',
          payload: {
            code: 'snap-created',
            message: 'dummy-caveat'
          }
        });

      const location = {};
      return store.dispatch(createSnap('foo/bar', location))
        .then(() => {
          expect(url.parse(location.href, true)).toMatch({
            path: '/login/authenticate',
            query: {
              starting_url: '/foo/bar/builds',
              caveat_id: 'dummy-caveat'
            }
          });
        });
    });

    it('stores an error on failure', () => {
      scope.post('/api/launchpad/snaps')
        .reply(400, {
          status: 'error',
          payload: {
            code: 'snapcraft-yaml-no-name',
            message: 'snapcraft.yaml has no top-level "name" attribute'
          }
        });

      const location = {};
      return store.dispatch(createSnap('foo/bar', location))
        .then(() => {
          expect(location).toExcludeKey('href');
          expect(store.getActions()).toHaveActionOfType(
            ActionTypes.CREATE_SNAP_ERROR
          );
        });
    });
  });

  context('createSnapError', () => {
    let payload = 'Something went wrong!';

    beforeEach(() => {
      action = createSnapError(payload);
    });

    it('creates an action to store error on failure', () => {
      const expectedAction = {
        type: ActionTypes.CREATE_SNAP_ERROR,
        error: true,
        payload
      };

      store.dispatch(action);
      expect(store.getActions()).toInclude(expectedAction);
    });

    it('creates a valid flux standard action', () => {
      expect(isFSA(action)).toBe(true);
    });
  });
});
