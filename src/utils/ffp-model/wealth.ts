import type { LifeStage } from '@/types/ffp-model/financial.js';
import { calculateSavingAtAge } from './savings.js';

export function calculateWealthBeforeFFP(
  currentSavings: number,
  currentAge: number,
  ffpAge: number,
  stages: LifeStage[],
  portfolioReturn: number,
): number {
  let wealth = currentSavings;

  for (let age = currentAge; age < ffpAge; age++) {
    const annualSaving = calculateSavingAtAge(age, stages);

    wealth = wealth * (1 + portfolioReturn) + annualSaving;
  }

  return wealth;
}

export function calculateWealthAfterFFP(
  initialWealth: number,
  annualSpending: number,
  annualIncome: number,
  returnRate: number,
  years: number,
): number {
  let wealth = initialWealth;

  for (let i = 0; i < years; i++) {
    wealth = wealth * (1 + returnRate);
    wealth = wealth - annualSpending + annualIncome;
  }

  return wealth;
}
