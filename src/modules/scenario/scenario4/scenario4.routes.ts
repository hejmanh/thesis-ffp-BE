import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.js';
import {
  createScenario4InputHandler,
  getScenario4InputHandler,
  getScenario4OutputHandler,
  updateScenario4InputHandler,
} from './scenario4.controller.js';

const router = Router();

router.get('/input', authMiddleware, getScenario4InputHandler);
router.post('/input', authMiddleware, createScenario4InputHandler);
router.patch('/input', authMiddleware, updateScenario4InputHandler);
router.get('/output', authMiddleware, getScenario4OutputHandler);

export default router;
