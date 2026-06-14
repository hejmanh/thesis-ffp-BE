import type { ApiResponse, ApiEmptyResponse } from '@/types/api-response.js';

export type Scenario1InputData = {
  lifeExpectancy: number;
  inputFfpAge: number;
  inputFfpAnnualSpending: number;
};

export type Scenario1WealthProjectionPoint = {
  age: number;
  wealth: number;
};

export type Scenario1OutputData = {
  inputFfpAge: number;
  inputFfpAnnualSpending: number;
  outputIsAchievable: boolean;
  requiredWealthAtFFPAge: number;
  wealthProjection: Scenario1WealthProjectionPoint[];
};

export type CreateScenario1InputResponseDto = ApiResponse<Scenario1InputData>;
export type UpdateScenario1InputResponseDto = ApiResponse<Scenario1InputData>;
export type GetScenario1InputResponseDto = ApiResponse<Scenario1InputData>;
export type GetScenario1OutputResponseDto = ApiResponse<Scenario1OutputData>;

export type Scenario1DeleteResponseDto = ApiEmptyResponse;
