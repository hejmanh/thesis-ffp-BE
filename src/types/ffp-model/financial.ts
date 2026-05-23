export interface LifeStage {
  startAge: number;
  endAge: number;
  initialAnnualSaving: number;
  growthRate: number;
}

export interface PortfolioAllocation {
  u: number;
  mu: number;
  r_f: number;
}

export interface PassiveIncomeAsset {
  type: string;
  initialIncome: number;
  growthRate: number;
}