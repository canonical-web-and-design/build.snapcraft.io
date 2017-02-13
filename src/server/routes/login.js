import { Router } from 'express';
import { json } from 'body-parser';
import {
  authenticate,
  deleteSSODischarge,
  getSSODischarge,
  verify,
  logout,
  errorHandler
} from '../handlers/login.js';

const router = Router();

router.get('/login/authenticate', authenticate);
router.get('/login/verify', verify);
router.post('/login/verify', verify);
router.get('/login/sso-discharge', getSSODischarge, json());
router.delete('/login/sso-discharge', deleteSSODischarge);
router.get('/logout', logout);
router.use(errorHandler);

export default router;
