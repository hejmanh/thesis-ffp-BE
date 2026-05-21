import type { LifeStage } from '@/types/ffp-model/financial.js';

type HasBeginningAge = {
  beginningAge: number | null;
};

export const adjustFirstBeginningAge = <T extends HasBeginningAge>(
  ranges: T[],
  newBeginningAge: number,
) => {
  if (ranges.length === 0) return ranges;

  const [first, ...rest] = ranges;
  const updatedFirst = { ...first, beginningAge: newBeginningAge } as T;
  return [updatedFirst, ...rest];
};

export function calculateAnnualSaving(
  initialSaving: number,
  growthRate: number,
  yearsFromStageStart: number,
): number {
  return initialSaving * Math.pow(1 + growthRate, yearsFromStageStart);
}

export function getLifeStageByAge(
  age: number,
  stages: LifeStage[],
): LifeStage | null {
  return (
    stages.find((stage) => age >= stage.startAge && age < stage.endAge) || null
  );
}

export function calculateSavingAtAge(age: number, stages: LifeStage[]): number {
  const stage = getLifeStageByAge(age, stages);

  if (!stage) return 0;

  const yearsFromStageStart = age - stage.startAge;

  return calculateAnnualSaving(
    stage.initialAnnualSaving,
    stage.growthRate,
    yearsFromStageStart,
  );
}