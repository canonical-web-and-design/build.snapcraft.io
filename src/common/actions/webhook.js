import 'isomorphic-fetch';

export const WEBHOOK = 'WEBHOOK';
export const WEBHOOK_SUCCESS = 'WEBHOOK_SUCCESS';
export const WEBHOOK_FAILURE = 'WEBHOOK_FAILURE';

const REQUEST_OPTIONS = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'same-origin'
};

export function createWebhookSuccess() {
  return {
    type: WEBHOOK_SUCCESS
  };
}

export function createWebhookFailure(code, message) {
  const action = {
    type: WEBHOOK_FAILURE,
    code
  };
  if (message) {
    action.message = message;
  }
  return action;
}

export function createWebhook(account, repo) {
  return (dispatch) => {
    dispatch({ type: WEBHOOK });

    const settings = REQUEST_OPTIONS;
    settings.body = JSON.stringify({ account, repo });

    return fetch(`${getBaseUrl()}/api/github/webhook`, settings)
      .then((response) => {
        return response.text();
      })
      .then((body) => {
        let result = JSON.parse(body);
        if (result.status && result.payload) {
          if (result.status == 'success' || result.payload.code == 'github-already-created') {
            // Treat pre-existing builds like a new build
            return dispatch(createWebhookSuccess());
          }

          if (result.status == 'error') {
            return dispatch(createWebhookFailure(result.payload.code));
          }
        }

        return dispatch(createWebhookFailure('github-error-other'));
      })
      .catch((error) => {
        dispatch(createWebhookFailure('github-error-other', error));
      });
  };
}

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`;
  }

  return '';
}
