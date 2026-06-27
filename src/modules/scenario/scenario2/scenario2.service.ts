import { withTransaction } from '@/database/transaction.js';
import { badRequest, notFound } from '@/utils/error.js';
import {
  findProfileContextByUserId,
  getFinancialProfileDetails,
  listPortfolioAllocationDetails,
  listStageDataDetails,
} from '@/modules/registration/registration.repository.js';
import { calculateCurrentAge } from '@/utils/ffp-model/lifeExpectancy.js';
import {
  buildScenario2WealthProjection,
  estimateFFPAgeRange,
} from '@/utils/ffp-model/scenario.js';
import type { LifeStage } from '@/types/ffp-model/financial.js';
import type { Scenario2InputDto } from './dto/input.dto.js';
import {
  getScenario2Input,
  getScenario2Output,
  upsertScenario2,
} from './scenario2.repository.js';
import { findScenarioTypeIdByNo } from '../scenario.repository.js';

const SCENARIO_NO = 2;

const toLifeStages = (
  stageDetails: Awaited<ReturnType<typeof listStageDataDetails>>,
  fallbackEndAge: number,
): LifeStage[] => {
  const normalized = stageDetails.map((stage) => {
    if (stage.beginningAge == null) {
      throw badRequest('Stage beginningAge is required');
    }
    if (stage.initialAnnualSavings == null) {
      throw badRequest('Stage initialAnnualSavings is required');
    }
    if (stage.growthRate == null) {
      throw badRequest('Stage growthRate is required');
    }

    return {
      beginningAge: stage.beginningAge,
      endingAge: stage.endingAge,
      initialAnnualSavings: stage.initialAnnualSavings,
      growthRate: stage.growthRate,
    };
  });

  const sorted = [...normalized].sort(
    (a, b) => a.beginningAge - b.beginningAge,
  );

  return sorted.map((stage, index) => {
    const isLast = index === sorted.length - 1;
    const endAge =
      stage.endingAge == null ? (isLast ? fallbackEndAge : null) : stage.endingAge + 1;

    if (endAge == null) {
      throw badRequest('Only the last stage can have a null endingAge');
    }
    if (endAge <= stage.beginningAge) {
      throw badRequest('Stage endingAge must be greater than beginningAge');
    }

    if (index > 0) {
      const prevEndAge = sorted[index - 1]!.endingAge ?? fallbackEndAge;
      if (prevEndAge + 1 !== stage.beginningAge) {
        throw badRequest('Stages must be contiguous and non-overlapping');
      }
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
    throw badRequest('Portfolio allocations must include pre- and post-SRP allocations');
  }

  if (pre.u == null || pre.mu == null || pre.rf == null) {
    throw badRequest('Pre-SRP portfolio allocation is incomplete');
  }
  if (post.u == null || post.mu == null || post.rf == null) {
    throw badRequest('Post-SRP portfolio allocation is incomplete');
  }

  const stages = await listStageDataDetails(profile.profileId);

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
      sigmaPre: pre.sigma ?? 0,
      muPost: post.mu,
      rFPost: post.rf,
    },
  };
};

export const createScenario2Input = async (
  userId: number,
  payload: Scenario2InputDto,
) => {
  const scenarioTypeId = await findScenarioTypeIdByNo(SCENARIO_NO);
  if (!scenarioTypeId) throw notFound('Scenario type not found');

  const existing = await getScenario2InputByUser(userId, scenarioTypeId);
  if (existing) {
    throw badRequest('Scenario 2 input already exists');
  }

  return upsertScenario2Input(userId, payload, scenarioTypeId);
};

export const updateScenario2Input = async (
  userId: number,
  payload: Scenario2InputDto,
) => {
  const scenarioTypeId = await findScenarioTypeIdByNo(SCENARIO_NO);
  if (!scenarioTypeId) throw notFound('Scenario type not found');

  const existing = await getScenario2InputByUser(userId, scenarioTypeId);
  if (!existing) {
    throw notFound('Scenario 2 input not found');
  }

  return upsertScenario2Input(userId, payload, scenarioTypeId);
};

