import type {
  LifeStage,
  PassiveIncomeAsset,
} from '@/types/ffp-model/financial.js';
import { calculatePortfolioReturn } from './portfolio.js';
import { calculateTotalPassiveIncome } from './passiveIncome.js';
import {
  calculateAvailableSpending,
  calculateRequiredWealth,
} from './retirement.js';
import { calculateWealthBeforeFFP } from './wealth.js';

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
  mu,
  r_f,
}: {
  currentSavings: number;
  currentAge: number;
  ffpAge: number;
  stages: LifeStage[];
  annualSpending: number;
  retirementDuration: number;
  u_pre: number;
  u_post: number;
  mu: number;
  r_f: number;
}) {
  // Pre-FFP: wealth accumulation with higher risk tolerance
  const portfolioReturnPre = calculatePortfolioReturn(u_pre, mu, r_f);

  const wealthAtFFP = calculateWealthBeforeFFP(
    currentSavings,
    currentAge,
    ffpAge,
    stages,
    portfolioReturnPre,
  );

  // Post-FFP: required wealth with more conservative allocation
  const portfolioReturnPost = calculatePortfolioReturn(u_post, mu, r_f);

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
  mu,
  r_f,
}: {
  currentSavings: number;
  currentAge: number;
  lifeExpectancy: number;
  stages: LifeStage[];
  annualSpending: number;
  u_pre: number;
  u_post: number;
  mu: number;
  r_f: number;
}): number | null {
  // Pre-FFP portfolio return (growth-oriented)
  const portfolioReturnPre = calculatePortfolioReturn(u_pre, mu, r_f);

  // Post-FFP portfolio return (conservative)
  const portfolioReturnPost = calculatePortfolioReturn(u_post, mu, r_f);

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

/**
 * Low-level binary search for terminal stage annual saving amount.
 * CRITICAL: Only affects terminal stage (marked by initialAnnualSaving=0).
 * Existing stages are preserved with their original savings.
 *
 * The stages array MUST include the terminal stage already added by caller.
 * Terminal stage is identified by: initialAnnualSaving=0 AND growthRate=0
 */
export function calculateRequiredSaving({
  targetWealth,
  currentSavings,
  currentAge,
  ffpAge,
  portfolioReturn,
  stages,
}: {
  targetWealth: number;
  currentSavings: number;
  currentAge: number;
  ffpAge: number;
  portfolioReturn: number;
  stages: LifeStage[];
}): number {
  let left = 0;
  let right = 1_000_000_000;

  while (right - left > 1) {
    const mid = (left + right) / 2;

    let wealth = currentSavings;

    for (let age = currentAge; age < ffpAge; age++) {
      let savingAtAge = 0;

      // Find which stage this age belongs to
      for (const stage of stages) {
        if (age >= stage.startAge && age < stage.endAge) {
          // If this is the terminal stage (marker: initialAnnualSaving=0),
          // use binary search value; otherwise use stage formula
          if (stage.initialAnnualSaving === 0 && stage.growthRate === 0) {
            savingAtAge = mid;
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

    if (wealth >= targetWealth) {
      right = mid;
    } else {
      left = mid;
    }
  }

  return right;
}

/**
 * High-level Scenario 4 wrapper that handles:
 * - Stage extension logic
 * - Terminal stage creation
 * - Constraint validation
 * - Calls low-level binary search solver
 */
export function runScenario4({
  currentSavings,
  currentAge,
  ffpAge,
  stages,
  annualSpending,
  retirementDuration,
  u_pre,
  u_post,
  mu,
  r_f,
}: {
  currentSavings: number;
  currentAge: number;
  ffpAge: number;
  stages: LifeStage[];
  annualSpending: number;
  retirementDuration: number;
  u_pre: number;
  u_post: number;
  mu: number;
  r_f: number;
}): {
  requiredAnnualSaving: number;
  stages: LifeStage[];
  isTerminalStageAdded: boolean;
} {
  // Validate input constraints
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
  if (annualSpending < 0) {
    throw new Error('annualSpending must be >= 0');
  }

  // Calculate required wealth at FFP using post-FFP portfolio
  const portfolioReturnPost = calculatePortfolioReturn(u_post, mu, r_f);

  const requiredWealth = calculateRequiredWealth(
    annualSpending,
    portfolioReturnPost,
    retirementDuration,
  );

  // Portfolio return for pre-FFP wealth accumulation
  const portfolioReturnPre = calculatePortfolioReturn(u_pre, mu, r_f);

  // Handle stage extension: determine terminal stage
  let workingStages = [...stages];
  let isTerminalStageAdded = false;

  if (stages.length === 0) {
    // Case 2: No stages provided → create single terminal stage
    workingStages = [
      {
        startAge: currentAge,
        endAge: ffpAge,
        initialAnnualSaving: 0, // Terminal stage marker: solved by binary search
        growthRate: 0,
      },
    ];
    isTerminalStageAdded = true;
  } else {
    const lastStage = stages[stages.length - 1]!;

    if (lastStage.endAge < ffpAge) {
      // Case 1: Add terminal stage between last existing stage and ffpAge
      workingStages.push({
        startAge: lastStage.endAge,
        endAge: ffpAge,
        initialAnnualSaving: 0, // Terminal stage marker: solved by binary search
        growthRate: 0,
      });
      isTerminalStageAdded = true;
    } else if (lastStage.endAge >= ffpAge) {
      // Case 3: Stages already cover up to or past ffpAge → cannot solve
      throw new Error(
        'Stages already cover up to or past ffpAge. ' +
          'Please select other scenarios, adjust ffpAge, or reduce endAge of stages.',
      );
    }
  }

  // Binary search for required terminal stage saving
  // CRITICAL: passes workingStages so only terminal stage is unknown
  const requiredAnnualSaving = calculateRequiredSaving({
    targetWealth: requiredWealth,
    currentSavings,
    currentAge,
    ffpAge,
    portfolioReturn: portfolioReturnPre,
    stages: workingStages,
  });

  return {
    requiredAnnualSaving,
    stages: workingStages,
    isTerminalStageAdded,
  };
}
