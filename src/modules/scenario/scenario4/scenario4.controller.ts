import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.js';
import { unauthorized } from '@/utils/error.js';
import { Scenario4InputDto } from './dto/input.dto.js';
import type {
  CreateScenario4InputResponseDto,
  GetScenario4InputResponseDto,
  GetScenario4OutputResponseDto,
  UpdateScenario4InputResponseDto,
} from './dto/response.dto.js';
import {
  createScenario4Input,
  getScenario4InputService,
  getScenario4OutputService,
  updateScenario4Input,
} from './scenario4.service.js';

export const createScenario4InputHandler = asyncHandler(
  async (req: Request, res: Response<CreateScenario4InputResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const data = Scenario4InputDto.parse(req.body);
    const result = await createScenario4Input(userId, data);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Scenario 4 input created',
    });
  },
);

export const updateScenario4InputHandler = asyncHandler(
  async (req: Request, res: Response<UpdateScenario4InputResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const data = Scenario4InputDto.parse(req.body);
    const result = await updateScenario4Input(userId, data);

    res.json({
      success: true,
      data: result,
      message: 'Scenario 4 input updated',
    });
  },
);

export const getScenario4InputHandler = asyncHandler(
  async (req: Request, res: Response<GetScenario4InputResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const result = await getScenario4InputService(userId);

    res.json({
      success: true,
      data: result,
      message: 'Scenario 4 input retrieved',
    });
  },
);

export const getScenario4OutputHandler = asyncHandler(
  async (req: Request, res: Response<GetScenario4OutputResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const result = await getScenario4OutputService(userId);

    res.json({
      success: true,
      data: result,
      message: 'Scenario 4 output retrieved',
    });
  },
);
