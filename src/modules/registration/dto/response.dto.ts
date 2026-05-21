import type { ApiEmptyResponse, ApiResponse } from '@/types/api-response.js';
import type { UserInfoDto } from './create-main-registration.dto.js';

type UserInfoDataDto = {
  userInfo: UserInfoDto;
};

type AssetDataResponseItem = {
  uid: string;
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
export type CreatePortfolioAllocationsResponseDto = ApiEmptyResponse;
export type UpdatePortfolioAllocationsResponseDto = ApiEmptyResponse;
export type CreateStageDataResponseDto = ApiEmptyResponse;
export type UpdateStageDataResponseDto = ApiEmptyResponse;
export type UpdateAssetDataResponseDto = ApiEmptyResponse;
export type DeleteAssetResponseDto = ApiEmptyResponse;

type CreatedAssetItem = {
  uid: string;
  initialAnnualIncome: number;
  growthRate: number;
};

export type CreateAssetsResponseDto = ApiResponse<CreatedAssetItem[]>;

export type ListAssetsResponseDto = ApiResponse<AssetDataResponseItem[]>;
type LifestyleProfileData = {
  lifestyleProfile: {
    smokingCode: string;
    physicalActivityCode: string;
    dietQualityCode: string;
    alcoholConsumptionCode: string;
  };
  estimatedLifeExpectancy: number;
};

export type UpdateLifestyleProfileResponseDto =
  ApiResponse<LifestyleProfileData>;

export type CreateLifestyleProfileResponseDto =
  ApiResponse<LifestyleProfileData>;
