import { Router } from 'express';
import { json } from 'body-parser';

import { verifyToken } from '../middleware/csrf-token';
import {
  authorizeSnap,
  deleteSnap,
  findSnap,
  findSnaps,
  getSnapBuilds,
  newSnap,
  requestSnapBuilds
} from '../handlers/launchpad';

const router = Router();

router.use('/launchpad/snaps', json());
router.post('/launchpad/snaps', verifyToken);
router.post('/launchpad/snaps', newSnap);
router.get('/launchpad/snaps', findSnap);

router.use('/launchpad/snaps/list', json());
router.get('/launchpad/snaps/list', findSnaps);

router.use('/launchpad/snaps/authorize', json());
router.post('/launchpad/snaps/authorize', authorizeSnap);

router.use('/launchpad/builds', json());
router.get('/launchpad/builds', getSnapBuilds);

router.use('/launchpad/snaps/request-builds', json());
router.use('/launchpad/snaps/request-builds', verifyToken);
router.post('/launchpad/snaps/request-builds', requestSnapBuilds);

// XXX cjwatson 2017-02-28: This would be more RESTful if we defined an API
// URL for each snap and then just made this a DELETE.
router.use('/launchpad/snaps/delete', verifyToken);
router.use('/launchpad/snaps/delete', json());
router.post('/launchpad/snaps/delete', deleteSnap);

export default router;
