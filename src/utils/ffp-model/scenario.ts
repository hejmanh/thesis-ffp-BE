import type {
  LifeStage,
  PassiveIncomeAsset,
} from '@/types/ffp-model/financial.js';
import { calculatePortfolioReturn } from './portfolio.js';
import { calculateTotalPassiveIncome } from './passiveIncome.js';
import { calculateSavingAtAge } from './savings.js';
import {
  calculateAvailableSpending,
  calculateRequiredWealth,
} from './retirement.js';
import { calculateWealthAfterFFP, calculateWealthBeforeFFP } from './wealth.js';

export type Scenario1WealthProjectionPoint = {
  age: number;
  wealth: number;
};

export type Scenario2WealthProjectionPoint = {
  age: number;
  wealth: number;
  requiredWealth: number;
};

export type Scenario3RetirementCashflowPoint = {
  age: number;
  wealth: number;
};

export function canReachFFPGoal(
  wealthAtFFP: number,
  requiredWealth: number,
): boolean {
  return wealthAtFFP >= requiredWealth;
}

export function runScenario1({
  currentSavings,
  currentAge,
  ffpAge,
  stages,
  annualSpending,
  retirementDuration,
  u_pre,
  u_post,
  mu_pre,
  r_f_pre,
  mu_post,
  r_f_post,
}: {
  currentSavings: number;
  currentAge: number;
  ffpAge: number;
  stages: LifeStage[];
  annualSpending: number;
  retirementDuration: number;
  u_pre: number;
  u_post: number;
  mu_pre: number;
  r_f_pre: number;
  mu_post: number;
  r_f_post: number;
}) {
  // Pre-FFP: wealth accumulation with higher risk tolerance
  const portfolioReturnPre = calculatePortfolioReturn(u_pre, mu_pre, r_f_pre);

  const wealthAtFFP = calculateWealthBeforeFFP(
    currentSavings,
    currentAge,
    ffpAge,
    stages,
    portfolioReturnPre,
  );

  // Post-FFP: required wealth with more conservative allocation
  const portfolioReturnPost = calculatePortfolioReturn(
    u_post,
    mu_post,
    r_f_post,
  );

  const requiredWealth = calculateRequiredWealth(
    annualSpending,
    portfolioReturnPost,
    retirementDuration,
  );

  return {
    wealthAtFFP,
    requiredWealth,
    achievable: wealthAtFFP >= requiredWealth,
  };
}

export function estimateFFPAge({
  currentSavings,
  currentAge,
  lifeExpectancy,
  stages,
  annualSpending,
  u_pre,
  u_post,
  mu_pre,
  r_f_pre,
  mu_post,
  r_f_post,
}: {
  currentSavings: number;
  currentAge: number;
  lifeExpectancy: number;
  stages: LifeStage[];
  annualSpending: number;
  u_pre: number;
  u_post: number;
  mu_pre: number;
  r_f_pre: number;
  mu_post: number;
  r_f_post: number;
}): number | null {
  // Pre-FFP portfolio return (growth-oriented)
  const portfolioReturnPre = calculatePortfolioReturn(u_pre, mu_pre, r_f_pre);

  // Post-FFP portfolio return (conservative)
  const portfolioReturnPost = calculatePortfolioReturn(
    u_post,
    mu_post,
    r_f_post,
  );

  // Iterate through possible FFP ages
  for (let age = currentAge; age <= lifeExpectancy; age++) {
    // Remaining retirement years from this age
    const remainingRetirementYears = lifeExpectancy - age;

    // Skip if no retirement years remain (edge case)
    if (remainingRetirementYears <= 0) {
      continue;
    }

    // Wealth accumulated at this candidate age
    const wealthAtFFP = calculateWealthBeforeFFP(
      currentSavings,
      currentAge,
      age,
      stages,
      portfolioReturnPre,
    );

    // Required wealth to support spending for retirement duration (post-FFP allocation)
    const requiredWealth = calculateRequiredWealth(
      annualSpending,
      portfolioReturnPost,
      remainingRetirementYears,
    );

    // Check if we can reach FFP at this age
    if (wealthAtFFP >= requiredWealth) {
      return age;
    }
  }

  return null;
}

