import {
  DEFAULT_PROFILE_DRAFT,
  GAME_MATH_EXPRESSIONS,
  buildTopCompanyRankingRows,
  createInitialGameState,
  evaluateGameMathExpression,
  formatDateFromDays,
  formatMoneyCompact,
  runTicksBatched,
  simulateTick,
} from '/games/animeindustry/anime-engine.bundle.js';

function createGame() {
  return createInitialGameState({
    ...DEFAULT_PROFILE_DRAFT,
    name: 'Anime Industry Founder',
    background: 'Membangun studio anime global dengan strategi katalog lintas genre.',
  });
}

function computeIndustryPulse(game) {
  const leadCompany = Object.values(game.companies).sort((a, b) => b.marketShare - a.marketShare)[0];
  if (!leadCompany) return 0;
  return evaluateGameMathExpression(GAME_MATH_EXPRESSIONS.releasedProductScore, {
    cpuScore: leadCompany.bestCpuScore,
    scoreInnovationWeight: 0.52,
    researchPerDay: leadCompany.researchPerDay,
    scoreResearchWeight: 18,
    releaseRating: leadCompany.lastProductScore,
    scoreReleaseRatingWeight: 0.28,
    fabricationCount: leadCompany.teams.fabrication.count,
    scoreFabricationWeight: 12,
    marketingCount: leadCompany.teams.marketing.count,
    scoreMarketingWeight: 9,
    priceDiscipline: 2,
  });
}

function createSnapshot(game) {
  return {
    dayLabel: formatDateFromDays(game.elapsedDays),
    playerCashLabel: formatMoneyCompact(game.player.cash),
    tickCount: game.tickCount,
    feed: game.activityFeed.slice(-7).reverse(),
    topCompanies: buildTopCompanyRankingRows(game).slice(0, 6),
    industryPulse: computeIndustryPulse(game),
  };
}

export function createAnimeIndustryRuntime() {
  let game = createGame();
  let timer = null;

  return {
    tick(count = 1) {
      game = count === 1 ? simulateTick(game) : runTicksBatched(game, count);
      return game;
    },
    reset() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      game = createGame();
      return game;
    },
    snapshot() {
      return createSnapshot(game);
    },
    toggleAuto(onFrame) {
      if (timer) {
        clearInterval(timer);
        timer = null;
        return false;
      }
      timer = setInterval(() => {
        game = simulateTick(game);
        onFrame(createSnapshot(game));
      }, 320);
      return true;
    },
  };
}
