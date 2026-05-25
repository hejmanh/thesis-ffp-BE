import { withTransaction } from '@/database/transaction.js';
import { badRequest, notFound } from '@/utils/error.js';
import type { CreateUserInfoDto } from './dto/create-main-registration.dto.js';
import type {
  CreateFinancialInfoDto,
  UpdateFinancialSectionDto,
} from './dto/financial-info.dto.js';
import type {
  CreateStageDataDto,
  UpdateFinancialProfileBasicDto,
  UpdatePortfolioAllocationsDto,
  UpdateStageDataDto,
  UpdateAssetDataDto,
  UpdateLifestyleProfileDto,
  CreateAssetDataDto,
} from './dto/update-financial-profile.dto.js';
import {
  getFinancialProfileDetails,
  getHabitsProfileDetails,
  findAlcoholConsumptionAdjustmentById,
  findCurrencyIdById,
  findDietQualityAdjustmentById,
  findExistingAssetTypeIds,
  findExistingAssetUidsForProfile,
  findExistingLifeStageRangeIdsForProfile,
  findLifeExpectancyByCountryAndSex,
  findPhysicalActivityAdjustmentById,
  findProfileContextByUserId,
  findSmokingAdjustmentById,
  insertHabitsProfile,
  insertLifeStageProfile,
  insertPostFfpAsset,
  insertPostFfpAssetReturning,
  insertPortfolioProfile,
  listAssetDataDetails,
  listEligibleLifeStageRangeIds,
  listPortfolioAllocationDetails,
  listStageDataDetails,
  updateEstimatedLifeExpectancy,
  updateFinancialProfileBasic,
  updateHabitsProfile,
  updateLifeStageProfile,
  updatePortfolioAllocation,
  updatePostFfpAsset,
  deletePostFfpAsset,
  updateProfileFinancialProfile,
} from './registration.repository.js';
import { calculateCurrentAge } from '@/utils/ffp-model/lifeExpectancy.js';

