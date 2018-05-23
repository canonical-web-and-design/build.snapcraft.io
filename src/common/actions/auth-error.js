// AUTH_ERROR is used when server-side auth fails
export const AUTH_ERROR = 'AUTH_ERROR';

// AUTH_EXPIRED is used when any client-side API response returns
// 401 Unauthorized - quite likely because of expired session
export const AUTH_EXPIRED = 'AUTH_EXPIRED';

export function authError(message) {
  return {
    type: AUTH_ERROR,
    message
  };
}

export function authExpired(error) {
  return {
    type: AUTH_EXPIRED,
    payload: {
      error: error
    },
    error: true
  };
}
