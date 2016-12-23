import expect from 'expect';

import { webhook } from '../../../../../src/common/reducers/webhook';

describe('webhook reducers', () => {
  const initialState = {
    isPending: false,
    success: false,
    error: false
  };

  context('when called with an unknown action', () => {
    let resultState;

    beforeEach(() => {
      resultState = webhook(undefined, {});
    });

    it('should return the initial state', () => {
      expect(resultState).toEqual(initialState);
    });
  });

  context('when called with action type WEBHOOK_FAILURE and code github-repository-not-found', () => {
    let resultState;

    beforeEach(() => {
      resultState = webhook(initialState, {
        type: 'WEBHOOK_FAILURE',
        code: 'github-repository-not-found'
      });
    });

    it('should return a state with an error message beginning "A repository could not be found"', () => {
      expect(resultState.error.message).toBe(
        'A repository could not be found, or access is not granted for given repository details'
      );
    });
  });

  context('when called with action type WEBHOOK_FAILURE and code github-authentication-failed', () => {
    let resultState;

    beforeEach(() => {
      resultState = webhook(initialState, {
        type: 'WEBHOOK_FAILURE',
        code: 'github-authentication-failed'
      });
    });

    it('should return a state with an error message beginning "A problem occurred when accessing repository"', () => {
      expect(resultState.error.message).toBe(
        'A problem occurred when accessing repository. Please try logging in again'
      );
    });
  });

  context('when called with action type WEBHOOK_FAILURE and code github-error-other', () => {
    let resultState;

    beforeEach(() => {
      resultState = webhook(initialState, {
        type: 'WEBHOOK_FAILURE',
        code: 'github-error-other'
      });
    });

    it('should return a state with an error message beginning "A problem occurred while the repository was being built"', () => {
      expect(resultState.error.message).toBe(
        'A problem occurred while the repository was being built. Please try again later'
      );
    });
  });
});
