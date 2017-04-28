import { Router } from 'express';
import { json } from 'body-parser';

import {
  getAccount,
  patchAccount,
  registerName,
  signAgreement
} from '../handlers/store';

const router = Router();

router.use('/store/register-name', json());
router.post('/store/register-name', registerName);

router.use('/store/account', json());
router.get('/store/account', getAccount);
router.patch('/store/account', patchAccount);

router.use('/store/agreement', json());
router.post('/store/agreement', signAgreement);

export default router;
