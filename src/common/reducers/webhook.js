import * as ActionTypes from '../actions/webhook';

const INITIAL_STATE = {
  isFetching: false,
  success: false,
  error: null
};

const ERROR_MESSAGES = {
  'github-repository-not-found': 'A repository could not be found, or access is not granted for given repository details',
  'github-authentication-failed': 'A problem occurred when accessing repository. Please try logging in again',
  'github-error-other': 'A problem occurred while the repository was being built. Please try again later'
};

export function webhook(state = INITIAL_STATE, action) {
  switch (action.type) {
    case ActionTypes.WEBHOOK:
      return {
        ...state,
        isFetching: true
      };
    case ActionTypes.WEBHOOK_SUCCESS:
      return {
        ...state,
        isFetching: false,
        success: true,
        error: null
      };
    case ActionTypes.WEBHOOK_FAILURE:
      return {
        ...state,
        isFetching: false,
        success: false,
        error: { message: ERROR_MESSAGES[action.code] }
      };
    default:
      return state;
  }
}
