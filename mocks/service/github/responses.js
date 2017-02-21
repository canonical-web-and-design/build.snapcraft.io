import request from 'request';
import React from 'react';
import ReactDOM from 'react-dom/server';

import { makeWebhookHmac } from '../../../src/server/handlers/webhook';

import LoginForm from './login-form';

export function okayNewHookCreated(req, res) {
  res.status(201);
  // No response body implemented
  res.send();
  // Send ping to webhook endpoint
  const body = JSON.stringify({
    'zen': 'Draco dormiens nunquam titillandus',
    'hook_id': 'anid',
    'hook': req.body.config
  });
  const hmac = makeWebhookHmac(req.params.owner, req.params.name);
  hmac.update(body);
  request.post({
    url: req.body.config.url,
    headers: {
      'Content-Type': 'application/json',
      'X-Github-Delivery': '72d3162e-cc78-11e3-81ab-4c9367dc0958',
      'User-Agent': 'GitHub-Hookshot/044aadd',
      'X-GitHub-Event': 'ping',
      'X-Hub-Signature': hmac.digest('hex')
    },
    json: {
      'zen': 'Draco dormiens nunquam titillandus',
      'hook_id': 'anid',
      'hook': req.body.config
    }
  });
}

export function okayPromptForLogin(req, res) {
  res.status(200).send(ReactDOM.renderToString(
    <LoginForm
      redirectUrl={ req.query.redirect_uri }
      sharedSecret={ req.query.state }
    />
  ));
}

export function errorNoAccountOrRepo(req, res) {
  res.status(404).send({
    message: 'Not Found'
  });
}

export function errorBadCredentials(req, res) {
  res.status(401).send({
    message: 'Bad Credentials'
  });
}

export function errorWebhookExists(req, res) {
  res.status(422).send({
    message: 'Validation Failed'
  });
}

export function okayAuthenticated(req, res) {
  res.status(200).send({
    access_token: 'e72e16c7e42f292c6912e7710c838347ae178b4a',
    scope: 'read:repo_hook',
    token_type: 'bearer'
  });
}

export function okayDontPromptForLogin(req, res) {
  const url =`${req.query.redirect_uri}?state=${req.query.state}&code=example_code_REPLACE_ME`;
  res.redirect(302, url);
}

export function okayBadSharedSecret(req, res) {
  const url =`${req.query.redirect_uri}?state=notTheSharedSecret&code=example_code_REPLACE_ME`;
  res.redirect(302, url);
}

export function okaySnapcraftYamlFound(req, res) {
  res.status(200).send(`name: ${req.params.name}\n`);
}

export function errorSnapcraftYamlNotFound(req, res) {
  res.status(404).send({
    'message': 'Not Found',
    'documentation_url': 'https://developer.github.com/v3'
  });
}
