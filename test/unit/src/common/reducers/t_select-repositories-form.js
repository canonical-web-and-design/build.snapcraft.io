import expect from 'expect';

import { selectRepositoriesForm } from '../../../../../src/common/reducers/select-repositories-form';
import { TOGGLE_REPOSITORY } from '../../../../../src/common/actions/select-repositories-form';

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
          type: TOGGLE_REPOSITORY,
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
          type: TOGGLE_REPOSITORY,
          payload: { fullName: 'foo/bar' }
        });
      });

      it('should note have a selected repository "foo/bar"', () => {
        expect(state).toEqual({ selectedRepos: [] });
      });
    });
  });
});
