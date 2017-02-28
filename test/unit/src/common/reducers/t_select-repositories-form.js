import expect from 'expect';

import { selectRepositoriesForm } from '../../../../../src/common/reducers/select-repositories-form';
import * as ActionTypes from '../../../../../src/common/actions/select-repositories-form';

describe('The selectRepositoriesForm reducer', () => {
  let initialState;

  context('when no repositories are selected', () => {
    beforeEach(() => {
      initialState = {
        selectedRepos: []
      };
    });

    context('and a repository with name "foo/bar" is toggled', () => {
      let state;

      beforeEach(() => {
        state = selectRepositoriesForm(initialState, {
          type: ActionTypes.TOGGLE_REPOSITORY,
          payload: { fullName: 'foo/bar' }
        });
      });

      it('should have a selected repository "foo/bar"', () => {
        expect(state).toEqual({
          selectedRepos: [
            { fullName: 'foo/bar' }
          ]
        });
      });
    });
  });

  context('when a repository named "foo/bar" is selected', () => {
    beforeEach(() => {
      initialState = {
        selectedRepos: [
          { fullName: 'foo/bar' }
        ]
      };
    });

    context('and a repository with name "foo/bar" is toggled', () => {
      let state;

      beforeEach(() => {
        state = selectRepositoriesForm(initialState, {
          type: ActionTypes.TOGGLE_REPOSITORY,
          payload: { fullName: 'foo/bar' }
        });
      });

      it('should not have a selected repository "foo/bar"', () => {
        expect(state).toEqual({ selectedRepos: [] });
      });
    });
  });

  context('when all selected repositories are unselected', () => {
    let state;

    beforeEach(() => {
      initialState = {
        selectedRepos: [
          { fullName: 'foo/bar' },
          { fullName: 'foo/baz' }
        ]
      };
      state = selectRepositoriesForm(initialState, {
        type: ActionTypes.UNSELECT_ALL_REPOSITORIES
      });
    });

    it('should have no selected repositories', () => {
      expect(state).toEqual({ selectedRepos: [] });
    });
  });
});
