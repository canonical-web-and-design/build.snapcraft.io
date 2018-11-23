import { Router } from 'express';

import { universal, homepageRedirect } from '../handlers/universal';

const router = Router();

// If not in development mode, redirect the homepage to snapcraft.io/build
if (process.env.NODE_ENV !== 'development') {
  router.get('/', homepageRedirect);
}
router.get('*', universal);

export default router;
