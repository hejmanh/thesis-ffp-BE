import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createScenario3Input,
  getScenario3OutputService,
} from './scenario3.service.js';
import * as registrationRepository from '@/modules/registration/registration.repository.js';
import * as scenario3Repository from './scenario3.repository.js';
import { withTransaction } from '@/database/transaction.js';
import { findScenarioTypeIdByNo } from '../scenario.repository.js';

vi.mock('@/database/transaction.js', () => ({
  withTransaction: vi.fn(),
}));

vi.mock('@/modules/registration/registration.repository.js', () => ({
  findProfileContextByUserId: vi.fn(),
  getFinancialProfileDetails: vi.fn(),
  listPortfolioAllocationDetails: vi.fn(),
  listStageDataDetails: vi.fn(),
  listAssetDataDetails: vi.fn(),
}));

vi.mock('./scenario3.repository.js', () => ({
  getScenario3Input: vi.fn(),
  getScenario3Output: vi.fn(),
  upsertScenario3: vi.fn(),
}));

vi.mock('../scenario.repository.js', () => ({
  findScenarioTypeIdByNo: vi.fn(),
}));

const asMock = <T>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>;
const currentYear = new Date().getFullYear();
const birthYear = currentYear - 26;
const currentAge = currentYear - birthYear;
const expectedSpending = 120;

const baseContextMocks = () => {
  asMock(registrationRepository.findProfileContextByUserId).mockResolvedValue({
    profileId: 10,
    profileUid: 'profile-uid',
    birthYear,
    countryId: 1,
    sexTypeId: 1,
    hasFinancialProfile: true,
    hasHabitsProfile: true,
    hasPortfolioProfile: true,
    hasLifeStageProfile: true,
    hasPostFfpAsset: true,
  });

  asMock(registrationRepository.getFinancialProfileDetails).mockResolvedValue({
    currentSavings: 100,
    desiredLifeExpectancy: null,
    estimatedLifeExpectancy: null,
    currencyCode: 'USD',
  });

  asMock(
    registrationRepository.listPortfolioAllocationDetails,
  ).mockResolvedValue([
    { allocationType: 'PRE_FFP', u: 0, mu: 0, rf: 0 },
    { allocationType: 'POST_FFP', u: 0, mu: 0, rf: 0 },
  ]);
};

describe('Scenario3 Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asMock(withTransaction).mockImplementation(async (callback) =>
      callback({} as never),
    );
  });

  it('persists the computed annual spending outcome', async () => {
    baseContextMocks();

    asMock(findScenarioTypeIdByNo).mockResolvedValue(3);
    asMock(scenario3Repository.getScenario3Input).mockResolvedValue(null);
    asMock(registrationRepository.listStageDataDetails).mockResolvedValue([
      {
        lifeStageRangeId: 1,
        stageNo: 1,
        title: 'Stage 1',
        beginningAge: currentAge,
        endingAge: null,
        initialAnnualSavings: 50,
        growthRate: 0,
      },
    ]);
    asMock(registrationRepository.listAssetDataDetails).mockResolvedValue([
      {
        uid: 'asset-1',
        assetTypeCode: 'DIVIDEND',
        assetTypeTitle: 'Dividend Portfolio',
        initialAnnualIncome: 20,
        growthRate: 0,
      },
    ]);

    await createScenario3Input(99, {
      lifeExpectancy: currentAge + 4,
      inputFfpAge: currentAge + 2,
    });

    const persistedSpending = asMock(scenario3Repository.upsertScenario3).mock
      .calls[0]?.[4];

    expect(persistedSpending).toBe(expectedSpending);
  });

  it('returns the enriched output payload with monthly spending and cashflow', async () => {
    baseContextMocks();

    asMock(findScenarioTypeIdByNo).mockResolvedValue(3);
    asMock(scenario3Repository.getScenario3Output).mockResolvedValue({
      lifeExpectancy: currentAge + 3,
      inputFfpAge: currentAge + 1,
      outputFfpAnnualSpending: 60,
    });
    asMock(registrationRepository.getFinancialProfileDetails).mockResolvedValue(
      {
        currentSavings: 120,
        desiredLifeExpectancy: null,
        estimatedLifeExpectancy: null,
        currencyCode: 'USD',
      },
    );
    asMock(registrationRepository.listStageDataDetails).mockResolvedValue([
      {
        lifeStageRangeId: 1,
        stageNo: 1,
        title: 'Stage 1',
        beginningAge: currentAge,
        endingAge: null,
        initialAnnualSavings: 0,
        growthRate: 0,
      },
    ]);
    asMock(registrationRepository.listAssetDataDetails).mockResolvedValue([]);

    await expect(getScenario3OutputService(99)).resolves.toEqual({
      outputFfpAnnualSpending: 60,
      outputFfpMonthlySpending: 5,
      retirementCashflow: [
        { age: currentAge + 1, wealth: 120 },
        { age: currentAge + 2, wealth: 60 },
        { age: currentAge + 3, wealth: 0 },
      ],
    });
  });
});
