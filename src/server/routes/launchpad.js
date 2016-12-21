import { Router } from 'express';
import { json } from 'body-parser';

import {
  completeSnapAuthorization,
  findSnap,
  getSnapBuilds,
  newSnap
} from '../handlers/launchpad';

const router = Router();

router.use('/launchpad/snaps', json());
router.post('/launchpad/snaps', newSnap);
router.get('/launchpad/snaps', findSnap);

router.use('/launchpad/builds', json());
router.get('/launchpad/builds', getSnapBuilds);

router.use('/launchpad/snaps/complete-authorization', json());
router.post('/launchpad/snaps/complete-authorization',
            completeSnapAuthorization);

export default router;
