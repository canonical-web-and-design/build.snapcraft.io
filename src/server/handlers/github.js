import { conf } from '../helpers/config';
import requestGitHub from '../helpers/github';
import logging from '../logging';
import { makeWebhookSecret } from './webhook';

const logger = logging.getLogger('express');

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

export const listRepositories = (req, res) => {
  const uri = '/user/repos?affiliation=owner';

  if (!req.session || !req.session.token) {
    return res.status(401).send(RESPONSE_AUTHENTICATION_FAILED);
  }

  requestGitHub.get(uri, { token: req.session.token, json: true })
    .then((response) => {
      if (response.statusCode !== 200) {
        return res.status(response.statusCode).send({
          status: 'error',
          payload: {
            code: 'github-list-repositories-error',
            message: response.body.message
          }
        });
      }

      return res.status(response.statusCode).send({
        status: 'success',
        payload: {
          code: 'github-list-repositories',
          repos: response.body
        }
      });
    });
};

export const createWebhook = (req, res) => {
  const { owner, name } = req.body;

  let secret;
  try {
    secret = makeWebhookSecret(owner, name);
  } catch (e) {
    return res.status(500).send({
      status: 'error',
      payload: {
        code: 'github-unconfigured',
        message: e.message
      }
    });
  }

  const uri = `/repos/${owner}/${name}/hooks`;
  const options = getRequest(owner, name, req.session.token, secret);
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
            logger.error('GitHub API error', response.statusCode);
            return res.status(500).send(RESPONSE_OTHER);
        }
      }

      return res.status(201).send(RESPONSE_CREATED);
    }).catch((err) => {
      logger.error('GitHub API error', err);
      return res.status(500).send(err.message);
    });
};

const getRequest = (owner, name, token, secret) => {
  return {
    token,
    json: {
      name: 'web',
      active: true,
      events: [
        'push'
      ],
      config: {
        url: `${conf.get('BASE_URL')}/${owner}/${name}/webhook/notify`,
        content_type: 'json',
        secret
      }
    }
  };
};
