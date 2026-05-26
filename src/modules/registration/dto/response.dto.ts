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

type UserInfoContextData = {
  name: string;
  email: string;
  birthYear: number | null;
  estimatedLifeExpectancy: number | null;
  preferredCurrencyId: number | null;
};

export type CreateUserInfoResponseDto = ApiResponse<UserInfoDataDto>;

export type GetUserInfoResponseDto = ApiResponse<GetUserInfoData>;

export type GetUserInfoContextResponseDto = ApiResponse<UserInfoContextData>;

type FinancialProfileResponseData = {
  currentSavings: number;
  desiredLifeExpectancy: number;
  estimatedLifeExpectancy: number;
  currencyId: number;
};

type PortfolioAllocationResponseItem = {
  allocationType: 'PRE_FFP' | 'POST_FFP';
  u: number;
  mu: number;
  rf: number;
};

type LifestyleProfileResponseData = {
  smokingTypeId: number;
  physicalActivityTypeId: number;
  dietQualityTypeId: number;
  alcoholConsumptionTypeId: number;
};

type FinancialSectionData = {
  financialProfile: FinancialProfileResponseData;
  portfolioAllocations: PortfolioAllocationResponseItem[];
  lifestyleProfile: LifestyleProfileResponseData;
};

export type CreateFinancialInfoResponseDto = ApiResponse<{
  financial: FinancialSectionData;
}>;

export type GetFinancialInfoResponseDto = ApiResponse<{
  financial: FinancialSectionData;
}>;

export type UpdateFinancialInfoResponseDto = ApiResponse<{
  financial: FinancialSectionData;
}>;

type StageDataResponseItem = {
  lifeStageRangeId: number;
  initialAnnualSavings: number;
  growthRate: number;
};

export type GetStageDataResponseDto = ApiResponse<StageDataResponseItem[]>;

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
    smokingTypeId: number;
    physicalActivityTypeId: number;
    dietQualityTypeId: number;
    alcoholConsumptionTypeId: number;
  };
  estimatedLifeExpectancy: number;
};

export type UpdateLifestyleProfileResponseDto =
  ApiResponse<LifestyleProfileData>;

export type CreateLifestyleProfileResponseDto =
  ApiResponse<LifestyleProfileData>;
