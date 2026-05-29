import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.js';
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
router.post('/financial', authMiddleware, createFinancialInfoHandler);
router.patch('/financial', authMiddleware, updateFinancialInfoHandler);
router.get('/me', authMiddleware, getUserInfoContextHandler);
router.patch('/me', authMiddleware, updateUserInfoContextHandler);
router.get('/life-stages', authMiddleware, getStageDataHandler);
router.post('/life-stages', authMiddleware, createStageDataHandler);
router.patch('/life-stages', authMiddleware, updateStageDataHandler);
router.get('/assets', authMiddleware, listAssetsHandler);
router.post('/assets', authMiddleware, createAssetsHandler);
router.patch('/assets', authMiddleware, updateAssetDataHandler);
router.delete('/assets/:uid', authMiddleware, deleteAssetHandler);

export default router;