export function runScenario3({
  wealthAtFFP,
  u_post,
  mu,
  r_f,
  retirementDuration,
  assets,
}: {
  wealthAtFFP: number;
  u_post: number;
  mu: number;
  r_f: number;
  retirementDuration: number;
  assets: PassiveIncomeAsset[];
}) {
  // Post-FFP portfolio return (conservative allocation)
  const portfolioReturnPost = calculatePortfolioReturn(u_post, mu, r_f);

  const passiveIncome = calculateTotalPassiveIncome(assets, 0);

  const availableSpending = calculateAvailableSpending(
    wealthAtFFP,
    portfolioReturnPost,
    retirementDuration,
    passiveIncome,
  );

  return {
    passiveIncome,
    availableSpending,
  };
}

export function buildScenario1WealthProjection({
  currentSavings,
  currentAge,
  ffpAge,
  stages,
  u_pre,
  mu_pre,
  r_f_pre,
}: {
  currentSavings: number;
  currentAge: number;
  ffpAge: number;
  stages: LifeStage[];
  u_pre: number;
  mu_pre: number;
  r_f_pre: number;
}): Scenario1WealthProjectionPoint[] {
  const portfolioReturnPre = calculatePortfolioReturn(u_pre, mu_pre, r_f_pre);
  const projection: Scenario1WealthProjectionPoint[] = [
    {
      age: currentAge,
      wealth: currentSavings,
    },
  ];

  let wealth = currentSavings;

  for (let age = currentAge; age < ffpAge; age++) {
    wealth =
      wealth * (1 + portfolioReturnPre) + calculateSavingAtAge(age, stages);

    projection.push({
      age: age + 1,
      wealth,
    });
  }

  return projection;
}

export function buildScenario2WealthProjection({
  currentSavings,
  currentAge,
  lifeExpectancy,
  outputFfpAge,
  stages,
  annualSpending,
  u_pre,
  u_post,
  mu_pre,
  r_f_pre,
  mu_post,
  r_f_post,
}: {
  currentSavings: number;
  currentAge: number;
  lifeExpectancy: number;
  outputFfpAge: number | null;
  stages: LifeStage[];
  annualSpending: number;
  u_pre: number;
  u_post: number;
  mu_pre: number;
  r_f_pre: number;
  mu_post: number;
  r_f_post: number;
}): Scenario2WealthProjectionPoint[] {
  const portfolioReturnPre = calculatePortfolioReturn(u_pre, mu_pre, r_f_pre);
  const portfolioReturnPost = calculatePortfolioReturn(
    u_post,
    mu_post,
    r_f_post,
  );
  const projectionEndAge = outputFfpAge ?? lifeExpectancy;
  const projection: Scenario2WealthProjectionPoint[] = [];

  for (let age = currentAge; age <= projectionEndAge; age++) {
    projection.push({
      age,
      wealth: calculateWealthBeforeFFP(
        currentSavings,
        currentAge,
        age,
        stages,
        portfolioReturnPre,
      ),
      requiredWealth: calculateRequiredWealth(
        annualSpending,
        portfolioReturnPost,
        lifeExpectancy - age,
      ),
    });
  }

  return projection;
}

export function buildScenario3RetirementCashflow({
  wealthAtFFP,
  annualSpending,
  lifeExpectancy,
  ffpAge,
  u_post,
  mu,
  r_f,
  assets,
}: {
  wealthAtFFP: number;
  annualSpending: number;
  lifeExpectancy: number;
  ffpAge: number;
  u_post: number;
  mu: number;
  r_f: number;
  assets: PassiveIncomeAsset[];
}): Scenario3RetirementCashflowPoint[] {
  const portfolioReturnPost = calculatePortfolioReturn(u_post, mu, r_f);
  const passiveIncome = calculateTotalPassiveIncome(assets, 0);
  const cashflow: Scenario3RetirementCashflowPoint[] = [
    {
      age: ffpAge,
      wealth: wealthAtFFP,
    },
  ];

  let wealth = wealthAtFFP;

  for (let age = ffpAge; age < lifeExpectancy; age++) {
    wealth = calculateWealthAfterFFP(
      wealth,
      annualSpending,
      passiveIncome,
      portfolioReturnPost,
      1,
    );

    cashflow.push({
      age: age + 1,
      wealth: Math.abs(wealth) < 1e-9 ? 0 : wealth,
    });
  }

  return cashflow;
}

