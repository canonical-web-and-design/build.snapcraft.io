import * as ActionTypes from '../actions/repository-input';

export function repositoryInput(state = {
  isFetching: false,
  inputValue: '',
  success: false,
  error: false
}, action) {
  switch(action.type) {
    case ActionTypes.SET_GITHUB_REPOSITORY:
      return {
        ...state,
        inputValue: action.payload,
        success: false,
        error: false
      };
    case ActionTypes.CREATE_SNAP:
      return {
        ...state,
        isFetching: true
      };
    case ActionTypes.CREATE_SNAP_ERROR:
      return {
        ...state,
        isFetching: false,
        success: false,
        error: action.payload
      };
    default:
      return state;
  }
}
