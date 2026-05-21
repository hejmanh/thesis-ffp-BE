import { withTransaction } from '@/database/transaction.js';
import { badRequest, notFound } from '@/utils/error.js';
import {
  findProfileContextByUserId,
  getFinancialProfileDetails,
  listPortfolioAllocationDetails,
  listStageDataDetails,
} from '@/modules/registration/registration.repository.js';
import {
  calculateCurrentAge,
  calculateRetirementDuration,
} from '@/utils/ffp-model/lifeExpectancy.js';
import { runScenario1 } from '@/utils/ffp-model/scenario.js';
import { validateFFPAge } from '@/utils/ffp-model/validation.js';
import type { LifeStage } from '@/types/ffp-model/financial.js';
import type { Scenario1InputDto } from './dto/input.dto.js';
import {
  findScenarioTypeIdByNo,
  getScenario1Input,
  getScenario1Output,
  upsertScenario1,
} from './scenario1.repository.js';

const SCENARIO_NO = 1;

const toLifeStages = (
  stageDetails: Awaited<ReturnType<typeof listStageDataDetails>>,
  fallbackEndAge: number,
): LifeStage[] => {
  return stageDetails.map((stage) => {
    if (stage.beginningAge == null) {
      throw badRequest('Stage beginningAge is required');
    }
    if (stage.initialAnnualSavings == null) {
      throw badRequest('Stage initialAnnualSavings is required');
    }
    if (stage.growthRate == null) {
      throw badRequest('Stage growthRate is required');
    }

    const endAge = stage.endingAge ?? fallbackEndAge;
    if (endAge == null) {
      throw badRequest('Stage endingAge is required');
    }

    return {
      startAge: stage.beginningAge,
      endAge,
      initialAnnualSaving: stage.initialAnnualSavings,
      growthRate: stage.growthRate,
    };
  });
};

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

  const stages = await listStageDataDetails(profile.profileId);
  if (stages.length === 0) {
    throw badRequest('Life stages are required');
  }

  return {
    profileId: profile.profileId,
    currentSavings: financialProfile.currentSavings,
    currentAge: calculateCurrentAge(profile.birthYear),
    stages,
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

export const createScenario1Input = async (
  userId: number,
  payload: Scenario1InputDto,
) => {
  const scenarioTypeId = await findScenarioTypeIdByNo(SCENARIO_NO);
  if (!scenarioTypeId) throw notFound('Scenario type not found');

  const existing = await getScenario1InputByUser(userId, scenarioTypeId);
  if (existing) {
    throw badRequest('Scenario 1 input already exists');
  }

  return upsertScenario1Input(userId, payload, scenarioTypeId);
};

export const updateScenario1Input = async (
  userId: number,
  payload: Scenario1InputDto,
) => {
  const scenarioTypeId = await findScenarioTypeIdByNo(SCENARIO_NO);
  if (!scenarioTypeId) throw notFound('Scenario type not found');

  const existing = await getScenario1InputByUser(userId, scenarioTypeId);
  if (!existing) {
    throw notFound('Scenario 1 input not found');
  }

  return upsertScenario1Input(userId, payload, scenarioTypeId);
};

const upsertScenario1Input = async (
  userId: number,
  payload: Scenario1InputDto,
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

  const stages = toLifeStages(context.stages, payload.inputFfpAge);

  const result = runScenario1({
    currentSavings: context.currentSavings,
    currentAge: context.currentAge,
    ffpAge: payload.inputFfpAge,
    stages,
    annualSpending: payload.inputFfpAnnualSpending,
    retirementDuration,
    u_pre: context.portfolio.uPre,
    u_post: context.portfolio.uPost,
    mu_pre: context.portfolio.muPre,
    r_f_pre: context.portfolio.rFPre,
    mu_post: context.portfolio.muPost,
    r_f_post: context.portfolio.rFPost,
  });

  await withTransaction(async (client) => {
    await upsertScenario1(
      context.profileId,
      scenarioTypeId,
      lifeExpectancy,
      payload.inputFfpAge,
      payload.inputFfpAnnualSpending,
      result.achievable,
      client,
    );
  });

  return {
    lifeExpectancy,
    inputFfpAge: payload.inputFfpAge,
    inputFfpAnnualSpending: payload.inputFfpAnnualSpending,
  };
};

const getScenario1InputByUser = async (
  userId: number,
  scenarioTypeId: number,
) => {
  const profile = await findProfileContextByUserId(userId);
  if (!profile) throw notFound('Profile not found');

  const input = await getScenario1Input(profile.profileId, scenarioTypeId);
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

export const getScenario1InputService = async (userId: number) => {
  const scenarioTypeId = await findScenarioTypeIdByNo(SCENARIO_NO);
  if (!scenarioTypeId) throw notFound('Scenario type not found');

  const input = await getScenario1InputByUser(userId, scenarioTypeId);
  if (!input) throw notFound('Scenario 1 input not found');

  return input;
};

export const getScenario1OutputService = async (userId: number) => {
  const scenarioTypeId = await findScenarioTypeIdByNo(SCENARIO_NO);
  if (!scenarioTypeId) throw notFound('Scenario type not found');

  const profile = await findProfileContextByUserId(userId);
  if (!profile) throw notFound('Profile not found');

  const output = await getScenario1Output(profile.profileId, scenarioTypeId);
  if (!output) throw notFound('Scenario 1 output not found');

  return output;
};
