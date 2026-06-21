import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.js';
import { unauthorized } from '@/utils/error.js';
import { SubmitSurveyDto } from './dto/survey.dto.js';
import type {
  GetQuestionsResponseDto,
  GetSurveyDetailsResponseDto,
  GetSurveyStatusResponseDto,
  SubmitSurveyResponseDto,
} from './dto/survey.dto.js';
import * as surveyService from './survey.service.js';

export const getQuestionsHandler = asyncHandler(
  async (req: Request, res: Response<GetQuestionsResponseDto>) => {
    const raw = req.query.locale;
    const locale = raw === 'vi' ? 'vi' : 'en';

    const result = await surveyService.getQuestionsService(locale);

    res.json({
      success: true,
      data: result,
      message: 'Survey questions retrieved',
    });
  },
);

export const submitSurveyHandler = asyncHandler(
  async (req: Request, res: Response<SubmitSurveyResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const data = SubmitSurveyDto.parse(req.body);
    const result = await surveyService.submitSurveyService(userId, data);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Survey submitted',
    });
  },
);

export const getSurveyStatusHandler = asyncHandler(
  async (req: Request, res: Response<GetSurveyStatusResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const result = await surveyService.getSurveyStatusService(userId);

    res.json({
      success: true,
      data: result,
      message: 'Survey status retrieved',
    });
  },
);

export const getSurveyDetailsHandler = asyncHandler(
  async (req: Request, res: Response<GetSurveyDetailsResponseDto>) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');

    const result = await surveyService.getSurveyDetailsService(userId);

    res.json({
      success: true,
      data: result,
      message: 'Survey details retrieved',
    });
  },
);
