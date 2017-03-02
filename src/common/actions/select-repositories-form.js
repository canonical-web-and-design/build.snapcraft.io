export const TOGGLE_REPOSITORY = 'TOGGLE_REPOSITORY';
export const UNSELECT_ALL_REPOSITORIES = 'UNSELECT_ALL_REPOSITORIES';

export const toggleRepository = (repository) => {
  return {
    type: TOGGLE_REPOSITORY,
    payload: repository
  };
};

export const unselectAllRepositories = () => {
  return { type: UNSELECT_ALL_REPOSITORIES };
};