const upsertScenario2Input = async (
  userId: number,
  payload: Scenario2InputDto,
  scenarioTypeId: number,
) => {
  const context = await getScenarioContext(userId);
  const lifeExpectancy = payload.lifeExpectancy;

  if (lifeExpectancy <= context.currentAge) {
    throw badRequest('lifeExpectancy must be greater than current age');
  }

  const stages = toLifeStages(context.stages, lifeExpectancy);

  const outputFfpAges = estimateFFPAgeRange({
    currentSavings: context.currentSavings,
    currentAge: context.currentAge,
    lifeExpectancy,
    stages,
    annualSpending: payload.inputFfpAnnualSpending,
    u_pre: context.portfolio.uPre,
    u_post: context.portfolio.uPost,
    mu_pre: context.portfolio.muPre,
    r_f_pre: context.portfolio.rFPre,
    sigma_pre: context.portfolio.sigmaPre,
    mu_post: context.portfolio.muPost,
    r_f_post: context.portfolio.rFPost,
  });

  await withTransaction(async (client) => {
    await upsertScenario2(
      context.profileId,
      scenarioTypeId,
      lifeExpectancy,
      payload.inputFfpAnnualSpending,
      outputFfpAges.expected,
      client,
    );
  });

  return {
    lifeExpectancy,
    inputFfpAnnualSpending: payload.inputFfpAnnualSpending,
  };
};

const getScenario2InputByUser = async (
  userId: number,
  scenarioTypeId: number,
) => {
  const profile = await findProfileContextByUserId(userId);
  if (!profile) throw notFound('Profile not found');

  const input = await getScenario2Input(profile.profileId, scenarioTypeId);
  if (!input) return null;

  if (input.lifeExpectancy == null || input.inputFfpAnnualSpending == null) {
    return null;
  }

  return {
    lifeExpectancy: input.lifeExpectancy,
    inputFfpAnnualSpending: input.inputFfpAnnualSpending,
  };
};

export const getScenario2InputService = async (userId: number) => {
  const scenarioTypeId = await findScenarioTypeIdByNo(SCENARIO_NO);
  if (!scenarioTypeId) throw notFound('Scenario type not found');

  const input = await getScenario2InputByUser(userId, scenarioTypeId);
  if (!input) throw notFound('Scenario 2 input not found');

  return input;
};

export const getScenario2OutputService = async (userId: number) => {
  const scenarioTypeId = await findScenarioTypeIdByNo(SCENARIO_NO);
  if (!scenarioTypeId) throw notFound('Scenario type not found');

  const profile = await findProfileContextByUserId(userId);
  if (!profile) throw notFound('Profile not found');

  const output = await getScenario2Output(profile.profileId, scenarioTypeId);
  if (
    !output ||
    output.lifeExpectancy == null ||
    output.inputFfpAnnualSpending == null
  ) {
    throw notFound('Scenario 2 output not found');
  }

  const context = await getScenarioContext(userId);

  if (output.lifeExpectancy <= context.currentAge) {
    throw badRequest('lifeExpectancy must be greater than current age');
  }

  const stages = toLifeStages(context.stages, output.lifeExpectancy);
  const outputFfpAges = estimateFFPAgeRange({
    currentSavings: context.currentSavings,
    currentAge: context.currentAge,
    lifeExpectancy: output.lifeExpectancy,
    stages,
    annualSpending: output.inputFfpAnnualSpending,
    u_pre: context.portfolio.uPre,
    u_post: context.portfolio.uPost,
    mu_pre: context.portfolio.muPre,
    r_f_pre: context.portfolio.rFPre,
    sigma_pre: context.portfolio.sigmaPre,
    mu_post: context.portfolio.muPost,
    r_f_post: context.portfolio.rFPost,
  });

  return {
    inputFfpAnnualSpending: output.inputFfpAnnualSpending,
    outputFfpAgeLow: outputFfpAges.low,
    outputFfpAge: outputFfpAges.expected,
    outputFfpAgeHigh: outputFfpAges.high,
    wealthProjection: buildScenario2WealthProjection({
      currentSavings: context.currentSavings,
      currentAge: context.currentAge,
      lifeExpectancy: output.lifeExpectancy,
      outputFfpAgeLow: outputFfpAges.low,
      stages,
      annualSpending: output.inputFfpAnnualSpending,
      u_pre: context.portfolio.uPre,
      u_post: context.portfolio.uPost,
      mu_pre: context.portfolio.muPre,
      r_f_pre: context.portfolio.rFPre,
      sigma_pre: context.portfolio.sigmaPre,
      mu_post: context.portfolio.muPost,
      r_f_post: context.portfolio.rFPost,
    }),
  };
};
