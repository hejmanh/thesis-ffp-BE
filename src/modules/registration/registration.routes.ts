import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.js';
import {
  createFinancialInfoHandler,
  createStageDataHandler,
  deleteAssetHandler,
  getFinancialInfoHandler,
  getStageDataHandler,
  updateAssetDataHandler,
  updateFinancialInfoHandler,
  updateStageDataHandler,
  createAssetsHandler,
  listAssetsHandler,
} from './registration.controller.js';

const router = Router();

router.get('/financial', authMiddleware, getFinancialInfoHandler);
router.post('/financial', authMiddleware, createFinancialInfoHandler);
router.patch('/financial', authMiddleware, updateFinancialInfoHandler);
router.get('/stages', authMiddleware, getStageDataHandler);
router.post('/stages', authMiddleware, createStageDataHandler);
router.patch('/stages', authMiddleware, updateStageDataHandler);
router.get('/assets', authMiddleware, listAssetsHandler);
router.post('/assets', authMiddleware, createAssetsHandler);
router.patch('/assets', authMiddleware, updateAssetDataHandler);
router.delete('/assets/:uid', authMiddleware, deleteAssetHandler);

export default router;
