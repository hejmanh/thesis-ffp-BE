import { describe, expect, it } from 'vitest';
import type { StageDataDetails } from '@/modules/registration/registration.repository.js';
import { toLifeStages } from './life-stages.js';

const seedStages = (): StageDataDetails[] => [
  {
    lifeStageRangeId: 1,
    stageNo: 1,
    title: 'Infancy',
    beginningAge: 0,
    endingAge: 2,
    initialAnnualSavings: 0,
    growthRate: 0,
  },
  {
    lifeStageRangeId: 2,
    stageNo: 2,
    title: 'Childhood',
    beginningAge: 3,
    endingAge: 8,
    initialAnnualSavings: 0,
    growthRate: 0,
  },
  {
    lifeStageRangeId: 3,
    stageNo: 3,
    title: 'Adolescence',
    beginningAge: 9,
    endingAge: 18,
    initialAnnualSavings: 0,
    growthRate: 0,
  },
  {
    lifeStageRangeId: 4,
    stageNo: 4,
    title: 'Early Adulthood',
    beginningAge: 19,
    endingAge: 45,
    initialAnnualSavings: 1000,
    growthRate: 0.02,
  },
  {
    lifeStageRangeId: 5,
    stageNo: 5,
    title: 'Middle Adulthood',
    beginningAge: 46,
    endingAge: 65,
    initialAnnualSavings: 2000,
    growthRate: 0.01,
  },
  {
    lifeStageRangeId: 6,
    stageNo: 6,
    title: 'Later Adulthood',
    beginningAge: 66,
    endingAge: null,
    initialAnnualSavings: 500,
    growthRate: 0,
  },
];

describe('toLifeStages', () => {
  it('clips to Desired LE = 20 (0-2, 3-8, 9-18, 19-20)', () => {
    const stages = toLifeStages(seedStages(), 20);

    expect(stages).toEqual([
      {
        startAge: 0,
        endAge: 3,
        initialAnnualSaving: 0,
        growthRate: 0,
      },
      {
        startAge: 3,
        endAge: 9,
        initialAnnualSaving: 0,
        growthRate: 0,
      },
      {
        startAge: 9,
        endAge: 19,
        initialAnnualSaving: 0,
        growthRate: 0,
      },
      {
        startAge: 19,
        endAge: 21,
        initialAnnualSaving: 1000,
        growthRate: 0.02,
      },
    ]);
  });

  it('clips to Estimated LE = 59 (0-2, 3-8, 9-18, 19-45, 46-59)', () => {
    const stages = toLifeStages(seedStages(), 59);

    expect(stages).toEqual([
      {
        startAge: 0,
        endAge: 3,
        initialAnnualSaving: 0,
        growthRate: 0,
      },
      {
        startAge: 3,
        endAge: 9,
        initialAnnualSaving: 0,
        growthRate: 0,
      },
      {
        startAge: 9,
        endAge: 19,
        initialAnnualSaving: 0,
        growthRate: 0,
      },
      {
        startAge: 19,
        endAge: 46,
        initialAnnualSaving: 1000,
        growthRate: 0.02,
      },
      {
        startAge: 46,
        endAge: 60,
        initialAnnualSaving: 2000,
        growthRate: 0.01,
      },
    ]);
  });

  it('keeps open-ended last stage ending at LE when LE is beyond 66', () => {
    const stages = toLifeStages(seedStages(), 80);
    const last = stages[stages.length - 1]!;

    expect(stages).toHaveLength(6);
    expect(last).toEqual({
      startAge: 66,
      endAge: 80,
      initialAnnualSaving: 500,
      growthRate: 0,
    });
  });

  it('rejects non-contiguous kept stages', () => {
    expect(() =>
      toLifeStages(
        [
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
        ],
        80,
      ),
    ).toThrow('Stages must be contiguous and non-overlapping');
  });

  it('rejects when no stages fall within LE', () => {
    expect(() =>
      toLifeStages(
        [
          {
            lifeStageRangeId: 1,
            stageNo: 1,
            title: 'Later',
            beginningAge: 66,
            endingAge: null,
            initialAnnualSavings: 0,
            growthRate: 0,
          },
        ],
        20,
      ),
    ).toThrow('No life stages fall within life expectancy');
  });
});
