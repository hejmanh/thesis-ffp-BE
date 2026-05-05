import { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.js';
import authRoutes from '@/modules/auth/auth.routes.js';
import { query } from '@/database/query.js';
const router = Router();

router.get(
  '/health',
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: { status: 'ok' },
    });
  }),
);

router.get(
  '/health/ready',
  asyncHandler(async (req: Request, res: Response) => {
    await query('SELECT 1');

    res.json({
      success: true,
      data: { status: 'ok' },
    });
  }),
);

router.use('/auth', authRoutes);

export default router;
