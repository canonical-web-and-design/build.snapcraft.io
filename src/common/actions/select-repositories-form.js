export const TOGGLE_REPOSITORY = 'SELECT_REPOSITORY_FORM_TOGGLE_REPOSITORY';

export const toggleRepository = (repository) => {
  return {
    type: TOGGLE_REPOSITORY,
    payload: repository
  };
};
