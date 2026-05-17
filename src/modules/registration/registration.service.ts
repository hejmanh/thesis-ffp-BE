import { withTransaction } from '@/database/transaction.js';
import { badRequest, notFound } from '@/utils/error.js';
import type { CreateUserInfoDto } from './dto/create-main-registration.dto.js';
import type {
  UpdateFinancialProfileBasicDto,
  UpdatePortfolioAllocationsDto,
  UpdateStageDataDto,
  UpdateAssetDataDto,
  UpdateLifestyleProfileDto,
} from './dto/update-financial-profile.dto.js';
import {
  getFinancialProfileDetails,
  getHabitsProfileDetails,
  findAlcoholConsumptionAdjustmentByCode,
  findAlcoholConsumptionTypeIdByCode,
  findCurrencyIdByCode,
  findDietQualityAdjustmentByCode,
  findDietQualityTypeIdByCode,
  findExistingAssetTypeIds,
  findExistingAssetIdsForProfile,
  findExistingLifeStageRangeIdsForProfile,
  findLifeExpectancyByCountryAndSex,
  findPhysicalActivityAdjustmentByCode,
  findPhysicalActivityTypeIdByCode,
  findProfileContextByUserId,
  findSmokingAdjustmentByCode,
  findSmokingTypeIdByCode,
  insertHabitsProfile,
  insertLifeStageProfile,
  insertPostFfpAsset,
  insertPortfolioProfile,
  listAssetDataDetails,
  listEligibleLifeStageRangeIds,
  listPortfolioAllocationDetails,
  listStageDataDetails,
  updateFinancialProfileBasic,
  updateHabitsProfile,
  updateLifeStageProfile,
  updatePortfolioAllocation,
  updatePostFfpAsset,
  deletePostFfpAsset,
  updateProfileFinancialProfile,
} from './registration.repository.js';

const normalizeReferenceCode = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

const smokingCodeAliases = new Map<string, string>([
  ['non_smoker', 'non_smoker'],
  ['former_smoker', 'former_smoker'],
  ['light_smoker', 'light_smoker'],
  ['heavy_smoker', 'heavy_smoker'],
]);

const physicalActivityCodeAliases = new Map<string, string>([
  ['active', 'active'],
  ['moderate', 'moderate'],
  ['sedentary', 'sedentary']
]);

const dietQualityCodeAliases = new Map<string, string>([
  ['healthy', 'healthy'],
  ['average', 'average'],
  ['poor', 'poor']
]);

const alcoholConsumptionCodeAliases = new Map<string, string>([
  ['none', 'none'],
  ['moderate', 'moderate'],
  ['heavy', 'heavy']
]);

const resolveReferenceCode = (
  value: string,
  aliases: Map<string, string>,
  fieldName: string,
) => {
  const normalizedCode = normalizeReferenceCode(value);
  const resolvedCode = aliases.get(normalizedCode);

  if (!resolvedCode) {
    throw badRequest(`Invalid ${fieldName}`);
  }

  return resolvedCode;
};

const roundEstimatedLifeExpectancy = (
  baseLifeExpectancy: number,
  adjustments: number[],
) =>
  Math.max(
    0,
    Math.round(
      baseLifeExpectancy + adjustments.reduce((sum, value) => sum + value, 0),
    ),
  );

const getCurrentAge = (birthYear: number) => new Date().getFullYear() - birthYear;

const validateStageData = (
  eligibleLifeStageRangeIds: number[],
  stageData: CreateUserInfoDto['userInfo']['stageData'],
) => {
  const providedIds = stageData.map((stage) => stage.lifeStageRangeId);
  const providedIdSet = new Set(providedIds);
  const eligibleIdSet = new Set(eligibleLifeStageRangeIds);

  if (
    providedIds.length !== eligibleLifeStageRangeIds.length ||
    providedIdSet.size !== providedIds.length
  ) {
    throw badRequest('stageData must match the life stages returned by the server');
  }

  for (const id of providedIdSet) {
    if (!eligibleIdSet.has(id)) {
      throw badRequest(
        'stageData contains a lifeStageRangeId not available for this user',
      );
    }
  }
};

