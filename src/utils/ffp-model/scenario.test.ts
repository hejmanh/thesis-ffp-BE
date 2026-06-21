import { describe, it, expect } from 'vitest';
import type { LifeStage } from '../../types/ffp-model/financial.js';
import {
  buildScenario1WealthProjection,
  buildScenario2WealthProjection,
  buildScenario3RetirementCashflow,
  calculateScenario4RequiredWealthAtFFP,
  calculateRequiredSaving,
  estimateFFPAge,
  estimateFFPAgeRange,
  projectWealthBeforeFFPWithConstantSaving,
  runScenario1,
  runScenario3,
  runScenario4,
  solveScenario4RequiredAnnualSaving,
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

  it('uses post-FFP return inputs when estimating the earliest achievable age', () => {
    const params = baseParams();
    params.currentSavings = 90.91;
    params.annualSpending = 100;
    params.lifeExpectancy = 31;
    params.u_post = 1;
    params.mu_post = 0.1;

    const result = estimateFFPAge(params);

    expect(result).toBe(30);
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

  it('computes exact wealth and required wealth with zero-return math', () => {
    const result = runScenario1({
      currentSavings: 100,
      currentAge: 30,
      ffpAge: 32,
      stages: [
        {
          startAge: 30,
          endAge: 32,
          initialAnnualSaving: 50,
          growthRate: 0,
        },
      ],
      annualSpending: 80,
      retirementDuration: 2,
      u_pre: 0,
      u_post: 0,
      mu_pre: 0,
      r_f_pre: 0,
      mu_post: 0,
      r_f_post: 0,
    });

    expect(result.wealthAtFFP).toBe(200);
    expect(result.requiredWealth).toBe(160);
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
      sigma_post: 0,
      retirementDuration: 10,
      assets: [],
    });

    expect(result.availableSpending).toBe(10);
    expect(result.availableSpendingLow).toBe(10);
    expect(result.availableSpendingHigh).toBe(10);
  });

  it('calculates a sustainable spending range from post-FFP volatility', () => {
    const result = runScenario3({
      wealthAtFFP: 100,
      u_post: 0.5,
      mu: 0.1,
      r_f: 0,
      sigma_post: 0.2,
      retirementDuration: 10,
      assets: [],
    });

    expect(result.availableSpendingLow).toBeLessThan(
      result.availableSpending,
    );
    expect(result.availableSpending).toBeLessThan(
      result.availableSpendingHigh,
    );
  });
});

describe('buildScenario1WealthProjection', () => {
  it('returns yearly wealth points from current age through FFP age', () => {
    const projection = buildScenario1WealthProjection({
      currentSavings: 100,
      currentAge: 30,
      ffpAge: 32,
      stages: [
        {
          startAge: 30,
          endAge: 32,
          initialAnnualSaving: 50,
          growthRate: 0,
        },
      ],
      u_pre: 0,
      mu_pre: 0,
      r_f_pre: 0,
      sigma_pre: 0,
    });

    expect(projection).toEqual([
      { age: 30, wealthLow: 100, wealthExpected: 100, wealthHigh: 100 },
      { age: 31, wealthLow: 150, wealthExpected: 150, wealthHigh: 150 },
      { age: 32, wealthLow: 200, wealthExpected: 200, wealthHigh: 200 },
    ]);
  });
});

describe('buildScenario2WealthProjection', () => {
  it('returns yearly wealth ranges and required wealth until the conservative goal age', () => {
    const projection = buildScenario2WealthProjection({
      currentSavings: 100,
      currentAge: 30,
      lifeExpectancy: 32,
      outputFfpAgeLow: 31,
      stages: [
        {
          startAge: 30,
          endAge: 32,
          initialAnnualSaving: 50,
          growthRate: 0,
        },
      ],
      annualSpending: 80,
      u_pre: 0,
      u_post: 0,
      mu_pre: 0,
      r_f_pre: 0,
      sigma_pre: 0,
      mu_post: 0,
      r_f_post: 0,
    });

    expect(projection).toEqual([
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
    ]);
  });

  it('calculates different FFP ages for low, expected, and high returns', () => {
    const ages = estimateFFPAgeRange({
      currentSavings: 100,
      currentAge: 30,
      lifeExpectancy: 40,
      stages: [
        {
          startAge: 30,
          endAge: 40,
          initialAnnualSaving: 20,
          growthRate: 0,
        },
      ],
      annualSpending: 50,
      u_pre: 1,
      u_post: 0,
      mu_pre: 0.1,
      r_f_pre: 0,
      sigma_pre: 0.1,
      mu_post: 0,
      r_f_post: 0,
    });

    expect(ages.high).not.toBeNull();
    expect(ages.expected).not.toBeNull();
    expect(ages.low).not.toBeNull();
    expect(ages.high!).toBeLessThanOrEqual(ages.expected!);
    expect(ages.expected!).toBeLessThanOrEqual(ages.low!);
  });

  it('does not project an unreachable FFP path into the zero-retirement-year boundary', () => {
    const projection = buildScenario2WealthProjection({
      currentSavings: 0,
      currentAge: 30,
      lifeExpectancy: 32,
      outputFfpAgeLow: null,
      stages: [
        {
          startAge: 30,
          endAge: 32,
          initialAnnualSaving: 0,
          growthRate: 0,
        },
      ],
      annualSpending: 100,
      u_pre: 0,
      u_post: 0,
      mu_pre: 0,
      r_f_pre: 0,
      sigma_pre: 0,
      mu_post: 0,
      r_f_post: 0,
    });

    expect(projection.map((point) => point.age)).toEqual([30, 31]);
  });
});

