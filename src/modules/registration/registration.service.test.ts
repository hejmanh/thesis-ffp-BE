import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as registrationRepository from './registration.repository.js';
import * as registrationService from './registration.service.js';
import { withTransaction } from '@/database/transaction.js';

vi.mock('@/database/transaction.js', () => ({
  withTransaction: vi.fn(),
}));

vi.mock('./registration.repository.js', () => ({
  findProfileContextByUserId: vi.fn(),
  getFinancialProfileDetails: vi.fn(),
  getHabitsProfileDetails: vi.fn(),

  findCurrencyIdByCode: vi.fn(),
  findLifeExpectancyByCountryAndSex: vi.fn(),
  findSmokingAdjustmentByCode: vi.fn(),
  findPhysicalActivityAdjustmentByCode: vi.fn(),
  findDietQualityAdjustmentByCode: vi.fn(),
  findAlcoholConsumptionAdjustmentByCode: vi.fn(),
  findSmokingTypeIdByCode: vi.fn(),
  findPhysicalActivityTypeIdByCode: vi.fn(),
  findDietQualityTypeIdByCode: vi.fn(),
  findAlcoholConsumptionTypeIdByCode: vi.fn(),
  listEligibleLifeStageRangeIds: vi.fn(),
  findExistingAssetTypeIds: vi.fn(),
  listPortfolioAllocationDetails: vi.fn(),
  listStageDataDetails: vi.fn(),
  listAssetDataDetails: vi.fn(),
  updateProfileFinancialProfile: vi.fn(),
  insertPortfolioProfile: vi.fn(),
  insertHabitsProfile: vi.fn(),
  insertLifeStageProfile: vi.fn(),
  insertPostFfpAsset: vi.fn(),
  insertPostFfpAssetReturning: vi.fn(),
  findExistingAssetUidsForProfile: vi.fn(),
  findExistingLifeStageRangeIdsForProfile: vi.fn(),
  updateFinancialProfileBasic: vi.fn(),
  updatePortfolioAllocation: vi.fn(),
  updateLifeStageProfile: vi.fn(),
  updatePostFfpAsset: vi.fn(),
  deletePostFfpAsset: vi.fn(),
  updateHabitsProfile: vi.fn(),
  updateEstimatedLifeExpectancy: vi.fn(),
}));

const asMock = <T>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>;

const financialSectionPayload = {
  financial: {
    financialProfile: {
      desiredLifeExpectancy: 90,
      currentSavings: 50000,
      currencyCode: 'USD',
    },
    portfolioAllocations: [
      {
        allocationType: 'PRE_FFP' as const,
        u: 0.7,
        mu: 0.12,
        rf: 0.03,
      },
      {
        allocationType: 'POST_FFP' as const,
        u: 0.4,
        mu: 0.08,
        rf: 0.03,
      },
    ],
    lifestyleProfile: {
      smokingCode: 'NON_SMOKER',
      physicalActivityCode: 'HIGH',
      dietQualityCode: 'MEDIUM',
      alcoholConsumptionCode: 'LOW',
    },
  },
};

const financialSectionResponse = {
  financial: {
    financialProfile: {
      currentSavings: 50000,
      desiredLifeExpectancy: 90,
      estimatedLifeExpectancy: 83,
      currencyCode: 'USD',
    },
    portfolioAllocations: [
      {
        allocationType: 'PRE_FFP' as const,
        u: 0.7,
        mu: 0.12,
        rf: 0.03,
      },
      {
        allocationType: 'POST_FFP' as const,
        u: 0.4,
        mu: 0.08,
        rf: 0.03,
      },
    ],
    lifestyleProfile: {
      smokingCode: 'non_smoker',
      physicalActivityCode: 'active',
      dietQualityCode: 'average',
      alcoholConsumptionCode: 'moderate',
    },
  },
};

