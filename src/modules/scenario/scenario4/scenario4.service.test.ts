import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createScenario4Input,
  getScenario4InputService,
  getScenario4OutputService,
} from './scenario4.service.js';
import * as registrationRepository from '@/modules/registration/registration.repository.js';
import * as scenario4Repository from './scenario4.repository.js';
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

vi.mock('./scenario4.repository.js', () => ({
  getScenario4Input: vi.fn(),
  getScenario4Output: vi.fn(),
  upsertScenario4: vi.fn(),
}));

vi.mock('../scenario.repository.js', () => ({
  findScenarioTypeIdByNo: vi.fn(),
}));

const asMock = <T>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>;
const currentYear = new Date().getFullYear();
const birthYear = currentYear - 26;
const currentAge = currentYear - birthYear;

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
    currencyId: 1,
  });

  asMock(
    registrationRepository.listPortfolioAllocationDetails,
  ).mockResolvedValue([
    { allocationType: 'PRE_FFP', u: 0, mu: 0, rf: 0 },
    { allocationType: 'POST_FFP', u: 0, mu: 0, rf: 0 },
  ]);
};

describe('Scenario4 Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    asMock(withTransaction).mockImplementation(async (callback) =>
      callback({} as never),
    );
  });

  it('persists the computed annual saving outcome', async () => {
    baseContextMocks();

    asMock(findScenarioTypeIdByNo).mockResolvedValue(4);
    asMock(scenario4Repository.getScenario4Input).mockResolvedValue(null);

    await createScenario4Input(99, {
      lifeExpectancy: currentAge + 4,
      inputFfpAge: currentAge + 2,
      inputFfpAnnualSpending: 100,
    });

    const [
      profileId,
      scenarioTypeId,
      lifeExpectancy,
      inputFfpAge,
      inputFfpAnnualSpending,
      requiredAnnualSaving,
      requiredWealthAtFFPAge,
    ] = asMock(scenario4Repository.upsertScenario4).mock.calls[0] ?? [];

    expect({
      profileId,
      scenarioTypeId,
      lifeExpectancy,
      inputFfpAge,
      inputFfpAnnualSpending,
      requiredWealthAtFFPAge,
    }).toEqual({
      profileId: 10,
      scenarioTypeId: 4,
      lifeExpectancy: currentAge + 4,
      inputFfpAge: currentAge + 2,
      inputFfpAnnualSpending: 100,
      requiredWealthAtFFPAge: 200,
    });
    expect(requiredAnnualSaving).toBeCloseTo(50, 2);
  });

  it('returns the saved scenario 4 input including current savings', async () => {
    baseContextMocks();

    asMock(findScenarioTypeIdByNo).mockResolvedValue(4);
    asMock(scenario4Repository.getScenario4Input).mockResolvedValue({
      lifeExpectancy: currentAge + 4,
      inputFfpAge: currentAge + 2,
      inputFfpAnnualSpending: 100,
    });

    await expect(getScenario4InputService(99)).resolves.toEqual({
      lifeExpectancy: currentAge + 4,
      inputFfpAge: currentAge + 2,
      inputFfpAnnualSpending: 100,
    });
  });

  it('returns the expanded computed output payload', async () => {
    baseContextMocks();

    asMock(findScenarioTypeIdByNo).mockResolvedValue(4);
    asMock(scenario4Repository.getScenario4Output).mockResolvedValue({
      requiredAnnualSaving: 50,
      ffpAge: currentAge + 2,
      requiredWealthAtFFPAge: 200,
    });

    await expect(getScenario4OutputService(99)).resolves.toEqual({
      requiredAnnualSaving: 50,
      ffpAge: currentAge + 2,
      requiredWealthAtFFPAge: 200,
    });
  });
});
