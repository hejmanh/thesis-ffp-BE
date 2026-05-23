import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.js';
import { badRequest, unauthorized } from '@/utils/error.js';
import {
  CreateFinancialInfoDto,
  UpdateFinancialInfoDto,
} from './dto/financial-info.dto.js';
import {
  UpdateAssetDataDto,
  CreateStageDataDto,
  UpdateStageDataDto,
  CreateAssetDataDto,
} from './dto/update-financial-profile.dto.js';
import type {
  UpdateAssetDataResponseDto,
  CreateStageDataResponseDto,
  DeleteAssetResponseDto,
  UpdateStageDataResponseDto,
  CreateAssetsResponseDto,
  ListAssetsResponseDto,
  CreateFinancialInfoResponseDto,
  GetFinancialInfoResponseDto,
  UpdateFinancialInfoResponseDto,
  GetStageDataResponseDto,
} from './dto/response.dto.js';
import * as registrationService from './registration.service.js';

export const createFinancialInfoHandler = asyncHandler(
  async (req: Request, res: Response<CreateFinancialInfoResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const data = CreateFinancialInfoDto.parse(req.body);
    const result = await registrationService.createFinancialInfo(userId, data);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Financial info created',
    });
  },
);

export const getFinancialInfoHandler = asyncHandler(
  async (req: Request, res: Response<GetFinancialInfoResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const result = await registrationService.getFinancialInfo(userId);

    res.json({
      success: true,
      data: result,
      message: 'Financial info retrieved',
    });
  },
);

export const updateFinancialInfoHandler = asyncHandler(
  async (req: Request, res: Response<UpdateFinancialInfoResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const data = UpdateFinancialInfoDto.parse(req.body);
    const result = await registrationService.updateFinancialInfo(
      userId,
      data.financial,
    );

    res.json({
      success: true,
      data: result,
      message: 'Financial info updated',
    });
  },
);

export const updateStageDataHandler = asyncHandler(
  async (req: Request, res: Response<UpdateStageDataResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const data = UpdateStageDataDto.parse(req.body);
    await registrationService.updateStageDataService(userId, data);

    res.json({
      success: true,
      data: null,
      message: 'Stage data updated',
    });
  },
);

export const createStageDataHandler = asyncHandler(
  async (req: Request, res: Response<CreateStageDataResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const data = CreateStageDataDto.parse(req.body);
    await registrationService.createStageDataService(userId, data);

    res.status(201).json({
      success: true,
      data: null,
      message: 'Stage data created',
    });
  },
);

export const getStageDataHandler = asyncHandler(
  async (req: Request, res: Response<GetStageDataResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const result = await registrationService.getStageDataService(userId);

    res.json({
      success: true,
      data: result,
      message: 'Stage data retrieved',
    });
  },
);

export const updateAssetDataHandler = asyncHandler(
  async (req: Request, res: Response<UpdateAssetDataResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const data = UpdateAssetDataDto.parse(req.body);
    await registrationService.updateAssetDataService(userId, data);

    res.json({
      success: true,
      data: null,
      message: 'Asset data updated',
    });
  },
);

export const deleteAssetHandler = asyncHandler(
  async (req: Request, res: Response<DeleteAssetResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const uid = String(req.params['uid']);
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        uid,
      )
    ) {
      throw badRequest('Invalid uid');
    }

    await registrationService.deleteAssetService(userId, uid);

    res.json({
      success: true,
      data: null,
      message: 'Asset deleted',
    });
  },
);

export const createAssetsHandler = asyncHandler(
  async (req: Request, res: Response<CreateAssetsResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const data = CreateAssetDataDto.parse(req.body);
    const result = await registrationService.createAssetsService(userId, data);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Assets created',
    });
  },
);

export const listAssetsHandler = asyncHandler(
  async (req: Request, res: Response<ListAssetsResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const result = await registrationService.listAssetsService(userId);

    res.json({
      success: true,
      data: result,
      message: 'Assets retrieved',
    });
  },
);
