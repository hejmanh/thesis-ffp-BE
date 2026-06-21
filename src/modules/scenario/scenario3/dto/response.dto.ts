import type { ApiResponse } from '@/types/api-response.js';

export type Scenario3InputData = {
  lifeExpectancy: number;
  inputFfpAge: number;
};

export type Scenario3RetirementCashflowPoint = {
  age: number;
  wealthLow: number;
  wealthExpected: number;
  wealthHigh: number;
};

export type Scenario3OutputData = {
  inputFfpAge: number;
  outputFfpAnnualSpendingLow: number;
  outputFfpAnnualSpending: number;
  outputFfpAnnualSpendingHigh: number;
  outputFfpMonthlySpendingLow: number;
  outputFfpMonthlySpending: number;
  outputFfpMonthlySpendingHigh: number;
  retirementCashflow: Scenario3RetirementCashflowPoint[];
};

export type CreateScenario3InputResponseDto = ApiResponse<Scenario3InputData>;
export type UpdateScenario3InputResponseDto = ApiResponse<Scenario3InputData>;
export type GetScenario3InputResponseDto = ApiResponse<Scenario3InputData>;
export type GetScenario3OutputResponseDto = ApiResponse<Scenario3OutputData>;
