import { withTransaction } from '@/database/transaction.js';
import { badRequest, notFound } from '@/utils/error.js';
import {
  findProfileContextByUserId,
  getFinancialProfileDetails,
  listAssetDataDetails,
  listPortfolioAllocationDetails,
  listStageDataDetails,
} from '@/modules/registration/registration.repository.js';
import {
  calculateCurrentAge,
  calculateRetirementDuration,
} from '@/utils/ffp-model/lifeExpectancy.js';
import {
  buildScenario3RetirementCashflow,
  runScenario3,
} from '@/utils/ffp-model/scenario.js';
import { calculatePortfolioReturn } from '@/utils/ffp-model/portfolio.js';
import { calculateWealthBeforeFFP } from '@/utils/ffp-model/wealth.js';
import { validateFFPAge } from '@/utils/ffp-model/validation.js';
import type {
  LifeStage,
  PassiveIncomeAsset,
} from '@/types/ffp-model/financial.js';
import type { Scenario3InputDto } from './dto/input.dto.js';
import {
  getScenario3Input,
  getScenario3Output,
  upsertScenario3,
} from './scenario3.repository.js';
import { findScenarioTypeIdByNo } from '../scenario.repository.js';

const SCENARIO_NO = 3;

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

const toPassiveIncomeAssets = (
  assetDetails: Awaited<ReturnType<typeof listAssetDataDetails>>,
): PassiveIncomeAsset[] =>
  assetDetails.map((asset) => {
    if (asset.initialAnnualIncome == null) {
      throw badRequest('Post-SRP asset initialAnnualIncome is required');
    }
    if (asset.growthRate == null) {
      throw badRequest('Post-SRP asset growthRate is required');
    }

    return {
      type: asset.assetTypeCode ?? asset.assetTypeTitle ?? asset.uid,
      initialIncome: asset.initialAnnualIncome,
      growthRate: asset.growthRate,
    };
  });

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

  const assets = await listAssetDataDetails(profile.profileId);

  return {
    profileId: profile.profileId,
    currentSavings: financialProfile.currentSavings,
    currentAge: calculateCurrentAge(profile.birthYear),
    stages,
    assets,
    portfolio: {
      uPre: pre.u,
      uPost: post.u,
      muPre: pre.mu,
      rFPre: pre.rf,
      muPost: post.mu,
      rFPost: post.rf,
      sigmaPost: post.sigma ?? 0,
    },
  };
};

export const createScenario3Input = async (
  userId: number,
  payload: Scenario3InputDto,
) => {
  const scenarioTypeId = await findScenarioTypeIdByNo(SCENARIO_NO);
  if (!scenarioTypeId) throw notFound('Scenario type not found');

  const existing = await getScenario3InputByUser(userId, scenarioTypeId);
  if (existing) {
    throw badRequest('Scenario 3 input already exists');
  }

  return upsertScenario3Input(userId, payload, scenarioTypeId);
};

export const updateScenario3Input = async (
  userId: number,
  payload: Scenario3InputDto,
) => {
  const scenarioTypeId = await findScenarioTypeIdByNo(SCENARIO_NO);
  if (!scenarioTypeId) throw notFound('Scenario type not found');

  const existing = await getScenario3InputByUser(userId, scenarioTypeId);
  if (!existing) {
    throw notFound('Scenario 3 input not found');
  }

  return upsertScenario3Input(userId, payload, scenarioTypeId);
};

const upsertScenario3Input = async (
  userId: number,
  payload: Scenario3InputDto,
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

  const stages = toLifeStages(context.stages, lifeExpectancy);
  const assets = toPassiveIncomeAssets(context.assets);

  const portfolioReturnPre = calculatePortfolioReturn(
    context.portfolio.uPre,
    context.portfolio.muPre,
    context.portfolio.rFPre,
  );

  const wealthAtFFP = calculateWealthBeforeFFP(
    context.currentSavings,
    context.currentAge,
    payload.inputFfpAge,
    stages,
    portfolioReturnPre,
  );

  const result = runScenario3({
    wealthAtFFP,
    u_post: context.portfolio.uPost,
    mu: context.portfolio.muPost,
    r_f: context.portfolio.rFPost,
    sigma_post: context.portfolio.sigmaPost,
    retirementDuration,
    assets,
  });

  await withTransaction(async (client) => {
    await upsertScenario3(
      context.profileId,
      scenarioTypeId,
      lifeExpectancy,
      payload.inputFfpAge,
      result.availableSpending,
      client,
    );
  });

  return {
    lifeExpectancy,
    inputFfpAge: payload.inputFfpAge,
  };
};

