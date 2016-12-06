import { Router } from 'express';
import {
  authenticate,
  verify,
  logout,
  errorHandler
} from '../handlers/login.js';

const router = Router();

router.get('/login/authenticate', authenticate);
router.get('/login/verify', verify);
router.post('/login/verify', verify);
router.get('/logout', logout);
router.use(errorHandler);

export default router;
