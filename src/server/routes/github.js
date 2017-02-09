import { Router } from 'express';
import { json } from 'body-parser';

import { createWebhook, listRepositories } from '../handlers/github';
import { getSnapcraftYaml } from '../handlers/launchpad';

const router = Router();

router.use('/github/webhook', json());
router.post('/github/webhook', createWebhook);

router.use('/github/repos', json());
router.get('/github/repos', listRepositories);
router.get('/github/repos/page/:page', listRepositories);

router.use('/github/snapcraft-yaml/:owner/:name', json());
router.get('/github/snapcraft-yaml/:owner/:name', getSnapcraftYaml);

export default router;
