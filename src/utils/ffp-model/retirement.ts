/**
 * Calculates required wealth to sustain spending over retirementDuration.
 * Constraints: retirementDuration >= 0 and returnRate > -1.
 */
export function calculateRequiredWealth(
  annualSpending: number,
  returnRate: number,
  retirementDuration: number,
): number {
  if (retirementDuration < 0) {
    throw new Error('retirementDuration must be >= 0');
  }
  if (returnRate <= -1) {
    throw new Error('returnRate must be > -1');
  }
  if (returnRate === 0) {
    return annualSpending * retirementDuration;
  }

  return (
    annualSpending *
    ((1 - Math.pow(1 + returnRate, -retirementDuration)) / returnRate)
  );
}

/**
 * Calculates sustainable annual spending given wealth and passive income.
 * Constraints: retirementDuration >= 0 and returnRate > -1.
 */
export function calculateAvailableSpending(
  wealthAtFFP: number,
  returnRate: number,
  retirementDuration: number,
  passiveIncome: number = 0,
): number {
  if (retirementDuration < 0) {
    throw new Error('retirementDuration must be >= 0');
  }
  if (returnRate <= -1) {
    throw new Error('returnRate must be > -1');
  }
  if (retirementDuration <= 0) return 0;

  let wealthBasedSpending = 0;

  if (returnRate === 0) {
    wealthBasedSpending = wealthAtFFP / retirementDuration;
  } else {
    wealthBasedSpending =
      (wealthAtFFP * returnRate) /
      (1 - Math.pow(1 + returnRate, -retirementDuration));
  }

  return wealthBasedSpending + passiveIncome;
}
