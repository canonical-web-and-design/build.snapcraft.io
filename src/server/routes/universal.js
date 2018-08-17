import { Router } from 'express';

import { universal, homepage } from '../handlers/universal';

const router = Router();

router.get('/', homepage);
router.get('*', universal);

export default router;
