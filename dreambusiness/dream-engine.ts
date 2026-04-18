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
} from '../mindmapmaker/src/features/gameplay/simulation-engine';

export {
  getCompanySelectOptions,
  getTopCompaniesSnapshot,
  runTicksBatched,
  withGameAction,
} from '../library/fadhilweblib/fadhilwebgamelib/runtime-kit';