/**
 * Low-level binary search for terminal stage annual saving amount.
 * CRITICAL: Only affects terminal stage defined by terminalStageIndex.
 * Existing stages are preserved with their original savings.
 *
 * The stages array MUST include the terminal stage already added by caller.
 */
export function calculateRequiredSaving({
  targetWealth,
  currentSavings,
  currentAge,
  ffpAge,
  portfolioReturn,
  stages,
  terminalStageIndex,
}: {
  targetWealth: number;
  currentSavings: number;
  currentAge: number;
  ffpAge: number;
  portfolioReturn: number;
  stages: LifeStage[];
  terminalStageIndex: number;
}): number {
  const precision = 0.01;
  const maxIterations = 200;
  let left = 0;
  const projectWealthAtSaving = (annualSaving: number) => {
    let wealth = currentSavings;

    for (let age = currentAge; age < ffpAge; age++) {
      let savingAtAge = 0;

      // Find which stage this age belongs to
      for (let stageIndex = 0; stageIndex < stages.length; stageIndex++) {
        const stage = stages[stageIndex]!;
        if (age >= stage.startAge && age < stage.endAge) {
          if (stageIndex === terminalStageIndex) {
            savingAtAge = annualSaving;
          } else {
            // Regular stage: apply growth formula
            const yearsIntoStage = age - stage.startAge;
            savingAtAge =
              stage.initialAnnualSaving *
              Math.pow(1 + stage.growthRate, yearsIntoStage);
          }
          break;
        }
      }

      wealth = wealth * (1 + portfolioReturn) + savingAtAge;
    }

    return wealth;
  };
  let right = findSavingSearchUpperBound({
    targetWealth,
    epsilon: precision,
    projectWealthAtSaving,
    errorMessage: 'Required saving could not be bracketed for binary search',
  });

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    if (right - left <= precision) break;
    const mid = (left + right) / 2;
    const wealth = projectWealthAtSaving(mid);

    if (wealth >= targetWealth) {
      right = mid;
    } else {
      left = mid;
    }
  }

  return right;
}

const SCENARIO4_MIN_SAVING = 0;
const SCENARIO4_EPSILON = 0.000001;
const SCENARIO4_MAX_ITERATIONS = 200;
const SAVING_SEARCH_INITIAL_UPPER_BOUND = 1_000;
const SAVING_SEARCH_MAX_EXPANSIONS = 200;

function findSavingSearchUpperBound({
  targetWealth,
  epsilon,
  projectWealthAtSaving,
  errorMessage,
}: {
  targetWealth: number;
  epsilon: number;
  projectWealthAtSaving: (annualSaving: number) => number;
  errorMessage: string;
}): number {
  const wealthAtZeroSaving = projectWealthAtSaving(0);

  if (wealthAtZeroSaving + epsilon >= targetWealth) {
    return 0;
  }

  let right = SAVING_SEARCH_INITIAL_UPPER_BOUND;

  for (
    let expansion = 0;
    expansion < SAVING_SEARCH_MAX_EXPANSIONS;
    expansion++
  ) {
    const projectedWealth = projectWealthAtSaving(right);

    if (projectedWealth + epsilon >= targetWealth) {
      return right;
    }

    if (Number.isNaN(projectedWealth)) {
      break;
    }

    right *= 2;
  }

  throw new Error(errorMessage);
}

export function projectWealthBeforeFFPWithConstantSaving({
  currentSavings,
  currentAge,
  ffpAge,
  portfolioReturn,
  annualSaving,
}: {
  currentSavings: number;
  currentAge: number;
  ffpAge: number;
  portfolioReturn: number;
  annualSaving: number;
}): number {
  let wealth = currentSavings;

  for (let age = currentAge; age < ffpAge; age++) {
    wealth = wealth * (1 + portfolioReturn) + annualSaving;
  }

  return wealth;
}

