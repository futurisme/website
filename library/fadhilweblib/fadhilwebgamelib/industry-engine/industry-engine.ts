import type { GameState, PlayerProfile } from '../business-engine';
import {
  COMPANY_KEYS,
  DEFAULT_PROFILE_DRAFT,
  createInitialGameState,
  createCommunityCompanyPlan,
  formatDateFromDays,
  formatMoneyCompact,
  getInvestorHoldingsValue,
  getInvestorWeeklyIncomeEstimate,
  getTradePreview,
  getCompanyValuation,
  getSharePrice,
  investInCommunityPlan,
  investInCompanyPlan,
  requestAppStoreLicense,
  simulateTick,
  transactShares,
  buildProductRankingRows,
  buildRichestPeopleRows,
  buildTopCompanyRankingRows,
  getDisplayCompanies,
  getCompanySelectOptions,
  getTopCompaniesSnapshot,
  runTicksBatched,
  withGameAction,
} from '../business-engine';

export const INDUSTRY_ENGINE_ID = 'animeindustry-v1';

export function createInitialIndustryState(profile: Partial<PlayerProfile> = {}): GameState {
  return createInitialGameState({
    ...DEFAULT_PROFILE_DRAFT,
    name: profile.name ?? 'Anime Industry Founder',
    background: profile.background ?? 'Membangun imperium studio anime global dengan strategi bisnis adaptif.',
    ...profile,
  });
}

export {
  COMPANY_KEYS,
  DEFAULT_PROFILE_DRAFT,
  createInitialGameState,
  createCommunityCompanyPlan,
  formatDateFromDays,
  formatMoneyCompact,
  getInvestorHoldingsValue,
  getInvestorWeeklyIncomeEstimate,
  getTradePreview,
  getCompanyValuation,
  getSharePrice,
  investInCommunityPlan,
  investInCompanyPlan,
  requestAppStoreLicense,
  simulateTick,
  transactShares,
  buildProductRankingRows,
  buildRichestPeopleRows,
  buildTopCompanyRankingRows,
  getDisplayCompanies,
  getCompanySelectOptions,
  getTopCompaniesSnapshot,
  runTicksBatched,
  withGameAction,
};

export type { GameState, PlayerProfile };
