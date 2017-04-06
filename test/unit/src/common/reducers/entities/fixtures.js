export const initialState = {
  repos: {},
  snaps: {},
  owners: {}
};

export const payload = {
  entities: {
    repos: {
      1001: {
        owner: 1,
        fullName: 'foo'
      },
      1002: {
        owner: 1,
        fullName: 'bar'
      },
      1003: {
        owner: 1,
        fullName: 'baz'
      }
    },
    owners: {
      1: {
        name: 'Canonical'
      }
    }
  },
  result: [ 1001,1002,1003 ]
};

export const finalState = {
  ...initialState,
  ...payload.entities
};

export const repoPayload = {
  id: 1001
};

export const repoAddState = {
  isSelected: true,
  isFetching: true,
  error: null
};

export const repoSuccessState = {
  isSelected: true,
  isFetching: false,
  error: null
};

export const repoFailureState = {
  isSelected: true,
  isFetching: false,
  error: 'something went wrong'
};

export const repoResetState = {
  isSelected: false,
  isFetching: false,
  error: null
};

