import { conf } from '../helpers/config';
import requestGitHub from '../helpers/github';
import logging from '../logging';
import { makeWebhookSecret } from './webhook';

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

  let secret;
  try {
    secret = makeWebhookSecret(account, repo);
  } catch (e) {
    return res.status(500).send({
      status: 'error',
      payload: {
        code: 'github-unconfigured',
        message: e.message
      }
    });
  }

  const uri = `/repos/${account}/${repo}/hooks`;
  const options = getRequest(account, repo, req.session.token, secret);
  requestGitHub.post(uri, options)
    .then((response) => {
      if (response.statusCode !== 201) {
        logger.info(response.body);
        switch (response.body.message) {
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
            logger.info('GitHub API error', response.statusCode);
            return res.status(500).send(RESPONSE_OTHER);
        }
      }

      return res.status(201).send(RESPONSE_CREATED);
    }).catch((err) => {
      logger.info('GitHub API error', err);
      return res.status(500).send(err.message);
    });
};

const getRequest = (account, repo, token, secret) => {
  return {
    token,
    json: {
      name: 'web',
      active: true,
      events: [
        'push'
      ],
      config: {
        url: `${conf.get('BASE_URL')}/${account}/${repo}/webhook/notify`,
        content_type: 'json',
        secret
      }
    }
  };
};
