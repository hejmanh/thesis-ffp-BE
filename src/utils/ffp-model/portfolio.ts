export function calculatePortfolioReturn(
  u: number,
  mu: number,
  r_f: number,
): number {
  return u * mu + (1 - u) * r_f;
}

export function calculatePortfolioVolatility(
  u: number,
  sigma: number,
): number {
  return u * sigma;
}
