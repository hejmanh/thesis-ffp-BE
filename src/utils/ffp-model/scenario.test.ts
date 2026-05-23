import { describe, it, expect } from 'vitest';
import type { LifeStage } from '../../types/ffp-model/financial.js';
import {
  calculateRequiredSaving,
  estimateFFPAge,
  runScenario1,
  runScenario3,
  runScenario4,
} from './scenario.js';

type EstimateParams = Parameters<typeof estimateFFPAge>[0];

const baseParams = (): EstimateParams => ({
  currentSavings: 0,
  currentAge: 30,
  lifeExpectancy: 31,
  stages: [
    {
      startAge: 30,
      endAge: 31,
      initialAnnualSaving: 0,
      growthRate: 0,
    },
  ],
  annualSpending: 0,
  u_pre: 0,
  u_post: 0,
  mu_pre: 0,
  r_f_pre: 0,
  mu_post: 0,
  r_f_post: 0,
});

describe('estimateFFPAge', () => {
  it('returns currentAge when spending is zero', () => {
    const params = baseParams();
    const result = estimateFFPAge(params);
    expect(result).toBe(30);
  });

  it('returns null when lifeExpectancy equals currentAge', () => {
    const params = baseParams();
    params.lifeExpectancy = 30;
    const result = estimateFFPAge(params);
    expect(result).toBeNull();
  });

  it('returns currentAge when wealth equals required wealth', () => {
    const params = baseParams();
    params.currentSavings = 10;
    params.annualSpending = 10;
    params.lifeExpectancy = 31;
    const result = estimateFFPAge(params);
    expect(result).toBe(30);
  });

  it('returns next age when zero return and saving reaches requirement', () => {
    const stages: LifeStage[] = [
      {
        startAge: 30,
        endAge: 40,
        initialAnnualSaving: 10,
        growthRate: 0,
      },
    ];

    const params = baseParams();
    params.stages = stages;
    params.lifeExpectancy = 32;
    params.annualSpending = 5;

    const result = estimateFFPAge(params);
    expect(result).toBe(31);
  });

  it('returns null when stages have gaps and savings never reach requirement', () => {
    const stages: LifeStage[] = [
      {
        startAge: 30,
        endAge: 31,
        initialAnnualSaving: 0,
        growthRate: 0,
      },
    ];

    const params = baseParams();
    params.stages = stages;
    params.lifeExpectancy = 33;
    params.annualSpending = 1;

    const result = estimateFFPAge(params);
    expect(result).toBeNull();
  });
});

describe('runScenario1', () => {
  it('marks achievable when wealth meets required wealth', () => {
    const result = runScenario1({
      currentSavings: 100,
      currentAge: 30,
      ffpAge: 31,
      stages: [
        {
          startAge: 30,
          endAge: 31,
          initialAnnualSaving: 0,
          growthRate: 0,
        },
      ],
      annualSpending: 10,
      retirementDuration: 1,
      u_pre: 0,
      u_post: 0,
      mu_pre: 0,
      r_f_pre: 0,
      mu_post: 0,
      r_f_post: 0,
    });

    expect(result.achievable).toBe(true);
  });
});

describe('runScenario3', () => {
  it('calculates available spending with zero return', () => {
    const result = runScenario3({
      wealthAtFFP: 100,
      u_post: 0,
      mu: 0,
      r_f: 0,
      retirementDuration: 10,
      assets: [],
    });

    expect(result.availableSpending).toBe(10);
  });
});

describe('calculateRequiredSaving', () => {
  it('uses terminalStageIndex instead of zero-saving marker', () => {
    const stages: LifeStage[] = [
      {
        startAge: 30,
        endAge: 31,
        initialAnnualSaving: 0,
        growthRate: 0,
      },
      {
        startAge: 31,
        endAge: 32,
        initialAnnualSaving: 0,
        growthRate: 0,
      },
    ];

    const required = calculateRequiredSaving({
      targetWealth: 10,
      currentSavings: 0,
      currentAge: 30,
      ffpAge: 32,
      portfolioReturn: 0,
      stages,
      terminalStageIndex: 1,
    });

    expect(required).toBeCloseTo(10, 2);
  });
});

describe('runScenario4', () => {
  it('returns near-zero saving when no spending is required', () => {
    const result = runScenario4({
      currentSavings: 0,
      currentAge: 30,
      ffpAge: 31,
      stages: [],
      annualSpending: 0,
      retirementDuration: 1,
      u_pre: 0,
      u_post: 0,
      mu: 0,
      r_f: 0,
    });

    expect(result.requiredAnnualSaving).toBeLessThanOrEqual(0.01);
    expect(result.isTerminalStageAdded).toBe(true);
  });
});
