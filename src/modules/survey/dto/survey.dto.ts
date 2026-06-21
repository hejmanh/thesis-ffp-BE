import { z } from 'zod';
import type { ApiResponse } from '@/types/api-response.js';

export const SubmitSurveyDto = z.object({
  feedback: z.string().max(2000).optional(),
  answers: z
    .array(
      z.object({
        questionId: z.number().int().positive(),
        score: z.number().int().min(1).max(5),
      }),
    )
    .min(1),
});

export type SubmitSurveyDto = z.infer<typeof SubmitSurveyDto>;

export type SurveyQuestionItem = {
  id: number;
  code: string;
  category: string;
  questionText: string;
};

export type SurveyAnswerDetail = {
  questionId: number;
  code: string;
  score: number;
};

export type SurveyStatus = {
  submitted: boolean;
  submittedAt: string | null;
};

export type SurveyDetails = {
  feedback: string | null;
  answers: SurveyAnswerDetail[];
};

export type GetQuestionsResponseDto = ApiResponse<SurveyQuestionItem[]>;
export type SubmitSurveyResponseDto = ApiResponse<{ submittedAt: string }>;
export type GetSurveyStatusResponseDto = ApiResponse<SurveyStatus>;
export type GetSurveyDetailsResponseDto = ApiResponse<SurveyDetails>;
