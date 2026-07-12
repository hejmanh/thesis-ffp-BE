import { badRequest } from '@/utils/error.js';
import type { LifeStage } from '@/types/ffp-model/financial.js';
import type { StageDataDetails } from '@/modules/registration/registration.repository.js';

/**
 * Maps profile stage data into FFP LifeStages clipped to lifeExpectancy.
 * Stages that begin at or after LE are dropped; the last kept stage ends at LE.
 * Only this clipped list should be used for further calculation.
 */
export const toLifeStages = (
  stageDetails: StageDataDetails[],
  lifeExpectancy: number,
): LifeStage[] => {
  const normalized = stageDetails.map((stage) => {
    if (stage.beginningAge == null) {
      throw badRequest('Stage beginningAge is required');
    }
    if (stage.initialAnnualSavings == null) {
      throw badRequest('Stage initialAnnualSavings is required');
    }
    if (stage.growthRate == null) {
      throw badRequest('Stage growthRate is required');
    }

    return {
      beginningAge: stage.beginningAge,
      endingAge: stage.endingAge,
      initialAnnualSavings: stage.initialAnnualSavings,
      growthRate: stage.growthRate,
    };
  });

  const sorted = [...normalized].sort(
    (a, b) => a.beginningAge - b.beginningAge,
  );

  const applicable = sorted.filter(
    (stage) => stage.beginningAge < lifeExpectancy,
  );

  if (applicable.length === 0) {
    throw badRequest('No life stages fall within life expectancy');
  }

  return applicable.map((stage, index) => {
    const isLast = index === applicable.length - 1;

    let endAge: number | null;
    if (isLast) {
      endAge =
        stage.endingAge == null ? lifeExpectancy : lifeExpectancy + 1;
    } else if (stage.endingAge == null) {
      endAge = null;
    } else {
      endAge = stage.endingAge + 1;
    }

    if (endAge == null) {
      throw badRequest('Only the last stage can have a null endingAge');
    }
    if (endAge <= stage.beginningAge) {
      throw badRequest('Stage endingAge must be greater than beginningAge');
    }

    if (index > 0) {
      const prev = applicable[index - 1]!;
      if (prev.endingAge == null) {
        throw badRequest('Only the last stage can have a null endingAge');
      }
      if (prev.endingAge + 1 !== stage.beginningAge) {
        throw badRequest('Stages must be contiguous and non-overlapping');
      }
    }

    return {
      startAge: stage.beginningAge,
      endAge,
      initialAnnualSaving: stage.initialAnnualSavings,
      growthRate: stage.growthRate,
    };
  });
};
