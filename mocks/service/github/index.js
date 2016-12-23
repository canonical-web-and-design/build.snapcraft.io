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
router.post('/repos/:account/:repo/hooks', webhookResponse);
router.get('/login/oauth/authorize', authoriseLoginResponse);
router.post('/login/oauth/access_token', responses.okayAuthenticated);

router.get('/repos/:account/:repo/contents/snapcraft.yaml', (req, res) => {
  res.status(200).send(`name: ${req.params.repo}\n`);
});

export default router;
