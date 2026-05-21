import { describe, it, expect } from 'vitest';
import type { LifeStage } from '../../types/ffp-model/financial.js';
import { estimateFFPAge } from './scenario.js';

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
