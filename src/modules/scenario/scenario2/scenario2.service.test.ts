import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createScenario2Input,
  getScenario2OutputService,
} from './scenario2.service.js';
import * as registrationRepository from '@/modules/registration/registration.repository.js';
import * as scenario2Repository from './scenario2.repository.js';
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
}));

vi.mock('./scenario2.repository.js', () => ({
  getScenario2Input: vi.fn(),
  getScenario2Output: vi.fn(),
  upsertScenario2: vi.fn(),
}));

vi.mock('../scenario.repository.js', () => ({
  findScenarioTypeIdByNo: vi.fn(),
}));

const asMock = <T>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>;
const currentYear = new Date().getFullYear();
const currentAge = 30;

const baseContextMocks = () => {
  asMock(registrationRepository.findProfileContextByUserId).mockResolvedValue({
    profileId: 10,
    profileUid: 'profile-uid',
    birthYear: currentYear - currentAge,
    countryId: 1,
    sexTypeId: 1,
    hasFinancialProfile: true,
    hasHabitsProfile: true,
    hasPortfolioProfile: true,
    hasLifeStageProfile: true,
    hasPostFfpAsset: true,
  });

  asMock(registrationRepository.getFinancialProfileDetails).mockResolvedValue({
    currentSavings: 0,
    desiredLifeExpectancy: null,
    estimatedLifeExpectancy: null,
    currencyCode: 'USD',
  });

  asMock(
    registrationRepository.listPortfolioAllocationDetails,
  ).mockResolvedValue([
    { allocationType: 'PRE_FFP', u: 0, mu: 0, rf: 0, sigma: 0 },
    { allocationType: 'POST_FFP', u: 0, mu: 0, rf: 0, sigma: 0 },
  ]);
};

describe('Scenario2 Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asMock(withTransaction).mockImplementation(async (callback) =>
      callback({} as never),
    );
  });

  it('creates input and persists output', async () => {
    baseContextMocks();

    asMock(findScenarioTypeIdByNo).mockResolvedValue(2);
    asMock(scenario2Repository.getScenario2Input).mockResolvedValue(null);
    asMock(registrationRepository.getFinancialProfileDetails).mockResolvedValue(
      {
        currentSavings: 100,
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
        beginningAge: 30,
        endingAge: null,
        initialAnnualSavings: 50,
        growthRate: 0,
      },
    ]);

    await createScenario2Input(99, {
      lifeExpectancy: 32,
      inputFfpAnnualSpending: 100,
    });

    expect(scenario2Repository.upsertScenario2).toHaveBeenCalledWith(
      10,
      2,
      32,
      100,
      31,
      expect.anything(),
    );
  });

  it('persists a null FFP age when the target remains unreachable', async () => {
    baseContextMocks();

    asMock(findScenarioTypeIdByNo).mockResolvedValue(2);
    asMock(scenario2Repository.getScenario2Input).mockResolvedValue(null);

    asMock(registrationRepository.getFinancialProfileDetails).mockResolvedValue(
      {
        currentSavings: 0,
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
        beginningAge: 30,
        endingAge: null,
        initialAnnualSavings: 0,
        growthRate: 0,
      },
    ]);

    await createScenario2Input(99, {
      lifeExpectancy: 31,
      inputFfpAnnualSpending: 100,
    });

    expect(scenario2Repository.upsertScenario2).toHaveBeenCalledWith(
      10,
      2,
      31,
      100,
      null,
      expect.anything(),
    );
  });

  it('rejects non-contiguous stages', async () => {
    baseContextMocks();

    asMock(findScenarioTypeIdByNo).mockResolvedValue(2);
    asMock(scenario2Repository.getScenario2Input).mockResolvedValue(null);

    asMock(registrationRepository.listStageDataDetails).mockResolvedValue([
      {
        lifeStageRangeId: 1,
        stageNo: 1,
        title: 'Stage 1',
        beginningAge: 30,
        endingAge: 31,
        initialAnnualSavings: 0,
        growthRate: 0,
      },
      {
        lifeStageRangeId: 2,
        stageNo: 2,
        title: 'Stage 2',
        beginningAge: 34,
        endingAge: null,
        initialAnnualSavings: 0,
        growthRate: 0,
      },
    ]);

    await expect(
      createScenario2Input(99, {
        lifeExpectancy: 80,
        inputFfpAnnualSpending: 0,
      }),
    ).rejects.toThrow('Stages must be contiguous and non-overlapping');
  });

  it('returns the enriched output payload with a wealth projection', async () => {
    baseContextMocks();

    asMock(findScenarioTypeIdByNo).mockResolvedValue(2);
    asMock(scenario2Repository.getScenario2Output).mockResolvedValue({
      lifeExpectancy: 32,
      inputFfpAnnualSpending: 80,
      outputFfpAge: 31,
    });
    asMock(registrationRepository.getFinancialProfileDetails).mockResolvedValue(
      {
        currentSavings: 100,
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
        beginningAge: 30,
        endingAge: null,
        initialAnnualSavings: 50,
        growthRate: 0,
      },
    ]);

    await expect(getScenario2OutputService(99)).resolves.toEqual({
      inputFfpAnnualSpending: 80,
      outputFfpAgeLow: 31,
      outputFfpAge: 31,
      outputFfpAgeHigh: 31,
      wealthProjection: [
        {
          age: 30,
          wealthLow: 100,
          wealthExpected: 100,
          wealthHigh: 100,
          requiredWealth: 160,
        },
        {
          age: 31,
          wealthLow: 150,
          wealthExpected: 150,
          wealthHigh: 150,
          requiredWealth: 80,
        },
      ],
    });
  });
});
