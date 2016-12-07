import { Router } from 'express';
import { conf } from '../helpers/config';

import { authenticate, verify } from '../handlers/github-auth';

const router = Router();

router.get('/auth/authenticate', authenticate(conf));
router.get('/auth/verify', verify(conf));

export default router;
