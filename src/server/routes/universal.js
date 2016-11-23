import { Router } from 'express';

import { universal } from '../handlers/universal';

const router = Router();

router.get('*', universal);

export default router;
