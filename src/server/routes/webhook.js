import { Router } from 'express';
import { notify } from '../handlers/webhook';
import { text } from 'body-parser';

const router = Router();

// Really JSON, but we need the raw body to verify its signature.
router.use('/:account/:repo/webhook/notify',
           text({ type: 'application/json' }));
router.post('/:account/:repo/webhook/notify', notify);

export default router;