export function calculateScenario4RequiredWealthAtFFP({
  inputAnnualSpending,
  portfolioReturnPost,
  retirementDuration,
}: {
  inputAnnualSpending: number;
  portfolioReturnPost: number;
  retirementDuration: number;
}): number {
  console.log('Input Annual Spending:', inputAnnualSpending);
  console.log('Portfolio Return Post-FFP:', portfolioReturnPost);
  console.log('Retirement Duration:', retirementDuration);
  const result = calculateRequiredWealth(
    inputAnnualSpending,
    portfolioReturnPost,
    retirementDuration,
  );
  console.log('Calculated Required Wealth at FFP:', result);
  return result;
}

export function solveScenario4RequiredAnnualSaving({
  targetWealth,
  currentSavings,
  currentAge,
  ffpAge,
  portfolioReturnPre,
}: {
  targetWealth: number;
  currentSavings: number;
  currentAge: number;
  ffpAge: number;
  portfolioReturnPre: number;
}): number {
  let minSaving = SCENARIO4_MIN_SAVING;
  let maxSaving = findSavingSearchUpperBound({
    targetWealth,
    epsilon: SCENARIO4_EPSILON,
    projectWealthAtSaving: (annualSaving) =>
      projectWealthBeforeFFPWithConstantSaving({
        currentSavings,
        currentAge,
        ffpAge,
        portfolioReturn: portfolioReturnPre,
        annualSaving,
      }),
    errorMessage:
      'Required annual saving could not be bracketed for binary search',
  });

  for (let iteration = 0; iteration < SCENARIO4_MAX_ITERATIONS; iteration++) {
    const candidateSaving = (minSaving + maxSaving) / 2;
    const projectedWealth = projectWealthBeforeFFPWithConstantSaving({
      currentSavings,
      currentAge,
      ffpAge,
      portfolioReturn: portfolioReturnPre,
      annualSaving: candidateSaving,
    });

    if (Math.abs(projectedWealth - targetWealth) < SCENARIO4_EPSILON) {
      return candidateSaving;
    }

    if (projectedWealth < targetWealth) {
      minSaving = candidateSaving;
    } else {
      maxSaving = candidateSaving;
    }

    if (maxSaving - minSaving < SCENARIO4_EPSILON) {
      break;
    }
  }

  return (minSaving + maxSaving) / 2;
}

export function runScenario4({
  currentSavings,
  currentAge,
  ffpAge,
  inputAnnualSpending,
  retirementDuration,
  u_pre,
  u_post,
  mu_pre,
  r_f_pre,
  mu_post,
  r_f_post,
}: {
  currentSavings: number;
  currentAge: number;
  ffpAge: number;
  inputAnnualSpending: number;
  retirementDuration: number;
  u_pre: number;
  u_post: number;
  mu_pre: number;
  r_f_pre: number;
  mu_post: number;
  r_f_post: number;
}): {
  requiredAnnualSaving: number;
  ffpAge: number;
  requiredWealthAtFFPAge: number;
} {
  if (ffpAge < currentAge || ffpAge > currentAge + 100) {
    throw new Error(
      'Invalid ffpAge: must be between currentAge and currentAge + 100',
    );
  }
  if (u_pre < 0 || u_pre > 1) {
    throw new Error('u_pre must be in [0, 1]');
  }
  if (u_post < 0 || u_post > 1) {
    throw new Error('u_post must be in [0, 1]');
  }
  if (retirementDuration <= 0) {
    throw new Error('retirementDuration must be > 0');
  }
  if (inputAnnualSpending < 0) {
    throw new Error('inputAnnualSpending must be >= 0');
  }

  const portfolioReturnPost = calculatePortfolioReturn(
    u_post,
    mu_post,
    r_f_post,
  );
  const requiredWealthAtFFPAge = calculateScenario4RequiredWealthAtFFP({
    inputAnnualSpending,
    portfolioReturnPost,
    retirementDuration,
  });

  const portfolioReturnPre = calculatePortfolioReturn(u_pre, mu_pre, r_f_pre);
  const requiredAnnualSaving = solveScenario4RequiredAnnualSaving({
    targetWealth: requiredWealthAtFFPAge,
    currentSavings,
    currentAge,
    ffpAge,
    portfolioReturnPre,
  });

  return {
    requiredAnnualSaving,
    ffpAge,
    requiredWealthAtFFPAge,
  };
}