describe('Registration Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asMock(withTransaction).mockImplementation(async (callback) =>
      callback({} as never),
    );
  });

  it('creates user info and computes estimated life expectancy', async () => {
    asMock(registrationRepository.findProfileContextByUserId).mockResolvedValue(
      {
        profileId: 11,
        profileUid: 'profile-uuid',
        birthYear: 2000,
        countryId: 22,
        sexTypeId: 33,
        hasFinancialProfile: false,
        hasHabitsProfile: false,
        hasPortfolioProfile: false,
        hasLifeStageProfile: false,
        hasPostFfpAsset: false,
      },
    );
    asMock(registrationRepository.findCurrencyIdByCode).mockResolvedValue(44);
    asMock(
      registrationRepository.findLifeExpectancyByCountryAndSex,
    ).mockResolvedValue(80.4);
    asMock(
      registrationRepository.findSmokingAdjustmentByCode,
    ).mockResolvedValue(0);
    asMock(
      registrationRepository.findPhysicalActivityAdjustmentByCode,
    ).mockResolvedValue(2.5);
    asMock(
      registrationRepository.findDietQualityAdjustmentByCode,
    ).mockResolvedValue(0);
    asMock(
      registrationRepository.findAlcoholConsumptionAdjustmentByCode,
    ).mockResolvedValue(0);
    asMock(registrationRepository.findSmokingTypeIdByCode).mockResolvedValue(1);
    asMock(
      registrationRepository.findPhysicalActivityTypeIdByCode,
    ).mockResolvedValue(2);
    asMock(
      registrationRepository.findDietQualityTypeIdByCode,
    ).mockResolvedValue(3);
    asMock(
      registrationRepository.findAlcoholConsumptionTypeIdByCode,
    ).mockResolvedValue(4);
    asMock(
      registrationRepository.listEligibleLifeStageRangeIds,
    ).mockResolvedValue([101, 102]);
    asMock(registrationRepository.findExistingAssetTypeIds).mockResolvedValue([
      7, 8,
    ]);

    const result = await registrationService.createUserInfo(99, {
      userInfo: {
        financialProfile: {
          desiredLifeExpectancy: 90,
          currentSavings: 50000,
          currencyCode: 'USD',
        },
        portfolioAllocations: [
          {
            allocationType: 'PRE_FFP',
            u: 0.7,
            mu: 0.12,
            rf: 0.03,
          },
          {
            allocationType: 'POST_FFP',
            u: 0.4,
            mu: 0.08,
            rf: 0.03,
          },
        ],
        lifestyleProfile: {
          smokingCode: 'NON_SMOKER',
          physicalActivityCode: 'HIGH',
          dietQualityCode: 'MEDIUM',
          alcoholConsumptionCode: 'LOW',
        },
        stageData: [
          {
            lifeStageRangeId: 101,
            initialAnnualSavings: 12000,
            growthRate: 0.05,
          },
          {
            lifeStageRangeId: 102,
            initialAnnualSavings: 18000,
            growthRate: 0.04,
          },
        ],
        assetData: [
          {
            assetTypeId: 7,
            initialAnnualIncome: 6000,
            growthRate: 0.02,
          },
          {
            assetTypeId: 8,
            initialAnnualIncome: 8000,
            growthRate: 0.01,
          },
        ],
      },
    });

    expect(result).toEqual({
      userInfo: {
        financialProfile: {
          currentSavings: 50000,
          desiredLifeExpectancy: 90,
          currencyCode: 'USD',
        },
        portfolioAllocations: [
          {
            allocationType: 'PRE_FFP',
            u: 0.7,
            mu: 0.12,
            rf: 0.03,
          },
          {
            allocationType: 'POST_FFP',
            u: 0.4,
            mu: 0.08,
            rf: 0.03,
          },
        ],
        lifestyleProfile: {
          smokingCode: 'non_smoker',
          physicalActivityCode: 'active',
          dietQualityCode: 'average',
          alcoholConsumptionCode: 'moderate',
        },
        stageData: [
          {
            lifeStageRangeId: 101,
            initialAnnualSavings: 12000,
            growthRate: 0.05,
          },
          {
            lifeStageRangeId: 102,
            initialAnnualSavings: 18000,
            growthRate: 0.04,
          },
        ],
        assetData: [
          {
            assetTypeId: 7,
            initialAnnualIncome: 6000,
            growthRate: 0.02,
          },
          {
            assetTypeId: 8,
            initialAnnualIncome: 8000,
            growthRate: 0.01,
          },
        ],
      },
    });
    expect(
      registrationRepository.updateProfileFinancialProfile,
    ).toHaveBeenCalledWith(11, 50000, 90, 83, 44, expect.anything());
    expect(registrationRepository.insertPortfolioProfile).toHaveBeenCalledTimes(
      2,
    );
    expect(registrationRepository.insertHabitsProfile).toHaveBeenCalledWith(
      11,
      1,
      2,
      3,
      4,
      expect.anything(),
    );
    expect(registrationRepository.insertLifeStageProfile).toHaveBeenCalledTimes(
      2,
    );
    expect(registrationRepository.insertPostFfpAsset).toHaveBeenCalledTimes(2);
  });

  it('rejects when user info already exists', async () => {
    asMock(registrationRepository.findProfileContextByUserId).mockResolvedValue(
      {
        profileId: 11,
        profileUid: 'profile-uuid',
        birthYear: 2000,
        countryId: 22,
        sexTypeId: 33,
        hasFinancialProfile: true,
        hasHabitsProfile: false,
        hasPortfolioProfile: false,
        hasLifeStageProfile: false,
        hasPostFfpAsset: false,
      },
    );

    await expect(
      registrationService.createUserInfo(99, {
        userInfo: {
          financialProfile: {
            desiredLifeExpectancy: 90,
            currentSavings: 50000,
            currencyCode: 'USD',
          },
          portfolioAllocations: [
            {
              allocationType: 'PRE_FFP',
              u: 0.7,
              mu: 0.12,
              rf: 0.03,
            },
            {
              allocationType: 'POST_FFP',
              u: 0.4,
              mu: 0.08,
              rf: 0.03,
            },
          ],
          lifestyleProfile: {
            smokingCode: 'NON_SMOKER',
            physicalActivityCode: 'ACTIVE',
            dietQualityCode: 'AVERAGE',
            alcoholConsumptionCode: 'MODERATE',
          },
          stageData: [
            {
              lifeStageRangeId: 101,
              initialAnnualSavings: 12000,
              growthRate: 0.05,
            },
          ],
          assetData: [],
        },
      }),
    ).rejects.toBeTruthy();

    expect(
      registrationRepository.updateProfileFinancialProfile,
    ).not.toHaveBeenCalled();
  });

  it('rejects when life expectancy data is unavailable', async () => {
    asMock(registrationRepository.findProfileContextByUserId).mockResolvedValue(
      {
        profileId: 11,
        profileUid: 'profile-uuid',
        birthYear: 2000,
        countryId: 22,
        sexTypeId: 33,
        hasFinancialProfile: false,
        hasHabitsProfile: false,
        hasPortfolioProfile: false,
        hasLifeStageProfile: false,
        hasPostFfpAsset: false,
      },
    );
    asMock(registrationRepository.findCurrencyIdByCode).mockResolvedValue(44);
    asMock(
      registrationRepository.findLifeExpectancyByCountryAndSex,
    ).mockResolvedValue(null);
    asMock(
      registrationRepository.findSmokingAdjustmentByCode,
    ).mockResolvedValue(0);
    asMock(
      registrationRepository.findPhysicalActivityAdjustmentByCode,
    ).mockResolvedValue(2.5);
    asMock(
      registrationRepository.findDietQualityAdjustmentByCode,
    ).mockResolvedValue(0);
    asMock(
      registrationRepository.findAlcoholConsumptionAdjustmentByCode,
    ).mockResolvedValue(0);
    asMock(registrationRepository.findSmokingTypeIdByCode).mockResolvedValue(1);
    asMock(
      registrationRepository.findPhysicalActivityTypeIdByCode,
    ).mockResolvedValue(2);
    asMock(
      registrationRepository.findDietQualityTypeIdByCode,
    ).mockResolvedValue(3);
    asMock(
      registrationRepository.findAlcoholConsumptionTypeIdByCode,
    ).mockResolvedValue(4);
    asMock(
      registrationRepository.listEligibleLifeStageRangeIds,
    ).mockResolvedValue([101, 102]);
    asMock(registrationRepository.findExistingAssetTypeIds).mockResolvedValue(
      [],
    );

    await expect(
      registrationService.createUserInfo(99, {
        userInfo: {
          financialProfile: {
            desiredLifeExpectancy: 90,
            currentSavings: 50000,
            currencyCode: 'USD',
          },
          portfolioAllocations: [
            {
              allocationType: 'PRE_FFP',
              u: 0.7,
              mu: 0.12,
              rf: 0.03,
            },
            {
              allocationType: 'POST_FFP',
              u: 0.4,
              mu: 0.08,
              rf: 0.03,
            },
          ],
          lifestyleProfile: {
            smokingCode: 'NON_SMOKER',
            physicalActivityCode: 'ACTIVE',
            dietQualityCode: 'AVERAGE',
            alcoholConsumptionCode: 'MODERATE',
          },
          stageData: [
            {
              lifeStageRangeId: 101,
              initialAnnualSavings: 12000,
              growthRate: 0.05,
            },
            {
              lifeStageRangeId: 102,
              initialAnnualSavings: 18000,
              growthRate: 0.04,
            },
          ],
          assetData: [],
        },
      }),
    ).rejects.toBeTruthy();
  });

  it('rejects when stageData does not match the server-provided life stages', async () => {
    asMock(registrationRepository.findProfileContextByUserId).mockResolvedValue(
      {
        profileId: 11,
        profileUid: 'profile-uuid',
        birthYear: 2000,
        countryId: 22,
        sexTypeId: 33,
        hasFinancialProfile: false,
        hasHabitsProfile: false,
        hasPortfolioProfile: false,
        hasLifeStageProfile: false,
        hasPostFfpAsset: false,
      },
    );
    asMock(registrationRepository.findCurrencyIdByCode).mockResolvedValue(44);
    asMock(
      registrationRepository.findLifeExpectancyByCountryAndSex,
    ).mockResolvedValue(80.4);
    asMock(
      registrationRepository.findSmokingAdjustmentByCode,
    ).mockResolvedValue(0);
    asMock(
      registrationRepository.findPhysicalActivityAdjustmentByCode,
    ).mockResolvedValue(2.5);
    asMock(
      registrationRepository.findDietQualityAdjustmentByCode,
    ).mockResolvedValue(0);
    asMock(
      registrationRepository.findAlcoholConsumptionAdjustmentByCode,
    ).mockResolvedValue(0);
    asMock(registrationRepository.findSmokingTypeIdByCode).mockResolvedValue(1);
    asMock(
      registrationRepository.findPhysicalActivityTypeIdByCode,
    ).mockResolvedValue(2);
    asMock(
      registrationRepository.findDietQualityTypeIdByCode,
    ).mockResolvedValue(3);
    asMock(
      registrationRepository.findAlcoholConsumptionTypeIdByCode,
    ).mockResolvedValue(4);
    asMock(
      registrationRepository.listEligibleLifeStageRangeIds,
    ).mockResolvedValue([101, 102]);
    asMock(registrationRepository.findExistingAssetTypeIds).mockResolvedValue(
      [],
    );

    await expect(
      registrationService.createUserInfo(99, {
        userInfo: {
          financialProfile: {
            desiredLifeExpectancy: 90,
            currentSavings: 50000,
            currencyCode: 'USD',
          },
          portfolioAllocations: [
            {
              allocationType: 'PRE_FFP',
              u: 0.7,
              mu: 0.12,
              rf: 0.03,
            },
            {
              allocationType: 'POST_FFP',
              u: 0.4,
              mu: 0.08,
              rf: 0.03,
            },
          ],
          lifestyleProfile: {
            smokingCode: 'NON_SMOKER',
            physicalActivityCode: 'ACTIVE',
            dietQualityCode: 'AVERAGE',
            alcoholConsumptionCode: 'MODERATE',
          },
          stageData: [
            {
              lifeStageRangeId: 101,
              initialAnnualSavings: 12000,
              growthRate: 0.05,
            },
          ],
          assetData: [],
        },
      }),
    ).rejects.toBeTruthy();
  });

  it('returns the created user info data', async () => {
    asMock(registrationRepository.findProfileContextByUserId).mockResolvedValue(
      {
        profileId: 11,
        profileUid: 'profile-uuid',
        birthYear: 2000,
        countryId: 22,
        sexTypeId: 33,
        hasFinancialProfile: true,
        hasHabitsProfile: true,
        hasPortfolioProfile: true,
        hasLifeStageProfile: true,
        hasPostFfpAsset: true,
      },
    );
    asMock(registrationRepository.getFinancialProfileDetails).mockResolvedValue(
      {
        currentSavings: 50000,
        desiredLifeExpectancy: 90,
        estimatedLifeExpectancy: 83,
        currencyCode: 'USD',
      },
    );
    asMock(
      registrationRepository.listPortfolioAllocationDetails,
    ).mockResolvedValue([
      {
        allocationType: 'PRE_FFP',
        u: 0.7,
        mu: 0.12,
        rf: 0.03,
      },
      {
        allocationType: 'POST_FFP',
        u: 0.4,
        mu: 0.08,
        rf: 0.03,
      },
    ]);
    asMock(registrationRepository.listStageDataDetails).mockResolvedValue([
      {
        lifeStageRangeId: 101,
        stageNo: 4,
        title: 'Early Adulthood',
        beginningAge: 26,
        endingAge: 45,
        initialAnnualSavings: 12000,
        growthRate: 0.05,
      },
    ]);
    asMock(registrationRepository.listAssetDataDetails).mockResolvedValue([
      {
        uid: 'aaaaaaaa-0000-0000-0000-000000000007',
        assetId: 7,
        assetTypeCode: 'rental',
        assetTypeTitle: 'Rental Income',
        initialAnnualIncome: 6000,
        growthRate: 0.02,
      },
    ]);
    asMock(registrationRepository.getHabitsProfileDetails).mockResolvedValue({
      smokingCode: 'non_smoker',
      physicalActivityCode: 'active',
      dietQualityCode: 'average',
      alcoholConsumptionCode: 'moderate',
    });

    const result = await registrationService.getUserInfo(99);

    expect(result).toEqual({
      userInfo: {
        financialProfile: {
          currentSavings: 50000,
          desiredLifeExpectancy: 90,
          estimatedLifeExpectancy: 83,
          currencyCode: 'USD',
        },
        portfolioAllocations: [
          {
            allocationType: 'PRE_FFP',
            u: 0.7,
            mu: 0.12,
            rf: 0.03,
          },
          {
            allocationType: 'POST_FFP',
            u: 0.4,
            mu: 0.08,
            rf: 0.03,
          },
        ],
        lifestyleProfile: {
          smokingCode: 'non_smoker',
          physicalActivityCode: 'active',
          dietQualityCode: 'average',
          alcoholConsumptionCode: 'moderate',
        },
        stageData: [
          {
            lifeStageRangeId: 101,
            initialAnnualSavings: 12000,
            growthRate: 0.05,
          },
        ],
        assetData: [
          {
            uid: 'aaaaaaaa-0000-0000-0000-000000000007',
            assetId: 7,
            assetTypeCode: 'rental',
            assetTypeTitle: 'Rental Income',
            initialAnnualIncome: 6000,
            growthRate: 0.02,
          },
        ],
      },
    });
  });

  it('rejects when user info has not been created yet', async () => {
    asMock(registrationRepository.findProfileContextByUserId).mockResolvedValue(
      {
        profileId: 11,
        profileUid: 'profile-uuid',
        birthYear: 2000,
        countryId: 22,
        sexTypeId: 33,
        hasFinancialProfile: false,
        hasHabitsProfile: false,
        hasPortfolioProfile: false,
        hasLifeStageProfile: false,
        hasPostFfpAsset: false,
      },
    );

    await expect(registrationService.getUserInfo(99)).rejects.toBeTruthy();
  });

  describe('createFinancialInfo', () => {
    it('creates the combined financial section and computes estimated life expectancy', async () => {
      asMock(
        registrationRepository.findProfileContextByUserId,
      ).mockResolvedValue({
        profileId: 11,
        profileUid: 'profile-uuid',
        birthYear: 2000,
        countryId: 22,
        sexTypeId: 33,
        hasFinancialProfile: false,
        hasHabitsProfile: false,
        hasPortfolioProfile: false,
        hasLifeStageProfile: false,
        hasPostFfpAsset: false,
      });
      asMock(registrationRepository.findCurrencyIdByCode).mockResolvedValue(44);
      asMock(
        registrationRepository.findLifeExpectancyByCountryAndSex,
      ).mockResolvedValue(80.4);
      asMock(
        registrationRepository.findSmokingAdjustmentByCode,
      ).mockResolvedValue(0);
      asMock(
        registrationRepository.findPhysicalActivityAdjustmentByCode,
      ).mockResolvedValue(2.5);
      asMock(
        registrationRepository.findDietQualityAdjustmentByCode,
      ).mockResolvedValue(0);
      asMock(
        registrationRepository.findAlcoholConsumptionAdjustmentByCode,
      ).mockResolvedValue(0);
      asMock(registrationRepository.findSmokingTypeIdByCode).mockResolvedValue(
        1,
      );
      asMock(
        registrationRepository.findPhysicalActivityTypeIdByCode,
      ).mockResolvedValue(2);
      asMock(
        registrationRepository.findDietQualityTypeIdByCode,
      ).mockResolvedValue(3);
      asMock(
        registrationRepository.findAlcoholConsumptionTypeIdByCode,
      ).mockResolvedValue(4);

      const result = await registrationService.createFinancialInfo(
        99,
        financialSectionPayload,
      );

      expect(result).toEqual(financialSectionResponse);
      expect(
        registrationRepository.updateProfileFinancialProfile,
      ).toHaveBeenCalledWith(11, 50000, 90, 83, 44, expect.anything());
      expect(
        registrationRepository.insertPortfolioProfile,
      ).toHaveBeenCalledTimes(2);
      expect(registrationRepository.insertHabitsProfile).toHaveBeenCalledWith(
        11,
        1,
        2,
        3,
        4,
        expect.anything(),
      );
    });

    it('rejects when any financial section records already exist', async () => {
      asMock(
        registrationRepository.findProfileContextByUserId,
      ).mockResolvedValue({
        profileId: 11,
        profileUid: 'profile-uuid',
        birthYear: 2000,
        countryId: 22,
        sexTypeId: 33,
        hasFinancialProfile: true,
        hasHabitsProfile: false,
        hasPortfolioProfile: false,
        hasLifeStageProfile: false,
        hasPostFfpAsset: false,
      });

      await expect(
        registrationService.createFinancialInfo(99, financialSectionPayload),
      ).rejects.toBeTruthy();
      expect(
        registrationRepository.updateProfileFinancialProfile,
      ).not.toHaveBeenCalled();
    });
  });

  describe('getFinancialInfo', () => {
    it('returns the combined financial section', async () => {
      mockFullProfile();
      asMock(
        registrationRepository.getFinancialProfileDetails,
      ).mockResolvedValue({
        currentSavings: 50000,
        desiredLifeExpectancy: 90,
        estimatedLifeExpectancy: 83,
        currencyCode: 'USD',
      });
      asMock(
        registrationRepository.listPortfolioAllocationDetails,
      ).mockResolvedValue(
        financialSectionResponse.financial.portfolioAllocations,
      );
      asMock(registrationRepository.getHabitsProfileDetails).mockResolvedValue({
        smokingCode: 'non_smoker',
        physicalActivityCode: 'active',
        dietQualityCode: 'average',
        alcoholConsumptionCode: 'moderate',
      });

      await expect(registrationService.getFinancialInfo(99)).resolves.toEqual(
        financialSectionResponse,
      );
    });

    it('rejects when the financial section has not been created yet', async () => {
      mockFullProfile({
        hasFinancialProfile: false,
        hasHabitsProfile: false,
        hasPortfolioProfile: false,
      });

      await expect(
        registrationService.getFinancialInfo(99),
      ).rejects.toBeTruthy();
    });
  });

  describe('updateFinancialInfo', () => {
    it('updates profile, portfolio, and lifestyle data through one endpoint flow', async () => {
      mockFullProfile();
      asMock(registrationRepository.findCurrencyIdByCode).mockResolvedValue(66);
      asMock(
        registrationRepository.findLifeExpectancyByCountryAndSex,
      ).mockResolvedValue(80.4);
      asMock(
        registrationRepository.findSmokingAdjustmentByCode,
      ).mockResolvedValue(0);
      asMock(
        registrationRepository.findPhysicalActivityAdjustmentByCode,
      ).mockResolvedValue(2.5);
      asMock(
        registrationRepository.findDietQualityAdjustmentByCode,
      ).mockResolvedValue(0);
      asMock(
        registrationRepository.findAlcoholConsumptionAdjustmentByCode,
      ).mockResolvedValue(0);
      asMock(registrationRepository.findSmokingTypeIdByCode).mockResolvedValue(
        1,
      );
      asMock(
        registrationRepository.findPhysicalActivityTypeIdByCode,
      ).mockResolvedValue(2);
      asMock(
        registrationRepository.findDietQualityTypeIdByCode,
      ).mockResolvedValue(3);
      asMock(
        registrationRepository.findAlcoholConsumptionTypeIdByCode,
      ).mockResolvedValue(4);
      asMock(
        registrationRepository.getFinancialProfileDetails,
      ).mockResolvedValue({
        currentSavings: 62000,
        desiredLifeExpectancy: 95,
        estimatedLifeExpectancy: 83,
        currencyCode: 'EUR',
      });
      asMock(
        registrationRepository.listPortfolioAllocationDetails,
      ).mockResolvedValue([
        { allocationType: 'PRE_FFP', u: 0.6, mu: 0.11, rf: 0.02 },
        { allocationType: 'POST_FFP', u: 0.35, mu: 0.07, rf: 0.02 },
      ]);
      asMock(registrationRepository.getHabitsProfileDetails).mockResolvedValue({
        smokingCode: 'non_smoker',
        physicalActivityCode: 'active',
        dietQualityCode: 'average',
        alcoholConsumptionCode: 'moderate',
      });

      const result = await registrationService.updateFinancialInfo(99, {
        financialProfile: {
          currentSavings: 62000,
          desiredLifeExpectancy: 95,
          currencyCode: 'EUR',
        },
        portfolioAllocations: [
          { allocationType: 'PRE_FFP', u: 0.6, mu: 0.11, rf: 0.02 },
          { allocationType: 'POST_FFP', u: 0.35, mu: 0.07, rf: 0.02 },
        ],
        lifestyleProfile: {
          smokingCode: 'NON_SMOKER',
          physicalActivityCode: 'HIGH',
          dietQualityCode: 'MEDIUM',
          alcoholConsumptionCode: 'LOW',
        },
      });

      expect(
        registrationRepository.updateFinancialProfileBasic,
      ).toHaveBeenCalledWith(
        11,
        {
          currentSavings: 62000,
          desiredLifeExpectancy: 95,
          preferredCurrencyId: 66,
        },
        expect.anything(),
      );
      expect(
        registrationRepository.updatePortfolioAllocation,
      ).toHaveBeenCalledTimes(2);
      expect(registrationRepository.updateHabitsProfile).toHaveBeenCalledWith(
        11,
        1,
        2,
        3,
        4,
        expect.anything(),
      );
      expect(
        registrationRepository.updateEstimatedLifeExpectancy,
      ).toHaveBeenCalledWith(11, 83, expect.anything());
      expect(result).toEqual({
        financial: {
          financialProfile: {
            currentSavings: 62000,
            desiredLifeExpectancy: 95,
            estimatedLifeExpectancy: 83,
            currencyCode: 'EUR',
          },
          portfolioAllocations: [
            { allocationType: 'PRE_FFP', u: 0.6, mu: 0.11, rf: 0.02 },
            { allocationType: 'POST_FFP', u: 0.35, mu: 0.07, rf: 0.02 },
          ],
          lifestyleProfile: {
            smokingCode: 'non_smoker',
            physicalActivityCode: 'active',
            dietQualityCode: 'average',
            alcoholConsumptionCode: 'moderate',
          },
        },
      });
    });

    it('rejects when the financial section does not exist yet', async () => {
      mockFullProfile({
        hasFinancialProfile: false,
        hasHabitsProfile: false,
        hasPortfolioProfile: false,
      });

      await expect(
        registrationService.updateFinancialInfo(99, {
          financialProfile: { currentSavings: 62000 },
        }),
      ).rejects.toBeTruthy();
    });
  });

  describe('getStageDataService', () => {
    it('returns stage data for the stages endpoint', async () => {
      mockFullProfile();
      asMock(registrationRepository.listStageDataDetails).mockResolvedValue([
        {
          lifeStageRangeId: 101,
          stageNo: 4,
          title: 'Early Adulthood',
          beginningAge: 26,
          endingAge: 45,
          initialAnnualSavings: 12000,
          growthRate: 0.05,
        },
      ]);

      await expect(
        registrationService.getStageDataService(99),
      ).resolves.toEqual([
        {
          lifeStageRangeId: 101,
          initialAnnualSavings: 12000,
          growthRate: 0.05,
        },
      ]);
    });

    it('rejects when stage data does not exist yet', async () => {
      mockFullProfile({ hasLifeStageProfile: false });

      await expect(
        registrationService.getStageDataService(99),
      ).rejects.toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const mockFullProfile = (overrides: Record<string, unknown> = {}) =>
    asMock(registrationRepository.findProfileContextByUserId).mockResolvedValue(
      {
        profileId: 11,
        profileUid: 'profile-uuid',
        birthYear: 2000,
        countryId: 22,
        sexTypeId: 33,
        hasFinancialProfile: true,
        hasHabitsProfile: true,
        hasPortfolioProfile: true,
        hasLifeStageProfile: true,
        hasPostFfpAsset: true,
        ...overrides,
      },
    );

  // ---------------------------------------------------------------------------
  // updateFinancialProfileBasicService
  // ---------------------------------------------------------------------------

  describe('updateFinancialProfileBasicService', () => {
    it('updates basic fields and resolves currency when currencyCode is provided', async () => {
      mockFullProfile();
      asMock(registrationRepository.findCurrencyIdByCode).mockResolvedValue(44);

      await registrationService.updateFinancialProfileBasicService(99, {
        currentSavings: 60000,
        currencyCode: 'EUR',
      });

      expect(registrationRepository.findCurrencyIdByCode).toHaveBeenCalledWith(
        'EUR',
      );
      expect(
        registrationRepository.updateFinancialProfileBasic,
      ).toHaveBeenCalledWith(11, {
        currentSavings: 60000,
        preferredCurrencyId: 44,
      });
    });

    it('updates without currency lookup when currencyCode is omitted', async () => {
      mockFullProfile();

      await registrationService.updateFinancialProfileBasicService(99, {
        desiredLifeExpectancy: 95,
      });

      expect(
        registrationRepository.findCurrencyIdByCode,
      ).not.toHaveBeenCalled();
      expect(
        registrationRepository.updateFinancialProfileBasic,
      ).toHaveBeenCalledWith(11, {
        desiredLifeExpectancy: 95,
      });
    });

    it('throws when profile is not found', async () => {
      asMock(
        registrationRepository.findProfileContextByUserId,
      ).mockResolvedValue(null);

      await expect(
        registrationService.updateFinancialProfileBasicService(99, {
          currentSavings: 1000,
        }),
      ).rejects.toBeTruthy();
    });

    it('throws when financial profile does not exist yet', async () => {
      mockFullProfile({ hasFinancialProfile: false });

      await expect(
        registrationService.updateFinancialProfileBasicService(99, {
          currentSavings: 1000,
        }),
      ).rejects.toBeTruthy();
      expect(
        registrationRepository.updateFinancialProfileBasic,
      ).not.toHaveBeenCalled();
    });

    it('throws when currencyCode is invalid', async () => {
      mockFullProfile();
      asMock(registrationRepository.findCurrencyIdByCode).mockResolvedValue(
        null,
      );

      await expect(
        registrationService.updateFinancialProfileBasicService(99, {
          currencyCode: 'XYZ',
        }),
      ).rejects.toBeTruthy();
      expect(
        registrationRepository.updateFinancialProfileBasic,
      ).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // updatePortfolioAllocationsService
  // ---------------------------------------------------------------------------

  describe('updatePortfolioAllocationsService', () => {
    it('calls updatePortfolioAllocation for each allocation', async () => {
      mockFullProfile();

      await registrationService.updatePortfolioAllocationsService(99, [
        { allocationType: 'PRE_FFP', u: 0.6, mu: 0.1, rf: 0.02 },
        { allocationType: 'POST_FFP', u: 0.4, mu: 0.08, rf: 0.02 },
      ]);

      expect(
        registrationRepository.updatePortfolioAllocation,
      ).toHaveBeenCalledTimes(2);
      expect(
        registrationRepository.updatePortfolioAllocation,
      ).toHaveBeenCalledWith(11, 'PRE_FFP', 0.6, 0.1, 0.02, expect.anything());
      expect(
        registrationRepository.updatePortfolioAllocation,
      ).toHaveBeenCalledWith(
        11,
        'POST_FFP',
        0.4,
        0.08,
        0.02,
        expect.anything(),
      );
    });

    it('throws when profile is not found', async () => {
      asMock(
        registrationRepository.findProfileContextByUserId,
      ).mockResolvedValue(null);

      await expect(
        registrationService.updatePortfolioAllocationsService(99, [
          { allocationType: 'PRE_FFP', u: 0.6, mu: 0.1, rf: 0.02 },
          { allocationType: 'POST_FFP', u: 0.4, mu: 0.08, rf: 0.02 },
        ]),
      ).rejects.toBeTruthy();
    });

    it('throws when portfolio profile does not exist yet', async () => {
      mockFullProfile({ hasPortfolioProfile: false });

      await expect(
        registrationService.updatePortfolioAllocationsService(99, [
          { allocationType: 'PRE_FFP', u: 0.6, mu: 0.1, rf: 0.02 },
          { allocationType: 'POST_FFP', u: 0.4, mu: 0.08, rf: 0.02 },
        ]),
      ).rejects.toBeTruthy();
      expect(
        registrationRepository.updatePortfolioAllocation,
      ).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // createPortfolioAllocationsService
  // ---------------------------------------------------------------------------

  describe('createPortfolioAllocationsService', () => {
    it('creates portfolio allocations when none exist yet', async () => {
      mockFullProfile({ hasPortfolioProfile: false });

      await registrationService.createPortfolioAllocationsService(99, [
        { allocationType: 'PRE_FFP', u: 0.6, mu: 0.1, rf: 0.02 },
        { allocationType: 'POST_FFP', u: 0.4, mu: 0.08, rf: 0.02 },
      ]);

      expect(
        registrationRepository.insertPortfolioProfile,
      ).toHaveBeenCalledTimes(2);
      expect(
        registrationRepository.insertPortfolioProfile,
      ).toHaveBeenCalledWith(11, 'PRE_FFP', 0.6, 0.1, 0.02, expect.anything());
    });

    it('throws when portfolio allocations already exist', async () => {
      mockFullProfile();

      await expect(
        registrationService.createPortfolioAllocationsService(99, [
          { allocationType: 'PRE_FFP', u: 0.6, mu: 0.1, rf: 0.02 },
          { allocationType: 'POST_FFP', u: 0.4, mu: 0.08, rf: 0.02 },
        ]),
      ).rejects.toBeTruthy();
      expect(
        registrationRepository.insertPortfolioProfile,
      ).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // updateStageDataService
  // ---------------------------------------------------------------------------

  describe('updateStageDataService', () => {
    it('updates stage items that exist in the profile', async () => {
      mockFullProfile();
      asMock(
        registrationRepository.findExistingLifeStageRangeIdsForProfile,
      ).mockResolvedValue([101, 102]);

      await registrationService.updateStageDataService(99, [
        { lifeStageRangeId: 101, growthRate: 0.06 },
      ]);

      expect(
        registrationRepository.updateLifeStageProfile,
      ).toHaveBeenCalledWith(11, 101, { growthRate: 0.06 }, expect.anything());
    });

    it('throws when profile is not found', async () => {
      asMock(
        registrationRepository.findProfileContextByUserId,
      ).mockResolvedValue(null);

      await expect(
        registrationService.updateStageDataService(99, [
          { lifeStageRangeId: 101, growthRate: 0.06 },
        ]),
      ).rejects.toBeTruthy();
    });

    it('throws when life stage profile does not exist yet', async () => {
      mockFullProfile({ hasLifeStageProfile: false });

      await expect(
        registrationService.updateStageDataService(99, [
          { lifeStageRangeId: 101, growthRate: 0.06 },
        ]),
      ).rejects.toBeTruthy();
      expect(
        registrationRepository.updateLifeStageProfile,
      ).not.toHaveBeenCalled();
    });

    it('throws when a lifeStageRangeId is not in this profile', async () => {
      mockFullProfile();
      asMock(
        registrationRepository.findExistingLifeStageRangeIdsForProfile,
      ).mockResolvedValue([101, 102]);

      await expect(
        registrationService.updateStageDataService(99, [
          { lifeStageRangeId: 999, growthRate: 0.06 },
        ]),
      ).rejects.toBeTruthy();
      expect(
        registrationRepository.updateLifeStageProfile,
      ).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // createStageDataService
  // ---------------------------------------------------------------------------

  describe('createStageDataService', () => {
    it('creates stage rows when requested ids are eligible', async () => {
      mockFullProfile({ birthYear: 2000, hasLifeStageProfile: false });
      asMock(
        registrationRepository.listEligibleLifeStageRangeIds,
      ).mockResolvedValue([101, 102, 103]);
      asMock(
        registrationRepository.findExistingLifeStageRangeIdsForProfile,
      ).mockResolvedValue([101]);

      await registrationService.createStageDataService(99, [
        {
          lifeStageRangeId: 102,
          initialAnnualSavings: 12000,
          growthRate: 0.05,
        },
        {
          lifeStageRangeId: 103,
          initialAnnualSavings: 18000,
          growthRate: 0.04,
        },
      ]);

      expect(
        registrationRepository.insertLifeStageProfile,
      ).toHaveBeenCalledTimes(2);
      expect(
        registrationRepository.insertLifeStageProfile,
      ).toHaveBeenCalledWith(11, 102, 12000, 0.05, expect.anything());
    });

    it('throws when birth year is missing', async () => {
      mockFullProfile({ birthYear: null, hasLifeStageProfile: false });

      await expect(
        registrationService.createStageDataService(99, [
          {
            lifeStageRangeId: 102,
            initialAnnualSavings: 12000,
            growthRate: 0.05,
          },
        ]),
      ).rejects.toBeTruthy();
      expect(
        registrationRepository.insertLifeStageProfile,
      ).not.toHaveBeenCalled();
    });

    it('throws when a requested lifeStageRangeId is not eligible', async () => {
      mockFullProfile({ birthYear: 2000, hasLifeStageProfile: false });
      asMock(
        registrationRepository.listEligibleLifeStageRangeIds,
      ).mockResolvedValue([101, 102]);
      asMock(
        registrationRepository.findExistingLifeStageRangeIdsForProfile,
      ).mockResolvedValue([]);

      await expect(
        registrationService.createStageDataService(99, [
          {
            lifeStageRangeId: 999,
            initialAnnualSavings: 12000,
            growthRate: 0.05,
          },
        ]),
      ).rejects.toBeTruthy();
      expect(
        registrationRepository.insertLifeStageProfile,
      ).not.toHaveBeenCalled();
    });

    it('throws when a requested lifeStageRangeId already exists in the profile', async () => {
      mockFullProfile({ birthYear: 2000 });
      asMock(
        registrationRepository.listEligibleLifeStageRangeIds,
      ).mockResolvedValue([101, 102]);
      asMock(
        registrationRepository.findExistingLifeStageRangeIdsForProfile,
      ).mockResolvedValue([101]);

      await expect(
        registrationService.createStageDataService(99, [
          {
            lifeStageRangeId: 101,
            initialAnnualSavings: 12000,
            growthRate: 0.05,
          },
        ]),
      ).rejects.toBeTruthy();
      expect(
        registrationRepository.insertLifeStageProfile,
      ).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // updateAssetDataService
  // ---------------------------------------------------------------------------

  describe('updateAssetDataService', () => {
    it('updates assets that exist in the profile', async () => {
      mockFullProfile();
      asMock(
        registrationRepository.findExistingAssetUidsForProfile,
      ).mockResolvedValue(['aaaaaaaa-0000-0000-0000-000000000001']);

      await registrationService.updateAssetDataService(99, [
        { uid: 'aaaaaaaa-0000-0000-0000-000000000001', growthRate: 0.05 },
      ]);

      expect(registrationRepository.updatePostFfpAsset).toHaveBeenCalledWith(
        11,
        'aaaaaaaa-0000-0000-0000-000000000001',
        { growthRate: 0.05 },
        expect.anything(),
      );
    });

    it('throws when profile is not found', async () => {
      asMock(
        registrationRepository.findProfileContextByUserId,
      ).mockResolvedValue(null);

      await expect(
        registrationService.updateAssetDataService(99, [
          { uid: 'aaaaaaaa-0000-0000-0000-000000000001', growthRate: 0.05 },
        ]),
      ).rejects.toBeTruthy();
    });

    it('throws when a uid is not in this profile', async () => {
      mockFullProfile();
      asMock(
        registrationRepository.findExistingAssetUidsForProfile,
      ).mockResolvedValue(['aaaaaaaa-0000-0000-0000-000000000001']);

      await expect(
        registrationService.updateAssetDataService(99, [
          { uid: 'bbbbbbbb-0000-0000-0000-000000000002', growthRate: 0.05 },
        ]),
      ).rejects.toBeTruthy();
      expect(registrationRepository.updatePostFfpAsset).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // deleteAssetService
  // ---------------------------------------------------------------------------

  describe('deleteAssetService', () => {
    it('deletes an asset that exists in the profile', async () => {
      mockFullProfile();
      asMock(
        registrationRepository.findExistingAssetUidsForProfile,
      ).mockResolvedValue(['aaaaaaaa-0000-0000-0000-000000000001']);

      await registrationService.deleteAssetService(
        99,
        'aaaaaaaa-0000-0000-0000-000000000001',
      );

      expect(registrationRepository.deletePostFfpAsset).toHaveBeenCalledWith(
        11,
        'aaaaaaaa-0000-0000-0000-000000000001',
      );
    });

    it('throws when profile is not found', async () => {
      asMock(
        registrationRepository.findProfileContextByUserId,
      ).mockResolvedValue(null);

      await expect(
        registrationService.deleteAssetService(
          99,
          'aaaaaaaa-0000-0000-0000-000000000001',
        ),
      ).rejects.toBeTruthy();
    });

    it('throws when the uid does not exist in this profile', async () => {
      mockFullProfile();
      asMock(
        registrationRepository.findExistingAssetUidsForProfile,
      ).mockResolvedValue(['aaaaaaaa-0000-0000-0000-000000000001']);

      await expect(
        registrationService.deleteAssetService(
          99,
          'cccccccc-0000-0000-0000-000000000003',
        ),
      ).rejects.toBeTruthy();
      expect(registrationRepository.deletePostFfpAsset).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // updateLifestyleProfileService
  // ---------------------------------------------------------------------------

  describe('updateLifestyleProfileService', () => {
    it('updates lifestyle habits and returns recalculated life expectancy', async () => {
      mockFullProfile();
      asMock(registrationRepository.findSmokingTypeIdByCode).mockResolvedValue(
        1,
      );
      asMock(
        registrationRepository.findPhysicalActivityTypeIdByCode,
      ).mockResolvedValue(2);
      asMock(
        registrationRepository.findDietQualityTypeIdByCode,
      ).mockResolvedValue(3);
      asMock(
        registrationRepository.findAlcoholConsumptionTypeIdByCode,
      ).mockResolvedValue(4);
      asMock(
        registrationRepository.findSmokingAdjustmentByCode,
      ).mockResolvedValue(-2);
      asMock(
        registrationRepository.findPhysicalActivityAdjustmentByCode,
      ).mockResolvedValue(2.5);
      asMock(
        registrationRepository.findDietQualityAdjustmentByCode,
      ).mockResolvedValue(0);
      asMock(
        registrationRepository.findAlcoholConsumptionAdjustmentByCode,
      ).mockResolvedValue(-1);
      asMock(
        registrationRepository.findLifeExpectancyByCountryAndSex,
      ).mockResolvedValue(80);

      const result = await registrationService.updateLifestyleProfileService(
        99,
        {
          smokingCode: 'NON_SMOKER',
          physicalActivityCode: 'HIGH',
          dietQualityCode: 'AVERAGE',
          alcoholConsumptionCode: 'MODERATE',
        },
      );

      // 80 + (-2 + 2.5 + 0 + -1) = 79.5 → Math.round → 80
      expect(result.estimatedLifeExpectancy).toBe(80);
      expect(result.lifestyleProfile).toEqual({
        smokingCode: 'non_smoker',
        physicalActivityCode: 'active',
        dietQualityCode: 'average',
        alcoholConsumptionCode: 'moderate',
      });
      expect(registrationRepository.updateHabitsProfile).toHaveBeenCalledWith(
        11,
        1,
        2,
        3,
        4,
        expect.anything(),
      );
      expect(
        registrationRepository.updateEstimatedLifeExpectancy,
      ).toHaveBeenCalledWith(11, 80, expect.anything());
    });

    it('throws when profile is not found', async () => {
      asMock(
        registrationRepository.findProfileContextByUserId,
      ).mockResolvedValue(null);

      await expect(
        registrationService.updateLifestyleProfileService(99, {
          smokingCode: 'NON_SMOKER',
          physicalActivityCode: 'ACTIVE',
          dietQualityCode: 'HEALTHY',
          alcoholConsumptionCode: 'NONE',
        }),
      ).rejects.toBeTruthy();
    });

    it('throws when habits profile does not exist yet', async () => {
      mockFullProfile({ hasHabitsProfile: false });

      await expect(
        registrationService.updateLifestyleProfileService(99, {
          smokingCode: 'NON_SMOKER',
          physicalActivityCode: 'ACTIVE',
          dietQualityCode: 'HEALTHY',
          alcoholConsumptionCode: 'NONE',
        }),
      ).rejects.toBeTruthy();
      expect(registrationRepository.updateHabitsProfile).not.toHaveBeenCalled();
    });

    it('throws when an invalid lifestyle code is provided', async () => {
      mockFullProfile();

      await expect(
        registrationService.updateLifestyleProfileService(99, {
          smokingCode: 'INVALID_CODE',
          physicalActivityCode: 'ACTIVE',
          dietQualityCode: 'HEALTHY',
          alcoholConsumptionCode: 'NONE',
        }),
      ).rejects.toBeTruthy();
      expect(registrationRepository.updateHabitsProfile).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // createLifestyleProfileService
  // ---------------------------------------------------------------------------

  describe('createLifestyleProfileService', () => {
    it('creates lifestyle profile and returns recalculated life expectancy', async () => {
      mockFullProfile({ hasHabitsProfile: false });
      asMock(registrationRepository.findSmokingTypeIdByCode).mockResolvedValue(
        1,
      );
      asMock(
        registrationRepository.findPhysicalActivityTypeIdByCode,
      ).mockResolvedValue(2);
      asMock(
        registrationRepository.findDietQualityTypeIdByCode,
      ).mockResolvedValue(3);
      asMock(
        registrationRepository.findAlcoholConsumptionTypeIdByCode,
      ).mockResolvedValue(4);
      asMock(
        registrationRepository.findSmokingAdjustmentByCode,
      ).mockResolvedValue(0);
      asMock(
        registrationRepository.findPhysicalActivityAdjustmentByCode,
      ).mockResolvedValue(2.5);
      asMock(
        registrationRepository.findDietQualityAdjustmentByCode,
      ).mockResolvedValue(0);
      asMock(
        registrationRepository.findAlcoholConsumptionAdjustmentByCode,
      ).mockResolvedValue(0);
      asMock(
        registrationRepository.findLifeExpectancyByCountryAndSex,
      ).mockResolvedValue(80.4);

      const result = await registrationService.createLifestyleProfileService(
        99,
        {
          smokingCode: 'NON_SMOKER',
          physicalActivityCode: 'HIGH',
          dietQualityCode: 'MEDIUM',
          alcoholConsumptionCode: 'LOW',
        },
      );

      expect(registrationRepository.insertHabitsProfile).toHaveBeenCalledWith(
        11,
        1,
        2,
        3,
        4,
        expect.anything(),
      );
      expect(
        registrationRepository.updateEstimatedLifeExpectancy,
      ).toHaveBeenCalledWith(11, 83, expect.anything());
      expect(result).toEqual({
        lifestyleProfile: {
          smokingCode: 'non_smoker',
          physicalActivityCode: 'active',
          dietQualityCode: 'average',
          alcoholConsumptionCode: 'moderate',
        },
        estimatedLifeExpectancy: 83,
      });
    });

    it('throws when lifestyle profile already exists', async () => {
      mockFullProfile();

      await expect(
        registrationService.createLifestyleProfileService(99, {
          smokingCode: 'NON_SMOKER',
          physicalActivityCode: 'HIGH',
          dietQualityCode: 'MEDIUM',
          alcoholConsumptionCode: 'LOW',
        }),
      ).rejects.toBeTruthy();
      expect(registrationRepository.insertHabitsProfile).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // createAssetsService
  // ---------------------------------------------------------------------------

  describe('createAssetsService', () => {
    it('inserts all assets and returns their uids and amounts', async () => {
      mockFullProfile();
      asMock(registrationRepository.findExistingAssetTypeIds).mockResolvedValue(
        [2, 3],
      );
      asMock(registrationRepository.insertPostFfpAssetReturning)
        .mockResolvedValueOnce({
          uid: 'uid-asset-1',
          initialAnnualIncome: 30000000,
          growthRate: 0.1,
        })
        .mockResolvedValueOnce({
          uid: 'uid-asset-2',
          initialAnnualIncome: 12000000,
          growthRate: 0.03,
        });

      const result = await registrationService.createAssetsService(99, {
        assetData: [
          { assetTypeId: 2, initialAnnualIncome: 30000000, growthRate: 0.1 },
          { assetTypeId: 3, initialAnnualIncome: 12000000, growthRate: 0.03 },
        ],
      });

      expect(result).toEqual([
        { uid: 'uid-asset-1', initialAnnualIncome: 30000000, growthRate: 0.1 },
        { uid: 'uid-asset-2', initialAnnualIncome: 12000000, growthRate: 0.03 },
      ]);
      expect(
        registrationRepository.insertPostFfpAssetReturning,
      ).toHaveBeenCalledTimes(2);
      expect(
        registrationRepository.insertPostFfpAssetReturning,
      ).toHaveBeenCalledWith(11, 2, 30000000, 0.1, expect.anything());
    });

    it('throws when profile is not found', async () => {
      asMock(
        registrationRepository.findProfileContextByUserId,
      ).mockResolvedValue(null);

      await expect(
        registrationService.createAssetsService(99, {
          assetData: [
            { assetTypeId: 2, initialAnnualIncome: 1000, growthRate: 0.05 },
          ],
        }),
      ).rejects.toBeTruthy();
    });

    it('throws when financial profile does not exist yet', async () => {
      mockFullProfile({ hasFinancialProfile: false });

      await expect(
        registrationService.createAssetsService(99, {
          assetData: [
            { assetTypeId: 2, initialAnnualIncome: 1000, growthRate: 0.05 },
          ],
        }),
      ).rejects.toBeTruthy();
      expect(
        registrationRepository.insertPostFfpAssetReturning,
      ).not.toHaveBeenCalled();
    });

    it('throws when one or more assetTypeId values are invalid', async () => {
      mockFullProfile();
      // only 1 of 2 requested IDs found in reference table
      asMock(registrationRepository.findExistingAssetTypeIds).mockResolvedValue(
        [2],
      );

      await expect(
        registrationService.createAssetsService(99, {
          assetData: [
            { assetTypeId: 2, initialAnnualIncome: 1000, growthRate: 0.05 },
            { assetTypeId: 999, initialAnnualIncome: 2000, growthRate: 0.03 },
          ],
        }),
      ).rejects.toBeTruthy();
      expect(
        registrationRepository.insertPostFfpAssetReturning,
      ).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // listAssetsService
  // ---------------------------------------------------------------------------

  describe('listAssetsService', () => {
    it('returns all assets for the profile', async () => {
      mockFullProfile();
      asMock(registrationRepository.listAssetDataDetails).mockResolvedValue([
        {
          uid: 'aaaaaaaa-0000-0000-0000-000000000007',
          assetId: 7,
          assetTypeCode: 'rental',
          assetTypeTitle: 'Rental Income',
          initialAnnualIncome: 6000,
          growthRate: 0.02,
        },
      ]);

      const result = await registrationService.listAssetsService(99);

      expect(result).toEqual([
        {
          uid: 'aaaaaaaa-0000-0000-0000-000000000007',
          assetId: 7,
          assetTypeCode: 'rental',
          assetTypeTitle: 'Rental Income',
          initialAnnualIncome: 6000,
          growthRate: 0.02,
        },
      ]);
    });

    it('defaults null initialAnnualIncome and growthRate to 0', async () => {
      mockFullProfile();
      asMock(registrationRepository.listAssetDataDetails).mockResolvedValue([
        {
          uid: 'aaaaaaaa-0000-0000-0000-000000000007',
          assetId: 7,
          assetTypeCode: null,
          assetTypeTitle: null,
          initialAnnualIncome: null,
          growthRate: null,
        },
      ]);

      const result = await registrationService.listAssetsService(99);

      expect(result[0].initialAnnualIncome).toBe(0);
      expect(result[0].growthRate).toBe(0);
    });

    it('throws when profile is not found', async () => {
      asMock(
        registrationRepository.findProfileContextByUserId,
      ).mockResolvedValue(null);

      await expect(
        registrationService.listAssetsService(99),
      ).rejects.toBeTruthy();
    });
  });
});
