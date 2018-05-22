import { Router } from 'express';
import { json } from 'body-parser';

import { verifyToken } from '../middleware/csrf-token';
import {
  createWebhook,
  getUser,
  listRepositories,
  refreshOrganizations
} from '../handlers/github';
import { getSnapcraftYaml } from '../handlers/launchpad';

const router = Router();

router.use('/github/webhook', json());
router.post('/github/webhook', verifyToken);
router.post('/github/webhook', createWebhook);

router.use('/github/user', json());
router.get('/github/user', getUser);

router.use('/github/orgs', json());
router.get('/github/orgs', refreshOrganizations);

router.use('/github/repos', json());
router.get('/github/repos', listRepositories);

router.use('/github/snapcraft-yaml/:owner/:name', json());
router.get('/github/snapcraft-yaml/:owner/:name', getSnapcraftYaml);

export default router;
