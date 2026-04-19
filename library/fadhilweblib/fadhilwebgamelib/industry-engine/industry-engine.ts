import type { CompanyState, GameState, PlayerProfile } from '../business-engine';
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
import { GAME_MATH_EXPRESSIONS, evaluateGameMathExpression, evaluateGameMathProgram } from '../custom-syntax';

export const INDUSTRY_ENGINE_ID = 'animeindustry-v2';

export type IndustryPulse = {
  releaseSignal: number;
  performanceScore: number;
};

export function createInitialIndustryState(profile: Partial<PlayerProfile> = {}): GameState {
  return createInitialGameState({
    ...DEFAULT_PROFILE_DRAFT,
    name: profile.name ?? 'Anime Industry Founder',
    background: profile.background ?? 'Membangun imperium studio anime global dengan strategi bisnis adaptif.',
    ...profile,
  });
}

export function evaluateIndustryPulse(company: CompanyState): IndustryPulse {
  const signalScope = evaluateGameMathProgram(GAME_MATH_EXPRESSIONS.releaseSignalProgram, {
    marketShare: company.marketShare,
    reputation: company.reputation,
    daysSinceRelease: Math.max(0, company.lastReleaseDay),
    launchRevenue: Math.max(0, company.revenuePerDay),
    releaseRating: Math.max(1, company.lastProductScore),
    cpuDelta: company.lastReleaseCpuScore,
    researchPerDay: company.researchPerDay,
  });

  const performanceScore = evaluateGameMathExpression(GAME_MATH_EXPRESSIONS.releasedProductScore, {
    cpuScore: company.bestCpuScore,
    scoreInnovationWeight: 0.52,
    researchPerDay: company.researchPerDay,
    scoreResearchWeight: 18,
    releaseRating: company.lastProductScore,
    scoreReleaseRatingWeight: 0.28,
    fabricationCount: company.teams.fabrication.count,
    scoreFabricationWeight: 12,
    marketingCount: company.teams.marketing.count,
    scoreMarketingWeight: 9,
    priceDiscipline: 2,
  });

  return {
    releaseSignal: signalScope.qualitySignal ?? 0,
    performanceScore,
  };
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
