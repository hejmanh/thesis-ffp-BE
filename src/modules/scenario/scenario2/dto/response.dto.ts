import type { ApiResponse } from '@/types/api-response.js';

export type Scenario2InputData = {
  lifeExpectancy: number;
  inputFfpAnnualSpending: number;
};

export type Scenario2OutputData = {
  outputFfpAge: number | null;
};

export type CreateScenario2InputResponseDto = ApiResponse<Scenario2InputData>;
export type UpdateScenario2InputResponseDto = ApiResponse<Scenario2InputData>;
export type GetScenario2InputResponseDto = ApiResponse<Scenario2InputData>;
export type GetScenario2OutputResponseDto = ApiResponse<Scenario2OutputData>;
