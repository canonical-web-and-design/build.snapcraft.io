import { Router } from 'express';

import { authenticate, verify } from '../handlers/github-auth';

const router = Router();

router.get('/auth/authenticate', authenticate);
router.get('/auth/verify', verify);

export default router;