const validateReferenceId = (value: number, fieldName: string) => {
  if (!Number.isInteger(value) || value <= 0) {
    throw badRequest(`${fieldName} must be a positive integer`);
  }
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

const validateEligibleStageIds = (
  eligibleLifeStageRangeIds: number[],
  requestedLifeStageRangeIds: number[],
) => {
  const eligibleIdSet = new Set(eligibleLifeStageRangeIds);

  for (const id of requestedLifeStageRangeIds) {
    if (!eligibleIdSet.has(id)) {
      throw badRequest(`lifeStageRangeId ${id} is not available for this user`);
    }
  }
};

const validateStageData = (
  eligibleLifeStageRangeIds: number[],
  stageData: CreateUserInfoDto['userInfo']['stageData'],
) => {
  const providedIds = stageData.map((stage) => stage.lifeStageRangeId);
  const providedIdSet = new Set(providedIds);

  if (
    providedIds.length !== eligibleLifeStageRangeIds.length ||
    providedIdSet.size !== providedIds.length
  ) {
    throw badRequest(
      'stageData must match the life stages returned by the server',
    );
  }

  validateEligibleStageIds(eligibleLifeStageRangeIds, [...providedIdSet]);
};

const resolveLifestyleProfile = async (
  profile: { countryId: number | null; sexTypeId: number | null },
  lifestyleProfile: {
    smokingTypeId: number;
    physicalActivityTypeId: number;
    dietQualityTypeId: number;
    alcoholConsumptionTypeId: number;
  },
) => {
  if (profile.countryId == null || profile.sexTypeId == null) {
    throw badRequest('Country and sex must be set on your profile');
  }

  validateReferenceId(lifestyleProfile.smokingTypeId, 'smokingTypeId');
  validateReferenceId(
    lifestyleProfile.physicalActivityTypeId,
    'physicalActivityTypeId',
  );
  validateReferenceId(lifestyleProfile.dietQualityTypeId, 'dietQualityTypeId');
  validateReferenceId(
    lifestyleProfile.alcoholConsumptionTypeId,
    'alcoholConsumptionTypeId',
  );

  const [
    smokingAdjustment,
    physicalActivityAdjustment,
    dietQualityAdjustment,
    alcoholConsumptionAdjustment,
    baseLifeExpectancy,
  ] = await Promise.all([
    findSmokingAdjustmentById(lifestyleProfile.smokingTypeId),
    findPhysicalActivityAdjustmentById(lifestyleProfile.physicalActivityTypeId),
    findDietQualityAdjustmentById(lifestyleProfile.dietQualityTypeId),
    findAlcoholConsumptionAdjustmentById(
      lifestyleProfile.alcoholConsumptionTypeId,
    ),
    findLifeExpectancyByCountryAndSex(profile.countryId, profile.sexTypeId),
  ]);

  if (smokingAdjustment == null) {
    throw badRequest('Invalid smokingTypeId');
  }
  if (physicalActivityAdjustment == null) {
    throw badRequest('Invalid physicalActivityTypeId');
  }
  if (dietQualityAdjustment == null) {
    throw badRequest('Invalid dietQualityTypeId');
  }
  if (alcoholConsumptionAdjustment == null) {
    throw badRequest('Invalid alcoholConsumptionTypeId');
  }
  if (baseLifeExpectancy == null) {
    throw badRequest(
      'Life expectancy data is unavailable for your country and sex',
    );
  }

  return {
    smokingTypeId: lifestyleProfile.smokingTypeId,
    physicalActivityTypeId: lifestyleProfile.physicalActivityTypeId,
    dietQualityTypeId: lifestyleProfile.dietQualityTypeId,
    alcoholConsumptionTypeId: lifestyleProfile.alcoholConsumptionTypeId,
    estimatedLifeExpectancy: roundEstimatedLifeExpectancy(baseLifeExpectancy, [
      smokingAdjustment,
      physicalActivityAdjustment,
      dietQualityAdjustment,
      alcoholConsumptionAdjustment,
    ]),
  };
};

const mapFinancialInfoSection = (
  financialProfile: {
    currentSavings: number;
    desiredLifeExpectancy: number;
    estimatedLifeExpectancy: number;
    currencyId: number;
  },
  portfolioAllocations: {
    allocationType: 'PRE_FFP' | 'POST_FFP';
    u: number;
    mu: number;
    rf: number;
  }[],
  lifestyleProfile: {
    smokingTypeId: number;
    physicalActivityTypeId: number;
    dietQualityTypeId: number;
    alcoholConsumptionTypeId: number;
  },
) => ({
  financial: {
    financialProfile,
    portfolioAllocations,
    lifestyleProfile,
  },
});

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

  validateReferenceId(userInfo.financialProfile.currencyId, 'currencyId');
  validateReferenceId(userInfo.lifestyleProfile.smokingTypeId, 'smokingTypeId');
  validateReferenceId(
    userInfo.lifestyleProfile.physicalActivityTypeId,
    'physicalActivityTypeId',
  );
  validateReferenceId(
    userInfo.lifestyleProfile.dietQualityTypeId,
    'dietQualityTypeId',
  );
  validateReferenceId(
    userInfo.lifestyleProfile.alcoholConsumptionTypeId,
    'alcoholConsumptionTypeId',
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
    eligibleLifeStageRangeIds,
    existingAssetTypeIds,
  ] = await Promise.all([
    findCurrencyIdById(userInfo.financialProfile.currencyId),
    findLifeExpectancyByCountryAndSex(profile.countryId, profile.sexTypeId),
    findSmokingAdjustmentById(userInfo.lifestyleProfile.smokingTypeId),
    findPhysicalActivityAdjustmentById(
      userInfo.lifestyleProfile.physicalActivityTypeId,
    ),
    findDietQualityAdjustmentById(userInfo.lifestyleProfile.dietQualityTypeId),
    findAlcoholConsumptionAdjustmentById(
      userInfo.lifestyleProfile.alcoholConsumptionTypeId,
    ),
    listEligibleLifeStageRangeIds(calculateCurrentAge(profile.birthYear)),
    findExistingAssetTypeIds(uniqueAssetTypeIds),
  ]);

  if (preferredCurrencyId == null) {
    throw badRequest('Invalid currencyId');
  }

  if (baseLifeExpectancy == null) {
    throw badRequest(
      'Life expectancy data is unavailable for the selected country and sex',
    );
  }

  if (smokingAdjustment == null) {
    throw badRequest('Invalid smokingTypeId');
  }

  if (physicalActivityAdjustment == null) {
    throw badRequest('Invalid physicalActivityTypeId');
  }

  if (dietQualityAdjustment == null) {
    throw badRequest('Invalid dietQualityTypeId');
  }

  if (alcoholConsumptionAdjustment == null) {
    throw badRequest('Invalid alcoholConsumptionTypeId');
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
      userInfo.lifestyleProfile.smokingTypeId,
      userInfo.lifestyleProfile.physicalActivityTypeId,
      userInfo.lifestyleProfile.dietQualityTypeId,
      userInfo.lifestyleProfile.alcoholConsumptionTypeId,
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
        currencyId: userInfo.financialProfile.currencyId,
      },
      portfolioAllocations: userInfo.portfolioAllocations,
      lifestyleProfile: {
        smokingTypeId: userInfo.lifestyleProfile.smokingTypeId,
        physicalActivityTypeId:
          userInfo.lifestyleProfile.physicalActivityTypeId,
        dietQualityTypeId: userInfo.lifestyleProfile.dietQualityTypeId,
        alcoholConsumptionTypeId:
          userInfo.lifestyleProfile.alcoholConsumptionTypeId,
      },
      stageData: userInfo.stageData,
      assetData: userInfo.assetData,
    },
  };
};

