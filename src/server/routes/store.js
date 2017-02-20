import { Router } from 'express';
import { json } from 'body-parser';

import { registerName } from '../handlers/store';

const router = Router();

router.use('/store/register-name', json());
router.post('/store/register-name', registerName);

export default router;
