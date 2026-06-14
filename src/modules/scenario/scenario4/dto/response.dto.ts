import type { ApiResponse } from '@/types/api-response.js';

export type Scenario4InputData = {
  lifeExpectancy: number;
  inputFfpAge: number;
  inputFfpAnnualSpending: number;
};

export type Scenario4OutputData = {
  requiredAnnualSaving: number;
  ffpAge: number;
  inputFfpAnnualSpending: number;
  requiredWealthAtFFPAge: number;
};

export type CreateScenario4InputResponseDto = ApiResponse<Scenario4InputData>;
export type UpdateScenario4InputResponseDto = ApiResponse<Scenario4InputData>;
export type GetScenario4InputResponseDto = ApiResponse<Scenario4InputData>;
export type GetScenario4OutputResponseDto = ApiResponse<Scenario4OutputData>;
