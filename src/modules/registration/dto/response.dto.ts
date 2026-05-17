import type { ApiEmptyResponse, ApiResponse } from '@/types/api-response.js';
import type { UserInfoDto } from './create-main-registration.dto.js';

type UserInfoDataDto = {
  userInfo: UserInfoDto;
};

type AssetDataResponseItem = {
  assetId: number;
  assetTypeCode: string | null;
  assetTypeTitle: string | null;
  initialAnnualIncome: number;
  growthRate: number;
};

type GetUserInfoData = {
  userInfo: Omit<UserInfoDto, 'assetData'> & {
    assetData: AssetDataResponseItem[];
  };
};

export type CreateUserInfoResponseDto = ApiResponse<UserInfoDataDto>;

export type GetUserInfoResponseDto = ApiResponse<GetUserInfoData>;

export type UpdateFinancialProfileBasicResponseDto = ApiEmptyResponse;
export type UpdatePortfolioAllocationsResponseDto = ApiEmptyResponse;
export type UpdateStageDataResponseDto = ApiEmptyResponse;
export type UpdateAssetDataResponseDto = ApiEmptyResponse;
export type DeleteAssetResponseDto = ApiEmptyResponse;
export type UpdateLifestyleProfileResponseDto = ApiEmptyResponse;
