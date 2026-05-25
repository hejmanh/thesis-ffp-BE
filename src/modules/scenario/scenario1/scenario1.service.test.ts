import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createScenario1Input } from './scenario1.service.js';
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

const baseContextMocks = () => {
  asMock(registrationRepository.findProfileContextByUserId).mockResolvedValue({
    profileId: 10,
    profileUid: 'profile-uid',
    birthYear: 2000,
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
    { allocationType: 'PRE_FFP', u: 0, mu: 0, rf: 0 },
    { allocationType: 'POST_FFP', u: 0, mu: 0, rf: 0 },
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
        endingAge: 31,
        initialAnnualSavings: 0,
        growthRate: 0,
      },
      {
        lifeStageRangeId: 2,
        stageNo: 2,
        title: 'Stage 2',
        beginningAge: 31,
        endingAge: null,
        initialAnnualSavings: 0,
        growthRate: 0,
      },
    ]);

    await createScenario1Input(99, {
      lifeExpectancy: 80,
      inputFfpAge: 40,
      inputFfpAnnualSpending: 0,
    });

    expect(scenario1Repository.upsertScenario1).toHaveBeenCalledWith(
      10,
      1,
      80,
      40,
      0,
      true,
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
        beginningAge: 33,
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
});
