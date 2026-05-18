import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.js';
import { badRequest, unauthorized } from '@/utils/error.js';
import { CreateUserInfoDto } from './dto/create-main-registration.dto.js';
import {
  UpdateAssetDataDto,
  UpdateFinancialProfileBasicDto,
  UpdateLifestyleProfileDto,
  UpdatePortfolioAllocationsDto,
  UpdateStageDataDto,
  CreateAssetDataDto,
} from './dto/update-financial-profile.dto.js';
import type {
  UpdateAssetDataResponseDto,
  DeleteAssetResponseDto,
  CreateUserInfoResponseDto,
  GetUserInfoResponseDto,
  UpdateFinancialProfileBasicResponseDto,
  UpdateLifestyleProfileResponseDto,
  UpdatePortfolioAllocationsResponseDto,
  UpdateStageDataResponseDto,
  CreateAssetsResponseDto,
  ListAssetsResponseDto,
} from './dto/response.dto.js';
import * as registrationService from './registration.service.js';

export const createUserInfoHandler = asyncHandler(
  async (req: Request, res: Response<CreateUserInfoResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const data = CreateUserInfoDto.parse(req.body);
    const result = await registrationService.createUserInfo(userId, data);

    res.status(201).json({
      success: true,
      data: result,
      message: 'User info created',
    });
  },
);

export const getUserInfoHandler = asyncHandler(
  async (req: Request, res: Response<GetUserInfoResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const result = await registrationService.getUserInfo(userId);

    res.json({
      success: true,
      data: result,
      message: 'User info retrieved',
    });
  },
);

export const updateFinancialProfileBasicHandler = asyncHandler(
  async (
    req: Request,
    res: Response<UpdateFinancialProfileBasicResponseDto>,
  ) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const data = UpdateFinancialProfileBasicDto.parse(req.body);
    await registrationService.updateFinancialProfileBasicService(userId, data);

    res.json({
      success: true,
      data: null,
      message: 'Financial profile updated',
    });
  },
);

export const updatePortfolioAllocationsHandler = asyncHandler(
  async (
    req: Request,
    res: Response<UpdatePortfolioAllocationsResponseDto>,
  ) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const data = UpdatePortfolioAllocationsDto.parse(req.body);
    await registrationService.updatePortfolioAllocationsService(userId, data);

    res.json({
      success: true,
      data: null,
      message: 'Portfolio allocations updated',
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
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid)) {
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

export const updateLifestyleProfileHandler = asyncHandler(
  async (req: Request, res: Response<UpdateLifestyleProfileResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const data = UpdateLifestyleProfileDto.parse(req.body);
    const result = await registrationService.updateLifestyleProfileService(userId, data);

    res.json(result);
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
