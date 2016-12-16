import { Router } from 'express';
import LoginForm from './login-form';
import React from 'react';
import ReactDOM from 'react-dom/server';
import * as responses from './responses';

// UNCOMMENT DESIRED RESPONSE
const webhookResponse = responses.okayNewHookCreated;
// const webhookResponse = responses.errorNoAccountOrRepo;
// const webhookResponse = responses.errorBadCredentials;
// const webhookResponse = responses.errorWebhookExists;

const router = Router();

router.post('/repos/:account/:repo/hooks', webhookResponse);

router.get('/login/oauth/authorize', (req, res) => {
  res.status(200).send(ReactDOM.renderToString(
    <LoginForm
      redirectUrl={ req.query.redirect_uri }
      sharedSecret={ req.query.state }
    />
  ));
});

router.post('/login/oauth/access_token', responses.okayAuthenticated);

router.get('/repos/:account/:repo/contents/snapcraft.yaml', (req, res) => {
  res.status(200).send(`name: ${req.params.repo}\n`);
});

export default router;
