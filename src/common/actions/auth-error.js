export const AUTH_ERROR = 'AUTH_ERROR';

export function authError(message) {
  return {
    type: AUTH_ERROR,
    message
  };
}
