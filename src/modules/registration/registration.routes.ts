import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.js';
import {
  deleteAssetHandler,
  createUserInfoHandler,
  getUserInfoHandler,
  updateAssetDataHandler,
  updateFinancialProfileBasicHandler,
  updateLifestyleProfileHandler,
  updatePortfolioAllocationsHandler,
  updateStageDataHandler,
  createAssetsHandler,
  listAssetsHandler,
} from './registration.controller.js';

const router = Router();

router.get('/', authMiddleware, getUserInfoHandler);
router.post('/', authMiddleware, createUserInfoHandler);
router.patch('/basic', authMiddleware, updateFinancialProfileBasicHandler);
router.patch('/portfolio', authMiddleware, updatePortfolioAllocationsHandler);
router.patch('/stages', authMiddleware, updateStageDataHandler);
router.get('/assets', authMiddleware, listAssetsHandler);
router.post('/assets', authMiddleware, createAssetsHandler);
router.patch('/assets', authMiddleware, updateAssetDataHandler);
router.patch('/lifestyle', authMiddleware, updateLifestyleProfileHandler);
router.delete('/assets/:uid', authMiddleware, deleteAssetHandler);

export default router;
