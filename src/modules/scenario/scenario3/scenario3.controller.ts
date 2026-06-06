import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.js';
import { unauthorized } from '@/utils/error.js';
import { Scenario3InputDto } from './dto/input.dto.js';
import type {
  CreateScenario3InputResponseDto,
  GetScenario3InputResponseDto,
  GetScenario3OutputResponseDto,
  UpdateScenario3InputResponseDto,
} from './dto/response.dto.js';
import {
  createScenario3Input,
  getScenario3InputService,
  getScenario3OutputService,
  updateScenario3Input,
} from './scenario3.service.js';

export const createScenario3InputHandler = asyncHandler(
  async (req: Request, res: Response<CreateScenario3InputResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const data = Scenario3InputDto.parse(req.body);
    const result = await createScenario3Input(userId, data);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Scenario 3 input created',
    });
  },
);

export const updateScenario3InputHandler = asyncHandler(
  async (req: Request, res: Response<UpdateScenario3InputResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const data = Scenario3InputDto.parse(req.body);
    const result = await updateScenario3Input(userId, data);

    res.json({
      success: true,
      data: result,
      message: 'Scenario 3 input updated',
    });
  },
);

export const getScenario3InputHandler = asyncHandler(
  async (req: Request, res: Response<GetScenario3InputResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const result = await getScenario3InputService(userId);

    res.json({
      success: true,
      data: result,
      message: 'Scenario 3 input retrieved',
    });
  },
);

export const getScenario3OutputHandler = asyncHandler(
  async (req: Request, res: Response<GetScenario3OutputResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const result = await getScenario3OutputService(userId);

    res.json({
      success: true,
      data: result,
      message: 'Scenario 3 output retrieved',
    });
  },
);
