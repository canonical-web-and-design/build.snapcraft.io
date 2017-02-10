import { Router } from 'express';
import { json } from 'body-parser';

import {
  authorizeSnap,
  findSnap,
  findSnaps,
  getSnapBuilds,
  newSnap,
  requestSnapBuilds
} from '../handlers/launchpad';

const router = Router();

router.use('/launchpad/snaps', json());
router.post('/launchpad/snaps', newSnap);
router.get('/launchpad/snaps', findSnap);

router.use('/launchpad/snaps/list', json());
router.get('/launchpad/snaps/list', findSnaps);

router.use('/launchpad/snaps/authorize', json());
router.post('/launchpad/snaps/authorize', authorizeSnap);

router.use('/launchpad/builds', json());
router.get('/launchpad/builds', getSnapBuilds);

router.use('/launchpad/snaps/request-builds', json());
router.post('/launchpad/snaps/request-builds', requestSnapBuilds);

export default router;
