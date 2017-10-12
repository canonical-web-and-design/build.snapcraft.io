import logging from '../logging';
const logger = logging.getLogger('express');

export class PreparedError extends Error {
  constructor(status, body) {
    super();
    this.status = status;
    this.body = body;
  }
}

// Wrap errors in a promise chain so that they always end up as a
// PreparedError.
export const prepareError = async (error) => {
  if (error.status && error.body) {
    // The error comes with a prepared representation.
    return error;
  } else if (error.response) {
    // if it's ResourceError from LP client at least for the moment
    // we just wrap the error we get from LP
    const text = await error.response.text();
    logger.error('Launchpad API error:', text);
    return new PreparedError(error.response.status, {
      status: 'error',
      payload: {
        code: 'lp-error',
        message: text
      }
    });
  } else {
    return new PreparedError(500, {
      status: 'error',
      payload: {
        code: 'internal-error',
        message: error.message
      }
    });
  }
};
