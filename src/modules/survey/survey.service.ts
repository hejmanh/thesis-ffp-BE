import { withTransaction } from '@/database/transaction.js';
import { badRequest, notFound } from '@/utils/error.js';
import type { SubmitSurveyDto } from './dto/survey.dto.js';
import {
  createAnswers,
  createResponse,
  findExistingQuestionIds,
  findResponseByProfileId,
  getAllQuestions,
  getProfileIdByUserId,
  getResponseDetails,
} from './survey.repository.js';

export const getQuestionsService = async (locale: 'en' | 'vi' = 'en') => {
  return getAllQuestions(locale);
};

export const submitSurveyService = async (
  userId: number,
  data: SubmitSurveyDto,
) => {
  const profileId = await getProfileIdByUserId(userId);
  if (profileId == null) throw notFound('Profile not found');

  const existing = await findResponseByProfileId(profileId);
  if (existing) throw badRequest('Survey has already been submitted');

  const requestedIds = data.answers.map((a) => a.questionId);
  const foundIds = await findExistingQuestionIds(requestedIds);

  if (foundIds.length !== requestedIds.length) {
    const missingIds = requestedIds.filter((id) => !foundIds.includes(id));
    throw badRequest(`Invalid questionId(s): ${missingIds.join(', ')}`);
  }

  const result = await withTransaction(async (client) => {
    const response = await createResponse(
      profileId,
      data.feedback ?? null,
      client,
    );
    await createAnswers(response.id, data.answers, client);
    return response;
  });

  return { submittedAt: result.submittedAt };
};

export const getSurveyStatusService = async (userId: number) => {
  const profileId = await getProfileIdByUserId(userId);
  if (profileId == null) throw notFound('Profile not found');

  const response = await findResponseByProfileId(profileId);

  return {
    submitted: response != null,
    submittedAt: response?.submittedAt ?? null,
  };
};

export const getSurveyDetailsService = async (userId: number) => {
  const profileId = await getProfileIdByUserId(userId);
  if (profileId == null) throw notFound('Profile not found');

  const details = await getResponseDetails(profileId);
  if (!details) throw notFound('Survey response not found');

  return details;
};
