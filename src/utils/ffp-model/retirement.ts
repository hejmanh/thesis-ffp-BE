export function calculateRequiredWealth(
  annualSpending: number,
  returnRate: number,
  retirementDuration: number,
): number {
  if (returnRate === 0) {
    return annualSpending * retirementDuration;
  }

  return (
    annualSpending *
    ((1 - Math.pow(1 + returnRate, -retirementDuration)) / returnRate)
  );
}

export function calculateAvailableSpending(
  wealthAtFFP: number,
  returnRate: number,
  retirementDuration: number,
  passiveIncome: number = 0,
): number {
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
