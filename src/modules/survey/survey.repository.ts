import { pool } from '@/database/index.js';
import { execQuery, type QueryClient } from '@/database/query.js';
import type { SurveyQuestionItem, SurveyAnswerDetail } from './dto/survey.dto.js';

export type SurveyResponseRow = {
  id: number;
  submittedAt: string;
  feedback: string | null;
};

export const getProfileIdByUserId = async (
  userId: number,
  client: QueryClient = pool,
): Promise<number | null> => {
  const res = await execQuery(
    client,
    `SELECT id FROM profile WHERE user_account_id = $1`,
    [userId],
  );

  const id = res.rows[0]?.id;
  return id == null ? null : Number(id);
};

export const getAllQuestions = async (
  locale: 'en' | 'vi' = 'en',
  client: QueryClient = pool,
): Promise<SurveyQuestionItem[]> => {
  const textCol =
    locale === 'vi'
      ? `COALESCE(question_text_vi, question_text)`
      : `question_text`;

  const res = await execQuery(
    client,
    `
      SELECT
        id,
        code,
        category,
        ${textCol} AS "questionText"
      FROM survey_question
      ORDER BY id ASC
    `,
  );

  return res.rows.map((row) => ({
    id: Number(row.id),
    code: String(row.code),
    category: String(row.category),
    questionText: String(row.questionText),
  }));
};

export const findResponseByProfileId = async (
  profileId: number,
  client: QueryClient = pool,
): Promise<SurveyResponseRow | null> => {
  const res = await execQuery(
    client,
    `
      SELECT
        id,
        submitted_at AS "submittedAt",
        feedback
      FROM survey_response
      WHERE profile_id = $1
    `,
    [profileId],
  );

  const row = res.rows[0];
  if (!row) return null;

  return {
    id: Number(row.id),
    submittedAt: row.submittedAt as string,
    feedback: row.feedback ?? null,
  };
};

export const createResponse = async (
  profileId: number,
  feedback: string | null,
  client: QueryClient = pool,
): Promise<{ id: number; submittedAt: string }> => {
  const res = await execQuery(
    client,
    `
      INSERT INTO survey_response (profile_id, feedback)
      VALUES ($1, $2)
      RETURNING id, submitted_at AS "submittedAt"
    `,
    [profileId, feedback ?? null],
  );

  const row = res.rows[0];
  return {
    id: Number(row.id),
    submittedAt: row.submittedAt as string,
  };
};

export const findExistingQuestionIds = async (
  ids: number[],
  client: QueryClient = pool,
): Promise<number[]> => {
  if (ids.length === 0) return [];

  const res = await execQuery(
    client,
    `SELECT id FROM survey_question WHERE id = ANY($1::int[])`,
    [ids],
  );

  return res.rows.map((row) => Number(row.id));
};

export const createAnswers = async (
  responseId: number,
  answers: { questionId: number; score: number }[],
  client: QueryClient = pool,
): Promise<void> => {
  if (answers.length === 0) return;

  const valuePlaceholders = answers
    .map((_, i) => `($1, $${i * 2 + 2}, $${i * 2 + 3})`)
    .join(', ');

  const values: unknown[] = [responseId];
  for (const answer of answers) {
    values.push(answer.questionId, answer.score);
  }

  await execQuery(
    client,
    `
      INSERT INTO survey_answer (survey_response_id, survey_question_id, score)
      VALUES ${valuePlaceholders}
    `,
    values,
  );
};

export const getResponseDetails = async (
  profileId: number,
  client: QueryClient = pool,
): Promise<{ feedback: string | null; answers: SurveyAnswerDetail[] } | null> => {
  const responseRes = await execQuery(
    client,
    `SELECT id, feedback FROM survey_response WHERE profile_id = $1`,
    [profileId],
  );

  const responseRow = responseRes.rows[0];
  if (!responseRow) return null;

  const answersRes = await execQuery(
    client,
    `
      SELECT
        sa.survey_question_id AS "questionId",
        sq.code,
        sa.score
      FROM survey_answer sa
      JOIN survey_question sq ON sq.id = sa.survey_question_id
      WHERE sa.survey_response_id = $1
      ORDER BY sq.id ASC
    `,
    [Number(responseRow.id)],
  );

  return {
    feedback: responseRow.feedback ?? null,
    answers: answersRes.rows.map((row) => ({
      questionId: Number(row.questionId),
      code: String(row.code),
      score: Number(row.score),
    })),
  };
};