export const createFinancialInfo = async (
  userId: number,
  data: CreateFinancialInfoDto,
) => {
  const financial = data.financial;
  const profile = await findProfileContextByUserId(userId);
  if (!profile) throw notFound('Profile not found');

  if (
    profile.birthYear == null ||
    profile.countryId == null ||
    profile.sexTypeId == null
  ) {
    throw badRequest(
      'Birth year, country, and sex must be set before completing financial info',
    );
  }

  if (
    profile.hasFinancialProfile ||
    profile.hasHabitsProfile ||
    profile.hasPortfolioProfile
  ) {
    throw badRequest('Financial info already exists');
  }

  const [preferredCurrencyId, resolvedLifestyle] = await Promise.all([
    findCurrencyIdById(financial.financialProfile.currencyId),
    resolveLifestyleProfile(profile, financial.lifestyleProfile),
  ]);

  if (preferredCurrencyId == null) {
    throw badRequest('Invalid currencyId');
  }

  await withTransaction(async (client) => {
    await updateProfileFinancialProfile(
      profile.profileId,
      financial.financialProfile.currentSavings,
      financial.financialProfile.desiredLifeExpectancy,
      resolvedLifestyle.estimatedLifeExpectancy,
      preferredCurrencyId,
      client,
    );

    for (const allocation of financial.portfolioAllocations) {
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
      resolvedLifestyle.smokingTypeId,
      resolvedLifestyle.physicalActivityTypeId,
      resolvedLifestyle.dietQualityTypeId,
      resolvedLifestyle.alcoholConsumptionTypeId,
      client,
    );
  });

  return mapFinancialInfoSection(
    {
      currentSavings: financial.financialProfile.currentSavings,
      desiredLifeExpectancy: financial.financialProfile.desiredLifeExpectancy,
      estimatedLifeExpectancy: resolvedLifestyle.estimatedLifeExpectancy,
      currencyId: financial.financialProfile.currencyId,
    },
    financial.portfolioAllocations,
    {
      smokingTypeId: resolvedLifestyle.smokingTypeId,
      physicalActivityTypeId: resolvedLifestyle.physicalActivityTypeId,
      dietQualityTypeId: resolvedLifestyle.dietQualityTypeId,
      alcoholConsumptionTypeId: resolvedLifestyle.alcoholConsumptionTypeId,
    },
  );
};

