export const TOGGLE_REPOSITORY = 'TOGGLE_REPOSITORY';

export const toggleRepository = (repository) => {
  return {
    type: TOGGLE_REPOSITORY,
    payload: repository
  };
};
