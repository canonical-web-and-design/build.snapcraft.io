import { checkStatus, getError } from '../helpers/api';

// Action key that carries API call info interpreted by this Redux middleware.
export const CALL_API = 'CALL_API';

// A Redux middleware that interprets actions with CALL_API info specified.
// Performs the call and promises when such actions are dispatched. This
// has been implemented using promises because of suspected problems with
// sourcemapping async / await code.
export default (defaults) => () => (next) => (action) => {
  // If action does not invoke CALL_API,
  // ignore it
  const settings = action[CALL_API];
  if (typeof settings === 'undefined') {
    return next(action);
  }

  // Validate action settings
  validateDefaults(defaults);
  validateSettings(settings);

  const requestType = settings.types ? settings.types[0] : null;
  const successType = settings.types ? settings.types[1] : null;
  const failureType = settings.types ? settings.types[2] : null;
  const delayedType = settings.types ? settings.types[3] : null;
  const delayTimeout = settings.delayTimeout || 2000;

  const resource = defaults.endpoint + settings.path;
  const optionsWithCsrfToken = withCsrfToken(defaults.csrfToken, settings.options);
  const createAction = createActionWith.bind({}, action);

  // Immediately dispatch request action
  if (requestType) {
    next(createAction({ type: requestType }));
  }

  // Set up timeout to trigger delayed action if response takes long to load
  let loadingTimeout;

  if (delayedType) {
    loadingTimeout = setTimeout(() => {
      next(createAction({ type: delayedType }));
    }, delayTimeout);
  }

  return fetch(resource, optionsWithCsrfToken)
    .then((response) => {
      clearTimeout(loadingTimeout);

      return checkStatus(response)
        .then(() => {
          return response.json()
            .then((result) => {
              if (result.status !== 'success') {
                throw getError(response, result);
              }

              if (successType) {
                next(createAction({
                  type: successType,
                  payload: {
                    response: result
                  }
                }));
              }

              // resolve promise with response JSON
              return result;
            });
        });
    })
    .catch((error) => {
      clearTimeout(loadingTimeout);

      if (failureType) {
        // if type of failure action is defined in settings
        // catch the error and pass it in failure action payload
        next(createAction({
          type: failureType,
          payload: {
            error: error
          },
          error: true
        }));
      } else {
        // otherwise, reject the promise with error
        throw error;
      }
    });
};

// Creates new action with request, success or
// failure types, corresponding with the stages
// of the request cycle. Bundles properties set
// on the original action.
function createActionWith(action, data) {
  const finalPayload = Object.assign({}, action.payload, data.payload);
  const finalAction = Object.assign({}, action, data, { payload: finalPayload });
  // Remove properties invoke CALL_API
  delete finalAction[CALL_API];

  return finalAction;
}

function validateDefaults({ endpoint, csrfToken }) {
  if (typeof endpoint !== 'string') {
    throw new Error('Specify a string endpoint URL.');
  }
  if (csrfToken && typeof csrfToken !== 'string') {
    throw new Error('Expected csrfToken to be a string');
  }
}

function validateSettings(settings) {
  const { path, types } = settings;
  if (typeof path !== 'string') {
    throw new Error('Specify a string path.');
  }
  if (Array.isArray(types) && !types.every(type => typeof type === 'string')) {
    throw new Error('Expected action types to be strings.');
  }
}

function withCsrfToken(csrfToken, options) {
  if (csrfToken) {
    if(typeof options === 'undefined') {
      options = {};
    }

    if (!options.headers) {
      options.headers = {};
    }

    options.headers = Object.assign({}, options.headers, {
      'X-CSRF-Token': csrfToken
    });
  }

  return options;
}
