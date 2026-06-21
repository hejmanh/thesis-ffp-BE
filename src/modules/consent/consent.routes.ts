import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.js';
import {
  getConsentStatusHandler,
  recordConsentHandler,
} from './consent.controller.js';

const router = Router();

router.post('/', authMiddleware, recordConsentHandler);
router.get('/me', authMiddleware, getConsentStatusHandler);

export default router;
