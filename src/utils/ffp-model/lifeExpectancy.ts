export function calculateCurrentAge(
  birthYear: number,
  currentYear: number = new Date().getFullYear(),
): number {
  return currentYear - birthYear;
}

export function calculateRetirementDuration(
  lifeExpectancy: number,
  ffpAge: number,
): number {
  return lifeExpectancy - ffpAge;
}

export function validateLifeExpectancy(value: number): boolean {
  return value >= 1 && value <= 150;
}
