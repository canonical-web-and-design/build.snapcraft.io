import { conf } from '../helpers/config';
import requestGitHub from '../helpers/github';
import logging from '../logging';

const logger = logging.getLogger('express-error');

const RESPONSE_NOT_FOUND = {
  status: 'error',
  payload: {
    code: 'github-repository-not-found',
    message: 'The GitHub repository cannot be found or access not granted to account'
  }
};

const RESPONSE_AUTHENTICATION_FAILED = {
  status: 'error',
  payload: {
    code: 'github-authentication-failed',
    message: 'Authentication with GitHub failed'
  }
};

const RESPONSE_OTHER = {
  status: 'error',
  payload: {
    code: 'github-error-other',
    message: 'Something went wrong when creating a webhook'
  }
};

const RESPONSE_ALREADY_CREATED = {
  status: 'error',
  payload: {
    code: 'github-already-created',
    message: 'A webhook already exists on the given repository'
  }
};

const RESPONSE_CREATED = {
  status: 'success',
  payload: {
    code: 'github-webhook-created',
    message: 'GitHub webhook successfully created'
  }
};

export const createWebhook = (req, res) => {
  const { account, repo } = req.body;

  const uri = `/repos/${account}/${repo}/hooks`;
  const options = getRequest(account, repo, req.session.token);
  requestGitHub.post(uri, options, (err, response, body) => {
    if (response.statusCode !== 201) {
      logger.info(body);
      switch (body.message) {
        case 'Not Found':
          // Repository does not exist or access not granted
          return res.status(404).send(RESPONSE_NOT_FOUND);
        case 'Bad credentials':
          // Authentication failed
          return res.status(401).send(RESPONSE_AUTHENTICATION_FAILED);
        case 'Validation Failed':
          // Webhook already created
          return res.status(422).send(RESPONSE_ALREADY_CREATED);
        default:
          // Something else
          logger.info('GitHub API error', err, body);
          return res.status(500).send(RESPONSE_OTHER);
      }
    }

    return res.status(201).send(RESPONSE_CREATED);
  });
};

const getRequest = (account, repo, token) => {
  return {
    headers: {
      'Authorization': `token ${token}`
    },
    json: {
      name: 'web',
      active: true,
      events: [
        'push'
      ],
      config: {
        url: conf.get('WEBHOOK_ENDPOINT'),
        content_type: 'json'
      }
    }
  };
};
