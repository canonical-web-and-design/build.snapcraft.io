import { Router } from 'express';
import { json } from 'body-parser';

import { createWebhook, listRepositories } from '../handlers/github';

const router = Router();

router.use('/github/webhook', json());
router.post('/github/webhook', createWebhook);

router.use('/github/repos', json());
router.get('/github/repos', listRepositories);

export default router;
