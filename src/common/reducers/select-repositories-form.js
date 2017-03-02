import * as ActionTypes from '../actions/select-repositories-form';
import { hasRepository } from '../helpers/repositories';

const initialState = {
  selectedRepos: []
};

export function selectRepositoriesForm(state = initialState, action) {
  switch(action.type) {
    case ActionTypes.TOGGLE_REPOSITORY:
      if (hasRepository(state.selectedRepos, action.payload)) {
        return {
          ...state,
          selectedRepos: state.selectedRepos.filter((repo) => {
            return repo.fullName !== action.payload.fullName;
          })
        };
      }

      return {
        ...state,
        selectedRepos: [
          ...state.selectedRepos,
          action.payload
        ]
      };
    case ActionTypes.UNSELECT_ALL_REPOSITORIES:
      return initialState;
    default:
      return state;
  }
}
