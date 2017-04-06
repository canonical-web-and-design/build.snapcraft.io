import * as ActionTypes from '../../actions/repository';


export default function repository(state={
  isSelected: false,
  isFetching: false,
  error: null
}, action) {

  switch(action.type) {
    case ActionTypes.REPO_TOGGLE_SELECT: {
      const wasSelected = state.isSelected;

      return {
        ...state,
        isSelected: !wasSelected
      };
    }
    case ActionTypes.REPO_ADD: {
      return {
        ...state,
        isFetching: true,
        isSelected: true
      };
    }
    case ActionTypes.REPO_SUCCESS: {
      return {
        ...state,
        isFetching: false,
        error: null
      };
    }
    case ActionTypes.REPO_RESET: {
      return {
        ...state,
        isSelected: false,
        isFetching: false,
        error: null
      };
    }
    case ActionTypes.REPO_FAILURE: {
      return {
        ...state,
        isFetching: false,
        error: action.payload.error.json
      };
    }
    default:
      return state;
  }
}
