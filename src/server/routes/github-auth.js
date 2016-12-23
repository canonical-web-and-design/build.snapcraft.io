import { Router } from 'express';

import { authenticate, verify, errorHandler } from '../handlers/github-auth';

const router = Router();

router.get('/auth/authenticate', authenticate, errorHandler);
router.get('/auth/verify', verify, errorHandler);

export default router;
