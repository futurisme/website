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

export const INDUSTRY_ENGINE_ID = 'animeindustry-v3';

export type AnimeProjectStage =
  | 'ideation'
  | 'manga_serialization'
  | 'pitching'
  | 'committee_setup'
  | 'preproduction'
  | 'production'
  | 'postproduction'
  | 'release'
  | 'completed';

export type IndustryPulse = {
  releaseSignal: number;
  performanceScore: number;
  readinessScore: number;
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

  const readinessScore = evaluateGameMathExpression(
    'max(0, releaseRating*0.62 + researchPerDay*1.4 + marketingCount*0.9 + fabricationCount*0.8 - capitalStrain*8)',
    {
      releaseRating: company.lastProductScore,
      researchPerDay: company.researchPerDay,
      marketingCount: company.teams.marketing.count,
      fabricationCount: company.teams.fabrication.count,
      capitalStrain: company.capitalStrain,
    },
  );

  return {
    releaseSignal: signalScope.qualitySignal ?? 0,
    performanceScore,
    readinessScore,
  };
}

export function nextAnimeStage(currentStage: AnimeProjectStage, readinessScore: number): AnimeProjectStage {
  if (currentStage === 'ideation' && readinessScore >= 18) return 'manga_serialization';
  if (currentStage === 'manga_serialization' && readinessScore >= 32) return 'pitching';
  if (currentStage === 'pitching' && readinessScore >= 40) return 'committee_setup';
  if (currentStage === 'committee_setup' && readinessScore >= 48) return 'preproduction';
  if (currentStage === 'preproduction' && readinessScore >= 58) return 'production';
  if (currentStage === 'production' && readinessScore >= 72) return 'postproduction';
  if (currentStage === 'postproduction' && readinessScore >= 80) return 'release';
  if (currentStage === 'release' && readinessScore >= 86) return 'completed';
  return currentStage;
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