export const getFinancialInfo = async (userId: number) => {
  const profile = await findProfileContextByUserId(userId);
  if (!profile) throw notFound('Profile not found');

  if (
    !profile.hasFinancialProfile ||
    !profile.hasHabitsProfile ||
    !profile.hasPortfolioProfile
  ) {
    throw notFound('Financial info not found');
  }

  const [financialProfile, portfolioAllocations, lifestyleProfile] =
    await Promise.all([
      getFinancialProfileDetails(profile.profileId),
      listPortfolioAllocationDetails(profile.profileId),
      getHabitsProfileDetails(profile.profileId),
    ]);

  if (
    !financialProfile ||
    !lifestyleProfile ||
    lifestyleProfile.smokingTypeId == null ||
    lifestyleProfile.physicalActivityTypeId == null ||
    lifestyleProfile.dietQualityTypeId == null ||
    lifestyleProfile.alcoholConsumptionTypeId == null ||
    financialProfile.currentSavings === null ||
    financialProfile.desiredLifeExpectancy === null ||
    financialProfile.estimatedLifeExpectancy === null ||
    financialProfile.currencyId == null
  ) {
    throw notFound('Financial info not found');
  }

  return mapFinancialInfoSection(
    {
      currentSavings: financialProfile.currentSavings,
      desiredLifeExpectancy: financialProfile.desiredLifeExpectancy,
      estimatedLifeExpectancy: financialProfile.estimatedLifeExpectancy,
      currencyId: financialProfile.currencyId,
    },
    portfolioAllocations.map((allocation) => {
      if (
        allocation.u === null ||
        allocation.mu === null ||
        allocation.rf === null
      ) {
        throw notFound('Financial info not found');
      }

      return {
        allocationType: allocation.allocationType,
        u: allocation.u,
        mu: allocation.mu,
        rf: allocation.rf,
      };
    }),
    {
      smokingTypeId: lifestyleProfile.smokingTypeId,
      physicalActivityTypeId: lifestyleProfile.physicalActivityTypeId,
      dietQualityTypeId: lifestyleProfile.dietQualityTypeId,
      alcoholConsumptionTypeId: lifestyleProfile.alcoholConsumptionTypeId,
    },
  );
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
  ] = await Promise.all([
    getFinancialProfileDetails(profile.profileId),
    listPortfolioAllocationDetails(profile.profileId),
    listStageDataDetails(profile.profileId),
    listAssetDataDetails(profile.profileId),
    getHabitsProfileDetails(profile.profileId),
  ]);

  if (
    !financialProfile ||
    !lifestyleProfile ||
    lifestyleProfile.smokingTypeId == null ||
    lifestyleProfile.alcoholConsumptionTypeId == null ||
    lifestyleProfile.dietQualityTypeId == null ||
    lifestyleProfile.physicalActivityTypeId == null
  ) {
    throw notFound('User info not found');
  }

  if (
    financialProfile.currentSavings === null ||
    financialProfile.desiredLifeExpectancy === null ||
    financialProfile.estimatedLifeExpectancy === null ||
    financialProfile.currencyId == null
  ) {
    throw notFound('User info not found');
  }

  return {
    userInfo: {
      financialProfile: {
        currentSavings: financialProfile.currentSavings,
        desiredLifeExpectancy: financialProfile.desiredLifeExpectancy,
        estimatedLifeExpectancy: financialProfile.estimatedLifeExpectancy,
        currencyId: financialProfile.currencyId,
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
        if (asset.initialAnnualIncome === null || asset.growthRate === null) {
          throw notFound('User info not found');
        }

        return {
          uid: asset.uid,
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

  const resolvedLifestyle = await resolveLifestyleProfile(profile, data);

  await withTransaction(async (client) => {
    await updateHabitsProfile(
      profile.profileId,
      resolvedLifestyle.smokingTypeId,
      resolvedLifestyle.physicalActivityTypeId,
      resolvedLifestyle.dietQualityTypeId,
      resolvedLifestyle.alcoholConsumptionTypeId,
      client,
    );
    await updateEstimatedLifeExpectancy(
      profile.profileId,
      resolvedLifestyle.estimatedLifeExpectancy,
      client,
    );
  });

  return {
    lifestyleProfile: {
      smokingTypeId: resolvedLifestyle.smokingTypeId,
      physicalActivityTypeId: resolvedLifestyle.physicalActivityTypeId,
      dietQualityTypeId: resolvedLifestyle.dietQualityTypeId,
      alcoholConsumptionTypeId: resolvedLifestyle.alcoholConsumptionTypeId,
    },
    estimatedLifeExpectancy: resolvedLifestyle.estimatedLifeExpectancy,
  };
};

export const createPortfolioAllocationsService = async (
  userId: number,
  data: UpdatePortfolioAllocationsDto,
) => {
  const profile = await findProfileContextByUserId(userId);
  if (!profile) throw notFound('Profile not found');

  if (profile.hasPortfolioProfile) {
    throw badRequest('Portfolio allocations already exist');
  }

  await withTransaction(async (client) => {
    for (const allocation of data) {
      await insertPortfolioProfile(
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

export const createStageDataService = async (
  userId: number,
  data: CreateStageDataDto,
) => {
  const profile = await findProfileContextByUserId(userId);
  if (!profile) throw notFound('Profile not found');

  if (profile.birthYear == null) {
    throw badRequest('Birth year must be set on your profile');
  }

  const [eligibleLifeStageRangeIds, existingLifeStageRangeIds] =
    await Promise.all([
      listEligibleLifeStageRangeIds(calculateCurrentAge(profile.birthYear)),
      findExistingLifeStageRangeIdsForProfile(profile.profileId),
    ]);

  if (eligibleLifeStageRangeIds.length === 0) {
    throw badRequest('No life stages are available for this user');
  }

  const requestedLifeStageRangeIds = data.map(
    (stage) => stage.lifeStageRangeId,
  );
  validateEligibleStageIds(
    eligibleLifeStageRangeIds,
    requestedLifeStageRangeIds,
  );

  const existingIdSet = new Set(existingLifeStageRangeIds);
  for (const id of requestedLifeStageRangeIds) {
    if (existingIdSet.has(id)) {
      throw badRequest(`lifeStageRangeId ${id} already exists in this profile`);
    }
  }

  await withTransaction(async (client) => {
    for (const stage of data) {
      await insertLifeStageProfile(
        profile.profileId,
        stage.lifeStageRangeId,
        stage.initialAnnualSavings,
        stage.growthRate,
        client,
      );
    }
  });
};

export const createLifestyleProfileService = async (
  userId: number,
  data: UpdateLifestyleProfileDto,
) => {
  const profile = await findProfileContextByUserId(userId);
  if (!profile) throw notFound('Profile not found');

  if (profile.hasHabitsProfile) {
    throw badRequest('Lifestyle profile already exists');
  }

  const resolvedLifestyle = await resolveLifestyleProfile(profile, data);

  await withTransaction(async (client) => {
    await insertHabitsProfile(
      profile.profileId,
      resolvedLifestyle.smokingTypeId,
      resolvedLifestyle.physicalActivityTypeId,
      resolvedLifestyle.dietQualityTypeId,
      resolvedLifestyle.alcoholConsumptionTypeId,
      client,
    );
    await updateEstimatedLifeExpectancy(
      profile.profileId,
      resolvedLifestyle.estimatedLifeExpectancy,
      client,
    );
  });

  return {
    lifestyleProfile: {
      smokingTypeId: resolvedLifestyle.smokingTypeId,
      physicalActivityTypeId: resolvedLifestyle.physicalActivityTypeId,
      dietQualityTypeId: resolvedLifestyle.dietQualityTypeId,
      alcoholConsumptionTypeId: resolvedLifestyle.alcoholConsumptionTypeId,
    },
    estimatedLifeExpectancy: resolvedLifestyle.estimatedLifeExpectancy,
  };
};

export const updateFinancialInfo = async (
  userId: number,
  data: UpdateFinancialSectionDto,
) => {
  const profile = await findProfileContextByUserId(userId);
  if (!profile) throw notFound('Profile not found');

  if (
    !profile.hasFinancialProfile ||
    !profile.hasHabitsProfile ||
    !profile.hasPortfolioProfile
  ) {
    throw badRequest('Financial info does not exist yet');
  }

  let preferredCurrencyId: number | undefined;
  if (data.financialProfile?.currencyId !== undefined) {
    const found = await findCurrencyIdById(data.financialProfile.currencyId);
    if (found == null) throw badRequest('Invalid currencyId');
    preferredCurrencyId = found;
  }

  const resolvedLifestyle =
    data.lifestyleProfile !== undefined
      ? await resolveLifestyleProfile(profile, data.lifestyleProfile)
      : undefined;

  await withTransaction(async (client) => {
    if (data.financialProfile !== undefined) {
      await updateFinancialProfileBasic(
        profile.profileId,
        {
          ...(data.financialProfile.currentSavings !== undefined && {
            currentSavings: data.financialProfile.currentSavings,
          }),
          ...(data.financialProfile.desiredLifeExpectancy !== undefined && {
            desiredLifeExpectancy: data.financialProfile.desiredLifeExpectancy,
          }),
          ...(preferredCurrencyId !== undefined && { preferredCurrencyId }),
        },
        client,
      );
    }

    if (data.portfolioAllocations !== undefined) {
      for (const allocation of data.portfolioAllocations) {
        await updatePortfolioAllocation(
          profile.profileId,
          allocation.allocationType,
          allocation.u,
          allocation.mu,
          allocation.rf,
          client,
        );
      }
    }

    if (resolvedLifestyle !== undefined) {
      await updateHabitsProfile(
        profile.profileId,
        resolvedLifestyle.smokingTypeId,
        resolvedLifestyle.physicalActivityTypeId,
        resolvedLifestyle.dietQualityTypeId,
        resolvedLifestyle.alcoholConsumptionTypeId,
        client,
      );
      await updateEstimatedLifeExpectancy(
        profile.profileId,
        resolvedLifestyle.estimatedLifeExpectancy,
        client,
      );
    }
  });

  return getFinancialInfo(userId);
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
  if (data.currencyId !== undefined) {
    const found = await findCurrencyIdById(data.currencyId);
    if (found == null) throw badRequest('Invalid currencyId');
    preferredCurrencyId = found;
  }

  await updateFinancialProfileBasic(profile.profileId, {
    ...(data.currentSavings !== undefined && {
      currentSavings: data.currentSavings,
    }),
    ...(data.desiredLifeExpectancy !== undefined && {
      desiredLifeExpectancy: data.desiredLifeExpectancy,
    }),
    ...(preferredCurrencyId !== undefined && { preferredCurrencyId }),
  });
};

export const getStageDataService = async (userId: number) => {
  const profile = await findProfileContextByUserId(userId);
  if (!profile) throw notFound('Profile not found');

  if (!profile.hasLifeStageProfile) {
    throw notFound('Stage data not found');
  }

  const stageData = await listStageDataDetails(profile.profileId);

  return stageData.map((stage) => {
    if (stage.initialAnnualSavings === null || stage.growthRate === null) {
      throw notFound('Stage data not found');
    }

    return {
      lifeStageRangeId: stage.lifeStageRangeId,
      initialAnnualSavings: stage.initialAnnualSavings,
      growthRate: stage.growthRate,
    };
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

  const existingIds = await findExistingLifeStageRangeIdsForProfile(
    profile.profileId,
  );
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
          ...(stage.initialAnnualSavings !== undefined && {
            initialAnnualSavings: stage.initialAnnualSavings,
          }),
          ...(stage.growthRate !== undefined && {
            growthRate: stage.growthRate,
          }),
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

  const existingUids = await findExistingAssetUidsForProfile(profile.profileId);
  const existingUidSet = new Set(existingUids);

  for (const asset of data) {
    if (!existingUidSet.has(asset.uid)) {
      throw badRequest(
        `Asset with uid ${asset.uid} does not exist in this profile`,
      );
    }
  }

  await withTransaction(async (client) => {
    for (const asset of data) {
      await updatePostFfpAsset(
        profile.profileId,
        asset.uid,
        {
          ...(asset.initialAnnualIncome !== undefined && {
            initialAnnualIncome: asset.initialAnnualIncome,
          }),
          ...(asset.growthRate !== undefined && {
            growthRate: asset.growthRate,
          }),
        },
        client,
      );
    }
  });
};

export const deleteAssetService = async (userId: number, uid: string) => {
  const profile = await findProfileContextByUserId(userId);
  if (!profile) throw notFound('Profile not found');

  const existingUids = await findExistingAssetUidsForProfile(profile.profileId);
  if (!existingUids.includes(uid)) {
    throw notFound(`Asset with uid ${uid} not found in this profile`);
  }

  await deletePostFfpAsset(profile.profileId, uid);
};

export const createAssetsService = async (
  userId: number,
  data: CreateAssetDataDto,
) => {
  const profile = await findProfileContextByUserId(userId);
  if (!profile) throw notFound('Profile not found');

  if (!profile.hasFinancialProfile) {
    throw badRequest('User info must be created before adding assets');
  }

  const requestedAssetTypeIds = data.assetData.map((a) => a.assetTypeId);
  const existingAssetTypeIds = await findExistingAssetTypeIds(
    requestedAssetTypeIds,
  );
  if (existingAssetTypeIds.length !== requestedAssetTypeIds.length) {
    throw badRequest('One or more assetTypeId values are invalid');
  }

  const inserted: {
    uid: string;
    initialAnnualIncome: number;
    growthRate: number;
  }[] = [];

  await withTransaction(async (client) => {
    for (const asset of data.assetData) {
      const row = await insertPostFfpAssetReturning(
        profile.profileId,
        asset.assetTypeId,
        asset.initialAnnualIncome,
        asset.growthRate,
        client,
      );
      inserted.push(row);
    }
  });

  return inserted;
};

export const listAssetsService = async (userId: number) => {
  const profile = await findProfileContextByUserId(userId);
  if (!profile) throw notFound('Profile not found');

  const assets = await listAssetDataDetails(profile.profileId);
  return assets.map((asset) => ({
    uid: asset.uid,
    assetId: asset.assetId,
    assetTypeCode: asset.assetTypeCode,
    assetTypeTitle: asset.assetTypeTitle,
    initialAnnualIncome: asset.initialAnnualIncome ?? 0,
    growthRate: asset.growthRate ?? 0,
  }));
};