describe('buildScenario3RetirementCashflow', () => {
  it('returns yearly retirement wealth points using the scenario 3 spending model', () => {
    const cashflow = buildScenario3RetirementCashflow({
      wealthAtFFP: 100,
      annualSpending: 10,
      lifeExpectancy: 32,
      ffpAge: 30,
      u_post: 0,
      mu: 0,
      r_f: 0,
      sigma_post: 0,
      assets: [],
    });

    expect(cashflow).toEqual([
      { age: 30, wealthLow: 100, wealthExpected: 100, wealthHigh: 100 },
      { age: 31, wealthLow: 90, wealthExpected: 90, wealthHigh: 90 },
      { age: 32, wealthLow: 80, wealthExpected: 80, wealthHigh: 80 },
    ]);
  });

  it('returns low, expected, and high post-FFP return paths', () => {
    const cashflow = buildScenario3RetirementCashflow({
      wealthAtFFP: 100,
      annualSpending: 10,
      lifeExpectancy: 31,
      ffpAge: 30,
      u_post: 0.5,
      mu: 0.1,
      r_f: 0,
      sigma_post: 0.2,
      assets: [],
    });

    expect(cashflow[1]?.age).toBe(31);
    expect(cashflow[1]?.wealthLow).toBeCloseTo(85);
    expect(cashflow[1]?.wealthExpected).toBeCloseTo(95);
    expect(cashflow[1]?.wealthHigh).toBeCloseTo(105);
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

  it('auto-expands the search upper bound for large terminal-stage targets', () => {
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
      targetWealth: 4_000_000_000,
      currentSavings: 0,
      currentAge: 30,
      ffpAge: 32,
      portfolioReturn: 0,
      stages,
      terminalStageIndex: 1,
    });

    expect(required).toBeCloseTo(4_000_000_000, 2);
  });
});

describe('runScenario4', () => {
  it('projects wealth with a constant annual saving before FFP', () => {
    const wealth = projectWealthBeforeFFPWithConstantSaving({
      currentSavings: 100,
      currentAge: 30,
      ffpAge: 32,
      portfolioReturn: 0,
      annualSaving: 50,
    });

    expect(wealth).toBe(200);
  });

  it('computes required wealth at FFP from post-FFP spending needs', () => {
    const requiredWealthAtFFP = calculateScenario4RequiredWealthAtFFP({
      inputAnnualSpending: 100,
      portfolioReturnPost: 0,
      retirementDuration: 2,
    });

    expect(requiredWealthAtFFP).toBe(200);
  });

  it('solves the constant annual saving with binary search', () => {
    const requiredAnnualSaving = solveScenario4RequiredAnnualSaving({
      targetWealth: 200,
      currentSavings: 100,
      currentAge: 30,
      ffpAge: 32,
      portfolioReturnPre: 0,
    });

    expect(requiredAnnualSaving).toBeCloseTo(50, 2);
  });

  it('auto-expands the search upper bound for large required savings', () => {
    const requiredAnnualSaving = solveScenario4RequiredAnnualSaving({
      targetWealth: 4_000_000_000,
      currentSavings: 0,
      currentAge: 30,
      ffpAge: 32,
      portfolioReturnPre: 0,
    });

    expect(requiredAnnualSaving).toBeCloseTo(2_000_000_000, 2);
  });

  it('returns near-zero saving when no spending is required', () => {
    const result = runScenario4({
      currentSavings: 0,
      currentAge: 30,
      ffpAge: 31,
      inputAnnualSpending: 0,
      retirementDuration: 1,
      u_pre: 0,
      u_post: 0,
      mu_pre: 0,
      r_f_pre: 0,
      mu_post: 0,
      r_f_post: 0,
    });

    expect(result.requiredAnnualSaving).toBeLessThanOrEqual(0.01);
    expect(result.requiredWealthAtFFPAge).toBe(0);
    expect(result.ffpAge).toBe(31);
  });

  it('matches the business example with exact zero-return math', () => {
    const result = runScenario4({
      currentSavings: 100,
      currentAge: 30,
      ffpAge: 32,
      inputAnnualSpending: 100,
      retirementDuration: 2,
      u_pre: 0,
      u_post: 0,
      mu_pre: 0,
      r_f_pre: 0,
      mu_post: 0,
      r_f_post: 0,
    });

    expect(result.requiredWealthAtFFPAge).toBe(200);
    expect(result.requiredAnnualSaving).toBeCloseTo(50, 2);
    expect(result.ffpAge).toBe(32);
  });

  it('uses post-FFP return inputs when computing required wealth', () => {
    const result = runScenario4({
      currentSavings: 0,
      currentAge: 30,
      ffpAge: 31,
      inputAnnualSpending: 100,
      retirementDuration: 1,
      u_pre: 0,
      u_post: 1,
      mu_pre: 0,
      r_f_pre: 0,
      mu_post: 0.1,
      r_f_post: 0,
    });

    expect(result.requiredWealthAtFFPAge).toBeCloseTo(90.9091, 4);
    expect(result.requiredAnnualSaving).toBeCloseTo(90.9091, 4);
  });

  it('throws when ffpAge is invalid', () => {
    expect(() =>
      runScenario4({
        currentSavings: 0,
        currentAge: 30,
        ffpAge: 29,
        inputAnnualSpending: 10,
        retirementDuration: 10,
        u_pre: 0,
        u_post: 0,
        mu_pre: 0,
        r_f_pre: 0,
        mu_post: 0,
        r_f_post: 0,
      }),
    ).toThrow(/Invalid ffpAge/);
  });
});
