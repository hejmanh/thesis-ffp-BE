import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.js';
import { unauthorized } from '@/utils/error.js';
import { Scenario1InputDto } from './dto/input.dto.js';
import type {
  CreateScenario1InputResponseDto,
  GetScenario1InputResponseDto,
  GetScenario1OutputResponseDto,
  UpdateScenario1InputResponseDto,
} from './dto/response.dto.js';
import {
  createScenario1Input,
  getScenario1InputService,
  getScenario1OutputService,
  updateScenario1Input,
} from './scenario1.service.js';

export const createScenario1InputHandler = asyncHandler(
  async (req: Request, res: Response<CreateScenario1InputResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const data = Scenario1InputDto.parse(req.body);
    const result = await createScenario1Input(userId, data);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Scenario 1 input created',
    });
  },
);

export const updateScenario1InputHandler = asyncHandler(
  async (req: Request, res: Response<UpdateScenario1InputResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const data = Scenario1InputDto.parse(req.body);
    const result = await updateScenario1Input(userId, data);

    res.json({
      success: true,
      data: result,
      message: 'Scenario 1 input updated',
    });
  },
);

export const getScenario1InputHandler = asyncHandler(
  async (req: Request, res: Response<GetScenario1InputResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const result = await getScenario1InputService(userId);

    res.json({
      success: true,
      data: result,
      message: 'Scenario 1 input retrieved',
    });
  },
);

export const getScenario1OutputHandler = asyncHandler(
  async (req: Request, res: Response<GetScenario1OutputResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const result = await getScenario1OutputService(userId);

    res.json({
      success: true,
      data: result,
      message: 'Scenario 1 output retrieved',
    });
  },
);
