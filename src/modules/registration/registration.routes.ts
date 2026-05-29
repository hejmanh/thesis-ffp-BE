import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.js';
import { csrfProtection } from '@/middlewares/csrf.js';
import {
  createFinancialInfoHandler,
  createStageDataHandler,
  deleteAssetHandler,
  getFinancialInfoHandler,
  getStageDataHandler,
  getUserInfoContextHandler,
  updateAssetDataHandler,
  updateFinancialInfoHandler,
  updateStageDataHandler,
  createAssetsHandler,
  listAssetsHandler,
  updateUserInfoContextHandler,
} from './registration.controller.js';

const router = Router();

router.get('/financial', authMiddleware, getFinancialInfoHandler);
router.post(
  '/financial',
  authMiddleware,
  csrfProtection,
  createFinancialInfoHandler,
);
router.patch(
  '/financial',
  authMiddleware,
  csrfProtection,
  updateFinancialInfoHandler,
);
router.get('/me', authMiddleware, getUserInfoContextHandler);
router.patch('/me', authMiddleware, csrfProtection, updateUserInfoContextHandler);
router.get('/life-stages', authMiddleware, getStageDataHandler);
router.post(
  '/life-stages',
  authMiddleware,
  csrfProtection,
  createStageDataHandler,
);
router.patch(
  '/life-stages',
  authMiddleware,
  csrfProtection,
  updateStageDataHandler,
);
router.get('/assets', authMiddleware, listAssetsHandler);
router.post('/assets', authMiddleware, csrfProtection, createAssetsHandler);
router.patch('/assets', authMiddleware, csrfProtection, updateAssetDataHandler);
router.delete(
  '/assets/:uid',
  authMiddleware,
  csrfProtection,
  deleteAssetHandler,
);

export default router;
