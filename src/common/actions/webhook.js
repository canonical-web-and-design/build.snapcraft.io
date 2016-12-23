import 'isomorphic-fetch';
import { createSnap } from './repository-input';

export const WEBHOOK_FAILURE = 'WEBHOOK_FAILURE';
const REQUEST_OPTIONS = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'same-origin'
};

export function createWebhook(repositoryString) {
  return (dispatch) => {
    let settings = REQUEST_OPTIONS;
    settings.body = JSON.stringify({
      account: repositoryString.split('/')[0],
      repo: repositoryString.split('/')[1]
    });

    return fetch(`${getBaseUrl()}/api/github/webhook`, settings)
      .then((response) => {
        return response.text();
      })
      .then((body) => {
        let result = JSON.parse(body);
        if (result.status && result.payload) {
          if (result.status == 'success' || result.payload.code == 'github-already-created') {
            // Treat pre-existing builds like a new build
            dispatch(createSnap(repositoryString));
            return;
          }

          if (result.status == 'error') {
            return dispatch({ type: WEBHOOK_FAILURE, code: result.payload.code });
          }
        }

        return dispatch({ type: WEBHOOK_FAILURE, code: 'github-error-other' });
      })
      .catch((error) => {
        dispatch({ type: WEBHOOK_FAILURE, code: 'github-error-other', message: error });
      });
  };
}

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`;
  }

  return '';
}
