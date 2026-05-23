import type { PassiveIncomeAsset } from '@/types/ffp-model/financial.js';

export function calculateAssetIncome(
  initialIncome: number,
  growthRate: number,
  yearsAfterFFP: number,
): number {
  return initialIncome * Math.pow(1 + growthRate, yearsAfterFFP);
}

export function calculateTotalPassiveIncome(
  assets: PassiveIncomeAsset[],
  yearsAfterFFP: number,
): number {
  return assets.reduce((total, asset) => {
    return (
      total +
      calculateAssetIncome(asset.initialIncome, asset.growthRate, yearsAfterFFP)
    );
  }, 0);
}
