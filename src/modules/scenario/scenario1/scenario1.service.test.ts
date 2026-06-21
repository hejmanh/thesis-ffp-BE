import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createScenario1Input,
  getScenario1OutputService,
} from './scenario1.service.js';
import * as registrationRepository from '@/modules/registration/registration.repository.js';
import * as scenario1Repository from './scenario1.repository.js';
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

vi.mock('./scenario1.repository.js', () => ({
  getScenario1Input: vi.fn(),
  getScenario1Output: vi.fn(),
  upsertScenario1: vi.fn(),
}));

vi.mock('../scenario.repository.js', () => ({
  findScenarioTypeIdByNo: vi.fn(),
}));

const asMock = <T>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>;
const currentYear = new Date().getFullYear();

const baseContextMocks = () => {
  asMock(registrationRepository.findProfileContextByUserId).mockResolvedValue({
    profileId: 10,
    profileUid: 'profile-uid',
    birthYear: currentYear - 30,
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

describe('Scenario1 Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asMock(withTransaction).mockImplementation(async (callback) =>
      callback({} as never),
    );
  });

  it('creates input and persists output', async () => {
    baseContextMocks();

    asMock(findScenarioTypeIdByNo).mockResolvedValue(1);
    asMock(scenario1Repository.getScenario1Input).mockResolvedValue(null);

    asMock(registrationRepository.listStageDataDetails).mockResolvedValue([
      {
        lifeStageRangeId: 1,
        stageNo: 1,
        title: 'Stage 1',
        beginningAge: 30,
        endingAge: null,
        initialAnnualSavings: 100,
        growthRate: 0,
      },
    ]);

    await createScenario1Input(99, {
      lifeExpectancy: 32,
      inputFfpAge: 31,
      inputFfpAnnualSpending: 100,
    });

    expect(scenario1Repository.upsertScenario1).toHaveBeenCalledWith(
      10,
      1,
      32,
      31,
      100,
      true,
      expect.anything(),
    );
  });

  it('persists an unachievable output when zero-return math misses the target', async () => {
    baseContextMocks();

    asMock(findScenarioTypeIdByNo).mockResolvedValue(1);
    asMock(scenario1Repository.getScenario1Input).mockResolvedValue(null);

    asMock(registrationRepository.getFinancialProfileDetails).mockResolvedValue(
      {
        currentSavings: 50,
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

    await createScenario1Input(99, {
      lifeExpectancy: 32,
      inputFfpAge: 31,
      inputFfpAnnualSpending: 120,
    });

    expect(scenario1Repository.upsertScenario1).toHaveBeenCalledWith(
      10,
      1,
      32,
      31,
      120,
      false,
      expect.anything(),
    );
  });

  it('rejects non-contiguous stages', async () => {
    baseContextMocks();

    asMock(findScenarioTypeIdByNo).mockResolvedValue(1);
    asMock(scenario1Repository.getScenario1Input).mockResolvedValue(null);

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
      createScenario1Input(99, {
        lifeExpectancy: 80,
        inputFfpAge: 40,
        inputFfpAnnualSpending: 0,
      }),
    ).rejects.toThrow('Stages must be contiguous and non-overlapping');
  });

  it('returns the enriched output payload with required wealth and projection', async () => {
    baseContextMocks();

    asMock(findScenarioTypeIdByNo).mockResolvedValue(1);
    asMock(scenario1Repository.getScenario1Input).mockResolvedValue({
      lifeExpectancy: 32,
      inputFfpAge: 31,
      inputFfpAnnualSpending: 100,
    });

    asMock(registrationRepository.listStageDataDetails).mockResolvedValue([
      {
        lifeStageRangeId: 1,
        stageNo: 1,
        title: 'Stage 1',
        beginningAge: 30,
        endingAge: null,
        initialAnnualSavings: 100,
        growthRate: 0,
      },
    ]);

    await expect(getScenario1OutputService(99)).resolves.toEqual({
      inputFfpAge: 31,
      inputFfpAnnualSpending: 100,
      outputIsAchievable: true,
      outputLowIsAchievable: true,
      outputHighIsAchievable: true,
      requiredWealthAtFFPAge: 100,
      expectedWealthAtFFPAge: 100,
      wealthProjection: [
        { age: 30, wealthLow: 0, wealthExpected: 0, wealthHigh: 0 },
        { age: 31, wealthLow: 100, wealthExpected: 100, wealthHigh: 100 },
      ],
    });
  });
});
