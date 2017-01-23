import { Router } from 'express';
import { notify } from '../handlers/webhook';
import { text } from 'body-parser';

const router = Router();

// Really JSON, but we need the raw body to verify its signature.
router.use('/:owner/:name/webhook/notify',
           text({ type: 'application/json' }));
router.post('/:owner/:name/webhook/notify', notify);

export default router;
