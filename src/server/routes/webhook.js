import { Router } from 'express';
import { notify } from '../handlers/webhook';
import { json } from 'body-parser';

const router = Router();

router.use('/webhook/notify', json());
router.post('/webhook/notify', notify);

export default router;
