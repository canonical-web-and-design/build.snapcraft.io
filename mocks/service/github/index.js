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

router.get('/repos/:owner/:name', responses.okayRepoAdmin);
router.get(
  '/repos/:owner/:name/contents/snapcraft.yaml',
  responses.okaySnapcraftYamlFound
);
router.get(
  '/repos/:owner/:name/contents/snap/snapcraft.yaml',
  responses.errorSnapcraftYamlNotFound
);

router.get('/user/repos', responses.okayReposFound);
router.get('/user/orgs', responses.okayOrgsFound);

router.get('/user', responses.okayUserFoundWithDisplayName);

export default router;
