import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.js';
import {
  getQuestionsHandler,
  getSurveyDetailsHandler,
  getSurveyStatusHandler,
  submitSurveyHandler,
} from './survey.controller.js';

const router = Router();

router.get('/survey/questions', getQuestionsHandler);
router.post('/survey-responses', authMiddleware, submitSurveyHandler);
router.get('/survey-responses/me', authMiddleware, getSurveyStatusHandler);
router.get('/survey-responses/me/details', authMiddleware, getSurveyDetailsHandler);

export default router;
