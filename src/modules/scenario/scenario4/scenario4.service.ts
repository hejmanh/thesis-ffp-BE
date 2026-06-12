import { withTransaction } from '@/database/transaction.js';
import { badRequest, notFound } from '@/utils/error.js';
import {
  findProfileContextByUserId,
  getFinancialProfileDetails,
  listPortfolioAllocationDetails,
} from '@/modules/registration/registration.repository.js';
import {
  calculateCurrentAge,
  calculateRetirementDuration,
} from '@/utils/ffp-model/lifeExpectancy.js';
import { runScenario4 } from '@/utils/ffp-model/scenario.js';
import { validateFFPAge } from '@/utils/ffp-model/validation.js';
import type { Scenario4InputDto } from './dto/input.dto.js';
import {
  getScenario4Input,
  getScenario4Output,
  upsertScenario4,
} from './scenario4.repository.js';
import { findScenarioTypeIdByNo } from '../scenario.repository.js';

const SCENARIO_NO = 4;

const getScenarioContext = async (userId: number) => {
  const profile = await findProfileContextByUserId(userId);
  if (!profile) throw notFound('Profile not found');

  if (profile.birthYear == null) {
    throw badRequest('Birth year is required');
  }

  const financialProfile = await getFinancialProfileDetails(profile.profileId);
  if (!financialProfile) throw notFound('Financial profile not found');

  if (financialProfile.currentSavings == null) {
    throw badRequest('Current savings is required');
  }

  const allocations = await listPortfolioAllocationDetails(profile.profileId);
  const pre = allocations.find((item) => item.allocationType === 'PRE_FFP');
  const post = allocations.find((item) => item.allocationType === 'POST_FFP');

  if (!pre || !post) {
    throw badRequest('Portfolio allocations must include PRE_FFP and POST_FFP');
  }

  if (pre.u == null || pre.mu == null || pre.rf == null) {
    throw badRequest('PRE_FFP portfolio allocation is incomplete');
  }
  if (post.u == null || post.mu == null || post.rf == null) {
    throw badRequest('POST_FFP portfolio allocation is incomplete');
  }

  return {
    profileId: profile.profileId,
    currentSavings: financialProfile.currentSavings,
    currentAge: calculateCurrentAge(profile.birthYear),
    portfolio: {
      uPre: pre.u,
      uPost: post.u,
      muPre: pre.mu,
      rFPre: pre.rf,
      muPost: post.mu,
      rFPost: post.rf,
    },
  };
};

export const createScenario4Input = async (
  userId: number,
  payload: Scenario4InputDto,
) => {
  const scenarioTypeId = await findScenarioTypeIdByNo(SCENARIO_NO);
  if (!scenarioTypeId) throw notFound('Scenario type not found');

  const existing = await getScenario4InputByUser(userId, scenarioTypeId);
  if (existing) {
    throw badRequest('Scenario 4 input already exists');
  }

  return upsertScenario4Input(userId, payload, scenarioTypeId);
};

export const updateScenario4Input = async (
  userId: number,
  payload: Scenario4InputDto,
) => {
  const scenarioTypeId = await findScenarioTypeIdByNo(SCENARIO_NO);
  if (!scenarioTypeId) throw notFound('Scenario type not found');

  const existing = await getScenario4InputByUser(userId, scenarioTypeId);
  if (!existing) {
    throw notFound('Scenario 4 input not found');
  }

  return upsertScenario4Input(userId, payload, scenarioTypeId);
};

const upsertScenario4Input = async (
  userId: number,
  payload: Scenario4InputDto,
  scenarioTypeId: number,
) => {
  const context = await getScenarioContext(userId);
  const lifeExpectancy = payload.lifeExpectancy;

  if (lifeExpectancy <= context.currentAge) {
    throw badRequest('lifeExpectancy must be greater than current age');
  }

  if (
    !validateFFPAge(context.currentAge, payload.inputFfpAge, lifeExpectancy)
  ) {
    throw badRequest(
      'inputFfpAge must be within current age and life expectancy',
    );
  }

  const retirementDuration = calculateRetirementDuration(
    lifeExpectancy,
    payload.inputFfpAge,
  );

  if (retirementDuration <= 0) {
    throw badRequest('Retirement duration must be greater than 0');
  }

  let result;
  try {
    result = runScenario4({
      currentSavings: context.currentSavings,
      currentAge: context.currentAge,
      ffpAge: payload.inputFfpAge,
      inputAnnualSpending: payload.inputFfpAnnualSpending,
      retirementDuration,
      u_pre: context.portfolio.uPre,
      u_post: context.portfolio.uPost,
      mu_pre: context.portfolio.muPre,
      r_f_pre: context.portfolio.rFPre,
      mu_post: context.portfolio.muPost,
      r_f_post: context.portfolio.rFPost,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw badRequest(error.message);
    }
    throw error;
  }

  await withTransaction(async (client) => {
    await upsertScenario4(
      context.profileId,
      scenarioTypeId,
      lifeExpectancy,
      payload.inputFfpAge,
      payload.inputFfpAnnualSpending,
      result.requiredAnnualSaving,
      result.requiredWealthAtFFPAge,
      client,
    );
  });

  return {
    lifeExpectancy,
    inputFfpAge: payload.inputFfpAge,
    inputFfpAnnualSpending: payload.inputFfpAnnualSpending,
  };
};

const getScenario4InputByUser = async (
  userId: number,
  scenarioTypeId: number,
) => {
  const profile = await findProfileContextByUserId(userId);
  if (!profile) throw notFound('Profile not found');

  const input = await getScenario4Input(profile.profileId, scenarioTypeId);
  if (!input) return null;

  if (
    input.lifeExpectancy == null ||
    input.inputFfpAge == null ||
    input.inputFfpAnnualSpending == null
  ) {
    return null;
  }

  return {
    lifeExpectancy: input.lifeExpectancy,
    inputFfpAge: input.inputFfpAge,
    inputFfpAnnualSpending: input.inputFfpAnnualSpending,
  };
};

export const getScenario4InputService = async (userId: number) => {
  const scenarioTypeId = await findScenarioTypeIdByNo(SCENARIO_NO);
  if (!scenarioTypeId) throw notFound('Scenario type not found');

  const input = await getScenario4InputByUser(userId, scenarioTypeId);
  if (!input) throw notFound('Scenario 4 input not found');

  return input;
};

export const getScenario4OutputService = async (userId: number) => {
  const scenarioTypeId = await findScenarioTypeIdByNo(SCENARIO_NO);
  if (!scenarioTypeId) throw notFound('Scenario type not found');

  const profile = await findProfileContextByUserId(userId);
  if (!profile) throw notFound('Profile not found');

  const output = await getScenario4Output(profile.profileId, scenarioTypeId);
  if (
    !output ||
    output.requiredAnnualSaving == null ||
    output.ffpAge == null ||
    output.inputFfpAnnualSpending == null ||
    output.requiredWealthAtFFPAge == null
  ) {
    throw notFound('Scenario 4 output not found');
  }

  return {
    requiredAnnualSaving: output.requiredAnnualSaving,
    ffpAge: output.ffpAge,
    inputFfpAnnualSpending: output.inputFfpAnnualSpending,
    requiredWealthAtFFPAge: output.requiredWealthAtFFPAge,
  };
};
