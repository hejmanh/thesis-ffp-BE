import { asyncHandler } from '@/utils/asyncHandler.js';
import express from 'express';
import type { Request, Response } from 'express';

const router = express.Router();

router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  res.json({ status: 'ok' });
}));

export default router;