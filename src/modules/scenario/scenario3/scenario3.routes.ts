import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.js';
import {
  createScenario3InputHandler,
  getScenario3InputHandler,
  getScenario3OutputHandler,
  updateScenario3InputHandler,
} from './scenario3.controller.js';

const router = Router();

router.get('/input', authMiddleware, getScenario3InputHandler);
router.post('/input', authMiddleware, createScenario3InputHandler);
router.patch('/input', authMiddleware, updateScenario3InputHandler);
router.get('/output', authMiddleware, getScenario3OutputHandler);

export default router;
