import expect from 'expect';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { toggleRepository, TOGGLE_REPOSITORY } from '../../../../../src/common/actions/select-repositories-form';

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
    expect(store.getActions()).toHaveActionOfType(TOGGLE_REPOSITORY);
  });
});
