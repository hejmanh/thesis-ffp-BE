import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.js';
import { unauthorized } from '@/utils/error.js';
import { RecordConsentDto } from './dto/consent.dto.js';
import type {
  GetConsentStatusResponseDto,
  RecordConsentResponseDto,
} from './dto/consent.dto.js';
import * as consentService from './consent.service.js';

export const recordConsentHandler = asyncHandler(
  async (req: Request, res: Response<RecordConsentResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const data = RecordConsentDto.parse(req.body);
    const result = await consentService.recordConsentService(
      userId,
      data.agreed,
      data.consentVersion,
    );

    res.status(201).json({
      success: true,
      data: result,
      message: 'Consent recorded',
    });
  },
);

export const getConsentStatusHandler = asyncHandler(
  async (req: Request, res: Response<GetConsentStatusResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const result = await consentService.getConsentStatusService(userId);

    res.json({
      success: true,
      data: result,
      message: 'Consent status retrieved',
    });
  },
);