export const createUserInfo = async (
  userId: number,
  data: CreateUserInfoDto,
) => {
  const userInfo = data.userInfo;
  const profile = await findProfileContextByUserId(userId);
  if (!profile) throw notFound('Profile not found');

  if (
    profile.birthYear == null ||
    profile.countryId == null ||
    profile.sexTypeId == null
  ) {
    throw badRequest(
      'Birth year, country, and sex must be set before completing user info',
    );
  }

  if (
    profile.hasFinancialProfile ||
    profile.hasHabitsProfile ||
    profile.hasPortfolioProfile ||
    profile.hasLifeStageProfile ||
    profile.hasPostFfpAsset
  ) {
    throw badRequest('User info already exists');
  }

  const smokingCode = resolveReferenceCode(
    userInfo.lifestyleProfile.smokingCode,
    smokingCodeAliases,
    'smokingCode',
  );
  const physicalActivityCode = resolveReferenceCode(
    userInfo.lifestyleProfile.physicalActivityCode,
    physicalActivityCodeAliases,
    'physicalActivityCode',
  );
  const dietQualityCode = resolveReferenceCode(
    userInfo.lifestyleProfile.dietQualityCode,
    dietQualityCodeAliases,
    'dietQualityCode',
  );
  const alcoholConsumptionCode = resolveReferenceCode(
    userInfo.lifestyleProfile.alcoholConsumptionCode,
    alcoholConsumptionCodeAliases,
    'alcoholConsumptionCode',
  );
  const uniqueAssetTypeIds = Array.from(
    new Set(userInfo.assetData.map((asset) => asset.assetTypeId)),
  );

  const [
    preferredCurrencyId,
    baseLifeExpectancy,
    smokingAdjustment,
    physicalActivityAdjustment,
    dietQualityAdjustment,
    alcoholConsumptionAdjustment,
    smokingTypeId,
    physicalActivityTypeId,
    dietQualityTypeId,
    alcoholConsumptionTypeId,
    eligibleLifeStageRangeIds,
    existingAssetTypeIds,
  ] = await Promise.all([
    findCurrencyIdByCode(userInfo.financialProfile.currencyCode),
    findLifeExpectancyByCountryAndSex(profile.countryId, profile.sexTypeId),
    findSmokingAdjustmentByCode(smokingCode),
    findPhysicalActivityAdjustmentByCode(physicalActivityCode),
    findDietQualityAdjustmentByCode(dietQualityCode),
    findAlcoholConsumptionAdjustmentByCode(alcoholConsumptionCode),
    findSmokingTypeIdByCode(smokingCode),
    findPhysicalActivityTypeIdByCode(physicalActivityCode),
    findDietQualityTypeIdByCode(dietQualityCode),
    findAlcoholConsumptionTypeIdByCode(alcoholConsumptionCode),
    listEligibleLifeStageRangeIds(getCurrentAge(profile.birthYear)),
    findExistingAssetTypeIds(uniqueAssetTypeIds),
  ]);

  if (preferredCurrencyId == null) {
    throw badRequest('Invalid currencyCode');
  }

  if (baseLifeExpectancy == null) {
    throw badRequest(
      'Life expectancy data is unavailable for the selected country and sex',
    );
  }

  if (smokingAdjustment == null || smokingTypeId == null) {
    throw badRequest('Invalid smokingCode');
  }

  if (physicalActivityAdjustment == null || physicalActivityTypeId == null) {
    throw badRequest('Invalid physicalActivityCode');
  }

  if (dietQualityAdjustment == null || dietQualityTypeId == null) {
    throw badRequest('Invalid dietQualityCode');
  }

  if (
    alcoholConsumptionAdjustment == null ||
    alcoholConsumptionTypeId == null
  ) {
    throw badRequest('Invalid alcoholConsumptionCode');
  }

  if (eligibleLifeStageRangeIds.length === 0) {
    throw badRequest('No life stages are available for this user');
  }

  validateStageData(eligibleLifeStageRangeIds, userInfo.stageData);

  if (existingAssetTypeIds.length !== uniqueAssetTypeIds.length) {
    throw badRequest('Invalid assetTypeId');
  }

  const estimatedLifeExpectancy = roundEstimatedLifeExpectancy(
    baseLifeExpectancy,
    [
      smokingAdjustment,
      physicalActivityAdjustment,
      dietQualityAdjustment,
      alcoholConsumptionAdjustment,
    ],
  );

  await withTransaction(async (client) => {
    await updateProfileFinancialProfile(
      profile.profileId,
      userInfo.financialProfile.currentSavings,
      userInfo.financialProfile.desiredLifeExpectancy,
      estimatedLifeExpectancy,
      preferredCurrencyId,
      client,
    );

    for (const allocation of userInfo.portfolioAllocations) {
      await insertPortfolioProfile(
        profile.profileId,
        allocation.allocationType,
        allocation.u,
        allocation.mu,
        allocation.rf,
        client,
      );
    }

    await insertHabitsProfile(
      profile.profileId,
      smokingTypeId,
      physicalActivityTypeId,
      dietQualityTypeId,
      alcoholConsumptionTypeId,
      client,
    );

    for (const stage of userInfo.stageData) {
      await insertLifeStageProfile(
        profile.profileId,
        stage.lifeStageRangeId,
        stage.initialAnnualSavings,
        stage.growthRate,
        client,
      );
    }

    for (const asset of userInfo.assetData) {
      await insertPostFfpAsset(
        profile.profileId,
        asset.assetTypeId,
        asset.initialAnnualIncome,
        asset.growthRate,
        client,
      );
    }
  });

  return {
    userInfo: {
      financialProfile: {
        currentSavings: userInfo.financialProfile.currentSavings,
        desiredLifeExpectancy: userInfo.financialProfile.desiredLifeExpectancy,
        estimatedLifeExpectancy,
        currencyCode: userInfo.financialProfile.currencyCode,
      },
      portfolioAllocations: userInfo.portfolioAllocations,
      lifestyleProfile: {
        smokingCode,
        physicalActivityCode,
        dietQualityCode,
        alcoholConsumptionCode,
      },
      stageData: userInfo.stageData,
      assetData: userInfo.assetData,
    },
  };
};

