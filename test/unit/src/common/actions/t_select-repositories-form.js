import expect from 'expect';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
  toggleRepository,
  unselectAllRepositories
} from '../../../../../src/common/actions/select-repositories-form';
import * as ActionTypes from '../../../../../src/common/actions/select-repositories-form';

const middlewares = [ thunk ];
const mockStore = configureMockStore(middlewares);

describe('The toggleRepository action creator', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      selectedRepos: []
    });
  });

  it('should dispatch the TOGGLE_REPOSITORY action', () => {
    store.dispatch(toggleRepository({ fullName: 'foo/bar' }));
    expect(store.getActions()).toHaveActionOfType(
      ActionTypes.TOGGLE_REPOSITORY
    );
  });
});

describe('The unselectAllRepositories action creator', () => {
  let store;

  beforeEach(() => {
    store = mockStore();
  });

  it('should dispatch the UNSELECT_ALL_REPOSITORIES action', () => {
    store.dispatch(unselectAllRepositories());
    expect(store.getActions()).toHaveActionOfType(
      ActionTypes.UNSELECT_ALL_REPOSITORIES
    );
  });
});
