import { Router } from 'express';
import { json } from 'body-parser';

import {
  privateRepos,
} from '../handlers/subscribe';

const router = Router();

router.use('/subscribe/private-repos', json());
router.get('/subscribe/private-repos', privateRepos);

export default router;