export const getUserInfo = async (userId: number) => {
  const profile = await findProfileContextByUserId(userId);
  if (!profile) throw notFound('Profile not found');

  if (
    !profile.hasFinancialProfile ||
    !profile.hasHabitsProfile ||
    !profile.hasPortfolioProfile ||
    !profile.hasLifeStageProfile
  ) {
    throw notFound('User info not found');
  }

  const [
    financialProfile,
    portfolioAllocations,
    stageData,
    assetData,
    lifestyleProfile,
  ] =
    await Promise.all([
      getFinancialProfileDetails(profile.profileId),
      listPortfolioAllocationDetails(profile.profileId),
      listStageDataDetails(profile.profileId),
      listAssetDataDetails(profile.profileId),
      getHabitsProfileDetails(profile.profileId),
    ]);

  if (!financialProfile || !lifestyleProfile) {
    throw notFound('User info not found');
  }

  if (
    financialProfile.currentSavings === null ||
    financialProfile.desiredLifeExpectancy === null ||
    financialProfile.estimatedLifeExpectancy === null ||
    !financialProfile.currencyCode
  ) {
    throw notFound('User info not found');
  }

  return {
    userInfo: {
      financialProfile: {
        currentSavings: financialProfile.currentSavings,
        desiredLifeExpectancy: financialProfile.desiredLifeExpectancy,
        estimatedLifeExpectancy: financialProfile.estimatedLifeExpectancy,
        currencyCode: financialProfile.currencyCode,
      },
      portfolioAllocations: portfolioAllocations.map((allocation) => {
        if (
          allocation.u === null ||
          allocation.mu === null ||
          allocation.rf === null
        ) {
          throw notFound('User info not found');
        }

        return {
          allocationType: allocation.allocationType,
          u: allocation.u,
          mu: allocation.mu,
          rf: allocation.rf,
        };
      }),
      lifestyleProfile,
      stageData: stageData.map((stage) => {
        if (stage.initialAnnualSavings === null || stage.growthRate === null) {
          throw notFound('User info not found');
        }

        return {
          lifeStageRangeId: stage.lifeStageRangeId,
          initialAnnualSavings: stage.initialAnnualSavings,
          growthRate: stage.growthRate,
        };
      }),
      assetData: assetData.map((asset) => {
        if (
          asset.initialAnnualIncome === null ||
          asset.growthRate === null
        ) {
          throw notFound('User info not found');
        }

        return {
          assetId: asset.assetId,
          assetTypeCode: asset.assetTypeCode,
          assetTypeTitle: asset.assetTypeTitle,
          initialAnnualIncome: asset.initialAnnualIncome,
          growthRate: asset.growthRate,
        };
      }),
    },
  };
};

export const updateLifestyleProfileService = async (
  userId: number,
  data: UpdateLifestyleProfileDto,
) => {
  const profile = await findProfileContextByUserId(userId);
  if (!profile) throw notFound('Profile not found');

  if (!profile.hasHabitsProfile) {
    throw badRequest('Lifestyle profile does not exist yet');
  }

  const smokingCode = resolveReferenceCode(
    data.smokingCode,
    smokingCodeAliases,
    'smokingCode',
  );
  const physicalActivityCode = resolveReferenceCode(
    data.physicalActivityCode,
    physicalActivityCodeAliases,
    'physicalActivityCode',
  );
  const dietQualityCode = resolveReferenceCode(
    data.dietQualityCode,
    dietQualityCodeAliases,
    'dietQualityCode',
  );
  const alcoholConsumptionCode = resolveReferenceCode(
    data.alcoholConsumptionCode,
    alcoholConsumptionCodeAliases,
    'alcoholConsumptionCode',
  );

  const [smokingTypeId, physicalActivityTypeId, dietQualityTypeId, alcoholConsumptionTypeId] =
    await Promise.all([
      findSmokingTypeIdByCode(smokingCode),
      findPhysicalActivityTypeIdByCode(physicalActivityCode),
      findDietQualityTypeIdByCode(dietQualityCode),
      findAlcoholConsumptionTypeIdByCode(alcoholConsumptionCode),
    ]);

  if (smokingTypeId == null) throw badRequest('Invalid smokingCode');
  if (physicalActivityTypeId == null) throw badRequest('Invalid physicalActivityCode');
  if (dietQualityTypeId == null) throw badRequest('Invalid dietQualityCode');
  if (alcoholConsumptionTypeId == null) throw badRequest('Invalid alcoholConsumptionCode');

  await updateHabitsProfile(
    profile.profileId,
    smokingTypeId,
    physicalActivityTypeId,
    dietQualityTypeId,
    alcoholConsumptionTypeId,
  );
};

