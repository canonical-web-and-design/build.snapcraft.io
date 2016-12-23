import { WEBHOOK_FAILURE } from '../actions/webhook';

const INITIAL_STATE = {
  isPending: false,
  success: false,
  error: false
};

const ERROR_MESSAGES = {
  'github-repository-not-found': 'A repository could not be found, or access is not granted for given repository details',
  'github-authentication-failed': 'A problem occurred when accessing repository. Please try logging in again',
  'github-error-other': 'A problem occurred while the repository was being built. Please try again later'
};

export function webhook(state = INITIAL_STATE, code) {
  switch (code.type) {
    case WEBHOOK_FAILURE:
      return {
        ...state,
        error: { message:  ERROR_MESSAGES[code.code] }
      };
    default:
      return state;
  }
}
