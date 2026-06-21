import type { ApiResponse } from '@/types/api-response.js';

export type Scenario2InputData = {
  lifeExpectancy: number;
  inputFfpAnnualSpending: number;
};

export type Scenario2WealthProjectionPoint = {
  age: number;
  wealthLow: number;
  wealthExpected: number;
  wealthHigh: number;
  requiredWealth: number;
};

export type Scenario2OutputData = {
  inputFfpAnnualSpending: number;
  outputFfpAgeLow: number | null;
  outputFfpAge: number | null;
  outputFfpAgeHigh: number | null;
  wealthProjection: Scenario2WealthProjectionPoint[];
};

export type CreateScenario2InputResponseDto = ApiResponse<Scenario2InputData>;
export type UpdateScenario2InputResponseDto = ApiResponse<Scenario2InputData>;
export type GetScenario2InputResponseDto = ApiResponse<Scenario2InputData>;
export type GetScenario2OutputResponseDto = ApiResponse<Scenario2OutputData>;
