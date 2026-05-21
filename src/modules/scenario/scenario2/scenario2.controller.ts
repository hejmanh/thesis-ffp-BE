import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.js';
import { unauthorized } from '@/utils/error.js';
import { Scenario2InputDto } from './dto/input.dto.js';
import type {
  CreateScenario2InputResponseDto,
  GetScenario2InputResponseDto,
  GetScenario2OutputResponseDto,
  UpdateScenario2InputResponseDto,
} from './dto/response.dto.js';
import {
  createScenario2Input,
  getScenario2InputService,
  getScenario2OutputService,
  updateScenario2Input,
} from './scenario2.service.js';

export const createScenario2InputHandler = asyncHandler(
  async (req: Request, res: Response<CreateScenario2InputResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const data = Scenario2InputDto.parse(req.body);
    const result = await createScenario2Input(userId, data);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Scenario 2 input created',
    });
  },
);

export const updateScenario2InputHandler = asyncHandler(
  async (req: Request, res: Response<UpdateScenario2InputResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const data = Scenario2InputDto.parse(req.body);
    const result = await updateScenario2Input(userId, data);

    res.json({
      success: true,
      data: result,
      message: 'Scenario 2 input updated',
    });
  },
);

export const getScenario2InputHandler = asyncHandler(
  async (req: Request, res: Response<GetScenario2InputResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const result = await getScenario2InputService(userId);

    res.json({
      success: true,
      data: result,
      message: 'Scenario 2 input retrieved',
    });
  },
);

export const getScenario2OutputHandler = asyncHandler(
  async (req: Request, res: Response<GetScenario2OutputResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const result = await getScenario2OutputService(userId);

    res.json({
      success: true,
      data: result,
      message: 'Scenario 2 output retrieved',
    });
  },
);
