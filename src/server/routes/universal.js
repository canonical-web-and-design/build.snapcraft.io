import { Router } from 'express';

import { universal, homepage } from '../handlers/universal';

const router = Router();

if (process.env.NODE_ENV !== 'development') {
  router.get('/', homepage);
}
router.get('*', universal);

export default router;
