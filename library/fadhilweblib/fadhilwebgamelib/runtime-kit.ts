import type { CompanyKey, GameState } from './business-engine';

export type CompanySnapshot = {
  key: CompanyKey;
  name: string;
  valuation: number;
  sharePrice: number;
  marketShare: number;
};

export type DisplayCompany = {
  key: CompanyKey;
  slotId: string;
  name: string;
  company: GameState['companies'][CompanyKey];
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

export function getDisplayCompanies(game: GameState, maxSlots = 10): DisplayCompany[] {
  return getCompanySelectOptions(game)
    .slice(0, Math.max(1, maxSlots))
    .map((item, index) => ({
      key: item.key,
      slotId: String(index + 1),
      name: game.companies[item.key].name,
      company: game.companies[item.key],
    }));
}

export function buildTopCompanyRankingRows(
  game: GameState,
  getCompanyValuation: (company: GameState['companies'][CompanyKey]) => number,
  getSharePrice: (company: GameState['companies'][CompanyKey]) => number,
  maxRows = 10
) {
  return getTopCompaniesSnapshot(game, getCompanyValuation, getSharePrice, maxRows)
    .map((row, index) => ({
      rank: index + 1,
      name: row.name,
      valuation: row.valuation,
      sharePrice: row.sharePrice,
      marketShare: row.marketShare,
      key: row.key,
    }));
}

export function buildRichestPeopleRows(
  game: GameState,
  getInvestorHoldingsValue: (state: GameState, investorId: string) => number,
  maxRows = 10
) {
  return [
    { id: game.player.id, name: game.player.name },
    ...game.npcs.map((npc) => ({ id: npc.id, name: npc.name })),
  ]
    .map((investor) => {
      const holdings = getInvestorHoldingsValue(game, investor.id);
      const cash = investor.id === game.player.id ? game.player.cash : (game.npcs.find((npc) => npc.id === investor.id)?.cash ?? 0);
      return {
        rank: 0,
        name: investor.name,
        holdings,
        cash,
        total: holdings + cash,
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, Math.max(1, maxRows))
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export function buildProductRankingRows(
  game: GameState,
  getCompanyValuation: (company: GameState['companies'][CompanyKey]) => number,
  maxRows = 10
) {
  return getDisplayCompanies(game, maxRows)
    .map((slot) => {
      const company = slot.company;
      const score = (
        getCompanyValuation(company) * 0.25
        + company.marketShare * 20
        + company.reputation * 8
        + company.releaseCount * 40
        + company.researchPerDay * 30
      );
      return {
        rank: 0,
        name: company.name,
        score,
        releaseCount: company.releaseCount,
        reputation: company.reputation,
        key: company.key,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, maxRows))
    .map((row, index) => ({ ...row, rank: index + 1 }));
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
