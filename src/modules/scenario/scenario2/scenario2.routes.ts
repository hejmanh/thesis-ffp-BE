import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.js';
import {
  createScenario2InputHandler,
  getScenario2InputHandler,
  getScenario2OutputHandler,
  updateScenario2InputHandler,
} from './scenario2.controller.js';

const router = Router();

router.get('/input', authMiddleware, getScenario2InputHandler);
router.post('/input', authMiddleware, createScenario2InputHandler);
router.patch('/input', authMiddleware, updateScenario2InputHandler);
router.get('/output', authMiddleware, getScenario2OutputHandler);

export default router;