const getScenario3InputByUser = async (
  userId: number,
  scenarioTypeId: number,
) => {
  const profile = await findProfileContextByUserId(userId);
  if (!profile) throw notFound('Profile not found');

  const input = await getScenario3Input(profile.profileId, scenarioTypeId);
  if (!input) return null;

  if (input.lifeExpectancy == null || input.inputFfpAge == null) {
    return null;
  }

  return {
    lifeExpectancy: input.lifeExpectancy,
    inputFfpAge: input.inputFfpAge,
  };
};

export const getScenario3InputService = async (userId: number) => {
  const scenarioTypeId = await findScenarioTypeIdByNo(SCENARIO_NO);
  if (!scenarioTypeId) throw notFound('Scenario type not found');

  const input = await getScenario3InputByUser(userId, scenarioTypeId);
  if (!input) throw notFound('Scenario 3 input not found');

  return input;
};

export const getScenario3OutputService = async (userId: number) => {
  const scenarioTypeId = await findScenarioTypeIdByNo(SCENARIO_NO);
  if (!scenarioTypeId) throw notFound('Scenario type not found');

  const profile = await findProfileContextByUserId(userId);
  if (!profile) throw notFound('Profile not found');

  const output = await getScenario3Output(profile.profileId, scenarioTypeId);
  if (
    !output ||
    output.lifeExpectancy == null ||
    output.inputFfpAge == null ||
    output.outputFfpAnnualSpending == null
  ) {
    throw notFound('Scenario 3 output not found');
  }

  const context = await getScenarioContext(userId);

  if (output.lifeExpectancy <= context.currentAge) {
    throw badRequest('lifeExpectancy must be greater than current age');
  }

  if (
    !validateFFPAge(
      context.currentAge,
      output.inputFfpAge,
      output.lifeExpectancy,
    )
  ) {
    throw badRequest(
      'inputFfpAge must be within current age and life expectancy',
    );
  }

  const retirementDuration = calculateRetirementDuration(
    output.lifeExpectancy,
    output.inputFfpAge,
  );

  if (retirementDuration <= 0) {
    throw badRequest('Retirement duration must be greater than 0');
  }

  const stages = toLifeStages(context.stages, output.lifeExpectancy);
  const assets = toPassiveIncomeAssets(context.assets);
  const portfolioReturnPre = calculatePortfolioReturn(
    context.portfolio.uPre,
    context.portfolio.muPre,
    context.portfolio.rFPre,
  );
  const wealthAtFFP = calculateWealthBeforeFFP(
    context.currentSavings,
    context.currentAge,
    output.inputFfpAge,
    stages,
    portfolioReturnPre,
  );
  const scenario3Output = runScenario3({
    wealthAtFFP,
    u_post: context.portfolio.uPost,
    mu: context.portfolio.muPost,
    r_f: context.portfolio.rFPost,
    sigma_post: context.portfolio.sigmaPost,
    retirementDuration,
    assets,
  });

  return {
    inputFfpAge: output.inputFfpAge,
    outputFfpAnnualSpendingLow: scenario3Output.availableSpendingLow,
    outputFfpAnnualSpending: scenario3Output.availableSpending,
    outputFfpAnnualSpendingHigh: scenario3Output.availableSpendingHigh,
    outputFfpMonthlySpendingLow: scenario3Output.availableSpendingLow / 12,
    outputFfpMonthlySpending: scenario3Output.availableSpending / 12,
    outputFfpMonthlySpendingHigh: scenario3Output.availableSpendingHigh / 12,
    retirementCashflow: buildScenario3RetirementCashflow({
      wealthAtFFP,
      annualSpending: scenario3Output.availableSpending,
      lifeExpectancy: output.lifeExpectancy,
      ffpAge: output.inputFfpAge,
      u_post: context.portfolio.uPost,
      mu: context.portfolio.muPost,
      r_f: context.portfolio.rFPost,
      sigma_post: context.portfolio.sigmaPost,
      assets,
    }),
  };
};
