import { createHmac } from 'crypto';
import request from 'request';
import React from 'react';
import ReactDOM from 'react-dom/server';

import { makeWebhookSecret, getGitHubRootSecret } from '../../../src/server/handlers/webhook';

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
  const rootSecret = getGitHubRootSecret();
  const secret = makeWebhookSecret(
    rootSecret, req.params.owner, req.params.name);
  const hmac = createHmac('sha1', secret);
  hmac.update(body);
  request.post({
    url: req.body.config.url,
    headers: {
      'Content-Type': 'application/json',
      'X-GitHub-Delivery': '72d3162e-cc78-11e3-81ab-4c9367dc0958',
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

export function okayRepoAdmin(req, res) {
  const headers = {
    Link: ''
  };
  res.set(headers).status(200).send(
    {
      permissions: {
        admin: true
      }
    });
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

export function okayReposFound(req, res) {
  const headers = {
    Link: ''
  };

  res.set(headers).status(200).send([
    {
      id: 1,
      full_name: 'anowner/aname',
      name: 'aname',
      owner: {
        id: 256,
        login: 'anowner'
      },
      html_url: 'https://github.com/anowner/aname',
      permissions: {
        admin: true
      }
    },
    {
      id: 2,
      full_name: 'test/test',
      name: 'test',
      owner: {
        id: 99,
        login: 'test'
      },
      html_url: 'https://github.com/test/test',
      permissions: {
        admin: false
      }
    }
  ]);
}

export function okayOrgsFound(req, res) {
  const headers = {
    Link: ''
  };

  res.set(headers).status(200).send([
    {
      login: 'github',
      id: 1,
      url: 'https://api.github.com/orgs/github',
      repos_url: 'https://api.github.com/orgs/github/repos',
      events_url: 'https://api.github.com/orgs/github/events',
      hooks_url: 'https://api.github.com/orgs/github/hooks',
      issues_url: 'https://api.github.com/orgs/github/issues',
      members_url: 'https://api.github.com/orgs/github/members{/member}',
      public_members_url: 'https://api.github.com/orgs/github/public_members{/member}',
      avatar_url: 'https://github.com/images/error/octocat_happy.gif',
      description: 'A great organization'
    }
  ]);
}

export function okayNoReposFound(req, res) {
  const headers = {
    Link: ''
  };

  res.set(headers).status(200).send([]);
}

export function okayUserFoundWithDisplayName(req, res) {
  res.status(200).send({
    id: 256,
    login: 'anowner',
    name: 'Ann Owner',
    html_url: 'http://github.com/anowner'
  });
}

export function okayUserFoundWithoutDisplayName(req, res) {
  res.status(200).send({
    id: 256,
    login: 'anowner',
    html_url: 'http://github.com/anowner'
  });
}
