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
}));

const asMock = <T>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>;

describe('Registration Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asMock(withTransaction).mockImplementation(async (callback) =>
      callback({} as never),
    );
  });

  it('creates user info and computes estimated life expectancy', async () => {
    asMock(registrationRepository.findProfileContextByUserId).mockResolvedValue({
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
    asMock(registrationRepository.findSmokingAdjustmentByCode).mockResolvedValue(0);
    asMock(registrationRepository.findPhysicalActivityAdjustmentByCode).mockResolvedValue(2.5);
    asMock(registrationRepository.findDietQualityAdjustmentByCode).mockResolvedValue(0);
    asMock(
      registrationRepository.findAlcoholConsumptionAdjustmentByCode,
    ).mockResolvedValue(0);
    asMock(registrationRepository.findSmokingTypeIdByCode).mockResolvedValue(1);
    asMock(registrationRepository.findPhysicalActivityTypeIdByCode).mockResolvedValue(2);
    asMock(registrationRepository.findDietQualityTypeIdByCode).mockResolvedValue(3);
    asMock(
      registrationRepository.findAlcoholConsumptionTypeIdByCode,
    ).mockResolvedValue(4);
    asMock(registrationRepository.listEligibleLifeStageRangeIds).mockResolvedValue([
      101, 102,
    ]);
    asMock(registrationRepository.findExistingAssetTypeIds).mockResolvedValue([7, 8]);

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
    expect(registrationRepository.updateProfileFinancialProfile).toHaveBeenCalledWith(
      11,
      50000,
      90,
      83,
      44,
      expect.anything(),
    );
    expect(registrationRepository.insertPortfolioProfile).toHaveBeenCalledTimes(2);
    expect(registrationRepository.insertHabitsProfile).toHaveBeenCalledWith(
      11,
      1,
      2,
      3,
      4,
      expect.anything(),
    );
    expect(registrationRepository.insertLifeStageProfile).toHaveBeenCalledTimes(2);
    expect(registrationRepository.insertPostFfpAsset).toHaveBeenCalledTimes(2);
  });

  it('rejects when user info already exists', async () => {
    asMock(registrationRepository.findProfileContextByUserId).mockResolvedValue({
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

    expect(registrationRepository.updateProfileFinancialProfile).not.toHaveBeenCalled();
  });

  it('rejects when life expectancy data is unavailable', async () => {
    asMock(registrationRepository.findProfileContextByUserId).mockResolvedValue({
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
    ).mockResolvedValue(null);
    asMock(registrationRepository.findSmokingAdjustmentByCode).mockResolvedValue(0);
    asMock(registrationRepository.findPhysicalActivityAdjustmentByCode).mockResolvedValue(2.5);
    asMock(registrationRepository.findDietQualityAdjustmentByCode).mockResolvedValue(0);
    asMock(
      registrationRepository.findAlcoholConsumptionAdjustmentByCode,
    ).mockResolvedValue(0);
    asMock(registrationRepository.findSmokingTypeIdByCode).mockResolvedValue(1);
    asMock(registrationRepository.findPhysicalActivityTypeIdByCode).mockResolvedValue(2);
    asMock(registrationRepository.findDietQualityTypeIdByCode).mockResolvedValue(3);
    asMock(
      registrationRepository.findAlcoholConsumptionTypeIdByCode,
    ).mockResolvedValue(4);
    asMock(registrationRepository.listEligibleLifeStageRangeIds).mockResolvedValue([
      101, 102,
    ]);
    asMock(registrationRepository.findExistingAssetTypeIds).mockResolvedValue([]);

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
    asMock(registrationRepository.findProfileContextByUserId).mockResolvedValue({
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
    asMock(registrationRepository.findSmokingAdjustmentByCode).mockResolvedValue(0);
    asMock(registrationRepository.findPhysicalActivityAdjustmentByCode).mockResolvedValue(2.5);
    asMock(registrationRepository.findDietQualityAdjustmentByCode).mockResolvedValue(0);
    asMock(
      registrationRepository.findAlcoholConsumptionAdjustmentByCode,
    ).mockResolvedValue(0);
    asMock(registrationRepository.findSmokingTypeIdByCode).mockResolvedValue(1);
    asMock(registrationRepository.findPhysicalActivityTypeIdByCode).mockResolvedValue(2);
    asMock(registrationRepository.findDietQualityTypeIdByCode).mockResolvedValue(3);
    asMock(
      registrationRepository.findAlcoholConsumptionTypeIdByCode,
    ).mockResolvedValue(4);
    asMock(registrationRepository.listEligibleLifeStageRangeIds).mockResolvedValue([
      101, 102,
    ]);
    asMock(registrationRepository.findExistingAssetTypeIds).mockResolvedValue([]);

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
    asMock(registrationRepository.findProfileContextByUserId).mockResolvedValue({
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
    });
    asMock(registrationRepository.getFinancialProfileDetails).mockResolvedValue({
      currentSavings: 50000,
      desiredLifeExpectancy: 90,
      estimatedLifeExpectancy: 83,
      currencyCode: 'USD',
    });
    asMock(registrationRepository.listPortfolioAllocationDetails).mockResolvedValue([
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
        assetTypeId: 7,
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
            assetTypeId: 7,
            initialAnnualIncome: 6000,
            growthRate: 0.02,
          },
        ],
      },
    });
  });

  it('rejects when user info has not been created yet', async () => {
    asMock(registrationRepository.findProfileContextByUserId).mockResolvedValue({
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

    await expect(registrationService.getUserInfo(99)).rejects.toBeTruthy();
  });
});
