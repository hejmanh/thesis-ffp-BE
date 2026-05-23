export function validatePortfolioAllocation(u: number): boolean {
  return u >= 0 && u <= 1;
}

export function validateGrowthRate(rate: number): boolean {
  return rate >= 0;
}

export function validateFFPAge(
  currentAge: number,
  ffpAge: number,
  lifeExpectancy: number,
): boolean {
  return ffpAge >= currentAge && ffpAge <= lifeExpectancy;
}
