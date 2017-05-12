import { Router } from 'express';

import {
  badge
} from '../handlers/badge';

const router = Router();

router.get('/badge/:owner/:name', badge);

export default router;