export const updateFinancialProfileBasicService = async (
  userId: number,
  data: UpdateFinancialProfileBasicDto,
) => {
  const profile = await findProfileContextByUserId(userId);
  if (!profile) throw notFound('Profile not found');

  if (!profile.hasFinancialProfile) {
    throw badRequest('Financial profile does not exist yet');
  }

  let preferredCurrencyId: number | undefined;
  if (data.currencyCode !== undefined) {
    const found = await findCurrencyIdByCode(data.currencyCode);
    if (found == null) throw badRequest('Invalid currencyCode');
    preferredCurrencyId = found;
  }

  await updateFinancialProfileBasic(profile.profileId, {
    ...(data.currentSavings !== undefined && { currentSavings: data.currentSavings }),
    ...(data.desiredLifeExpectancy !== undefined && { desiredLifeExpectancy: data.desiredLifeExpectancy }),
    ...(preferredCurrencyId !== undefined && { preferredCurrencyId }),
  });
};

export const updatePortfolioAllocationsService = async (
  userId: number,
  data: UpdatePortfolioAllocationsDto,
) => {
  const profile = await findProfileContextByUserId(userId);
  if (!profile) throw notFound('Profile not found');

  if (!profile.hasPortfolioProfile) {
    throw badRequest('Portfolio allocations do not exist yet');
  }

  await withTransaction(async (client) => {
    for (const allocation of data) {
      await updatePortfolioAllocation(
        profile.profileId,
        allocation.allocationType,
        allocation.u,
        allocation.mu,
        allocation.rf,
        client,
      );
    }
  });
};

export const updateStageDataService = async (
  userId: number,
  data: UpdateStageDataDto,
) => {
  const profile = await findProfileContextByUserId(userId);
  if (!profile) throw notFound('Profile not found');

  if (!profile.hasLifeStageProfile) {
    throw badRequest('Stage data does not exist yet');
  }

  const existingIds = await findExistingLifeStageRangeIdsForProfile(profile.profileId);
  const existingIdSet = new Set(existingIds);

  for (const stage of data) {
    if (!existingIdSet.has(stage.lifeStageRangeId)) {
      throw badRequest(
        `lifeStageRangeId ${stage.lifeStageRangeId} does not exist in this profile`,
      );
    }
  }

  await withTransaction(async (client) => {
    for (const stage of data) {
      await updateLifeStageProfile(
        profile.profileId,
        stage.lifeStageRangeId,
        {
          ...(stage.initialAnnualSavings !== undefined && { initialAnnualSavings: stage.initialAnnualSavings }),
          ...(stage.growthRate !== undefined && { growthRate: stage.growthRate }),
        },
        client,
      );
    }
  });
};

export const updateAssetDataService = async (
  userId: number,
  data: UpdateAssetDataDto,
) => {
  const profile = await findProfileContextByUserId(userId);
  if (!profile) throw notFound('Profile not found');

  const existingIds = await findExistingAssetIdsForProfile(profile.profileId);
  const existingIdSet = new Set(existingIds);

  for (const asset of data) {
    if (!existingIdSet.has(asset.assetId)) {
      throw badRequest(
        `assetId ${asset.assetId} does not exist in this profile`,
      );
    }
  }

  await withTransaction(async (client) => {
    for (const asset of data) {
      await updatePostFfpAsset(
        profile.profileId,
        asset.assetId,
        {
          ...(asset.initialAnnualIncome !== undefined && { initialAnnualIncome: asset.initialAnnualIncome }),
          ...(asset.growthRate !== undefined && { growthRate: asset.growthRate }),
        },
        client,
      );
    }
  });
};

export const deleteAssetService = async (
  userId: number,
  assetId: number,
) => {
  const profile = await findProfileContextByUserId(userId);
  if (!profile) throw notFound('Profile not found');

  const existingIds = await findExistingAssetIdsForProfile(profile.profileId);
  if (!existingIds.includes(assetId)) {
    throw notFound(`Asset with id ${assetId} not found in this profile`);
  }

  await deletePostFfpAsset(profile.profileId, assetId);
};
