import { Router } from 'express';
import * as responses from './responses';
import { json } from 'body-parser';

// CREATE WEBHOOK RESPONSE
const webhookResponse = responses.okayNewHookCreated;
// const webhookResponse = responses.errorNoAccountOrRepo;
// const webhookResponse = responses.errorBadCredentials;
// const webhookResponse = responses.errorWebhookExists;

// AUTHORISE LOGIN RESPONSE
const authoriseLoginResponse = responses.okayPromptForLogin;
// const authoriseLoginResponse = responses.okayDontPromptForLogin;
// const authoriseLoginResponse = responses.okayBadSharedSecret;

const router = Router();
router.use(json());
router.post('/repos/:owner/:name/hooks', webhookResponse);
router.get('/login/oauth/authorize', authoriseLoginResponse);
router.post('/login/oauth/access_token', responses.okayAuthenticated);

router.get('/repos/:owner/:name/contents/snapcraft.yaml', (req, res) => {
  res.status(200).send(`name: ${req.params.name}\n`);
});

router.get('/user/repos', (req, res) => {
  const headers = {
    Link: ''
  };

  res.set(headers).status(200).send([
    {
      full_name: 'anowner/aname',
      name: 'aname',
      owner: { login: 'anowner' }
    },
    {
      full_name: 'test/test',
      name: 'test',
      owner: { login: 'test' }
    }
  ]);
});

router.get('/user', (req, res) => {
  res.status(200).send({
    login: 'anowner',
    name: 'Ann Owner',
    html_url: 'http://github.com/anowner'
  });
});

export default router;
