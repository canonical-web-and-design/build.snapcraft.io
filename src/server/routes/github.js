import { Router } from 'express';
import { json } from 'body-parser';

import { createWebhook } from '../handlers/github';

const router = Router();

router.use('/github/webhook', json());
router.post('/github/webhook', createWebhook);

export default router;
