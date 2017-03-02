// initialised with server side rendered state

export const UPDATE_USER = 'UPDATE_USER';

export function user(state = null, action) {
  switch(action.type) {
    // set individual user properties, useful for debugging
    case UPDATE_USER:
      return {
        ...state,
        ...action.payload
      };
    default:
      return state;
  }
}
