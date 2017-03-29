export const BETA_NOTIFICATION_TOGGLE = 'BETA_NOTIFICATION_TOGGLE';

export function betaNotification(state = {
  isVisible: false
}, action) {
  switch(action.type) {
    case BETA_NOTIFICATION_TOGGLE:
      return {
        ...state,
        isVisible: action.payload
      };
    default:
      return state;
  }
}
