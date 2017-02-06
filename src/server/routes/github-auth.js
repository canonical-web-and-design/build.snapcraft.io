import { Router } from 'express';

import {
  authenticate,
  logout,
  verify,
  errorHandler
} from '../handlers/github-auth';

const router = Router();

router.get('/auth/authenticate', authenticate, errorHandler);
router.get('/auth/verify', verify, errorHandler);
router.get('/auth/logout', logout, errorHandler);

export default router;
