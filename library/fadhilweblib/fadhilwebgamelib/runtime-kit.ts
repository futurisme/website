import type { CompanyKey, GameState } from './business-engine';

export type CompanySnapshot = {
  key: CompanyKey;
  name: string;
  valuation: number;
  sharePrice: number;
  marketShare: number;
};

export function runTicksBatched(game: GameState, ticks: number, simulateTick: (state: GameState) => GameState) {
  let next = game;
  const safeTicks = Number.isFinite(ticks) ? Math.max(0, Math.floor(ticks)) : 0;
  for (let i = 0; i < safeTicks; i += 1) {
    next = simulateTick(next);
  }
  return next;
}

export function getTopCompaniesSnapshot(
  game: GameState,
  getCompanyValuation: (company: GameState['companies'][CompanyKey]) => number,
  getSharePrice: (company: GameState['companies'][CompanyKey]) => number,
  limit = 6
): CompanySnapshot[] {
  return Object.values(game.companies)
    .map((company) => ({
      key: company.key,
      name: company.name,
      valuation: getCompanyValuation(company),
      sharePrice: getSharePrice(company),
      marketShare: company.marketShare,
    }))
    .sort((a, b) => b.valuation - a.valuation)
    .slice(0, Math.max(1, limit));
}

export function getCompanySelectOptions(game: GameState) {
  return Object.values(game.companies).map((company) => ({
    key: company.key,
    label: `${company.name} (${company.key})`,
  }));
}

export function withGameAction<T>(
  game: GameState,
  action: (state: GameState) => GameState,
  onSuccess: (next: GameState) => T,
  onNoop: () => T
) {
  const next = action(game);
  if (next === game) return onNoop();
  return onSuccess(next);
}
