import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.js';
import {
  createScenario1InputHandler,
  getScenario1InputHandler,
  getScenario1OutputHandler,
  updateScenario1InputHandler,
} from './scenario1.controller.js';

const router = Router();

router.get('/input', authMiddleware, getScenario1InputHandler);
router.post('/input', authMiddleware, createScenario1InputHandler);
router.patch('/input', authMiddleware, updateScenario1InputHandler);
router.get('/output', authMiddleware, getScenario1OutputHandler);

export default router;
