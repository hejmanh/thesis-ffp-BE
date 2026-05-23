export function calculatePortfolioReturn(
  u: number,
  mu: number,
  r_f: number,
): number {
  return u * mu + (1 - u) * r_f;
}
