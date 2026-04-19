import {
  evaluateGameMathExpression,
  evaluateGameMathProgram,
  formatDateFromDays,
  formatMoneyCompact,
} from '/games/animeindustry/anime-engine.bundle.js';

const STAGES = Object.freeze([
  'ideation',
  'manga_serialization',
  'pitching',
  'committee_setup',
  'preproduction',
  'production',
  'postproduction',
  'release',
  'completed',
]);

const STUDIO_POOL = Object.freeze([
  { id: 'st-kagayaki', name: 'Kagayaki Pictures', craft: 72, speed: 58, network: 69 },
  { id: 'st-sora', name: 'Sora Animation Lab', craft: 80, speed: 46, network: 55 },
  { id: 'st-tsubasa', name: 'Tsubasa Works', craft: 62, speed: 74, network: 51 },
  { id: 'st-kairo', name: 'Kairo Visual Dynamics', craft: 69, speed: 67, network: 73 },
]);

const INVESTOR_POOL = Object.freeze([
  { id: 'inv-pub', name: 'Penerbit', influence: 72, risk: 45 },
  { id: 'inv-tv', name: 'TV Network', influence: 81, risk: 38 },
  { id: 'inv-stream', name: 'Platform Streaming', influence: 88, risk: 66 },
  { id: 'inv-music', name: 'Label Musik', influence: 57, risk: 41 },
  { id: 'inv-merch', name: 'Merch Partner', influence: 62, risk: 59 },
]);

function pick(arr, seed) {
  return arr[Math.abs(seed) % arr.length];
}

function createProject(id, day) {
  const genre = pick(['Action', 'Fantasy', 'Slice of Life', 'Mystery', 'Sci-Fi'], id.length + day);
  return {
    id,
    title: `Project ${id.slice(-4).toUpperCase()}`,
    genre,
    stage: 'ideation',
    popularity: 10,
    scriptQuality: 12,
    chapters: 0,
    studioId: null,
    committeeIds: [],
    budgetNeed: 12_000_000,
    securedBudget: 0,
    productionProgress: 0,
    episodePlan: 12,
    delayRisk: 0.18,
    distributionHeat: 8,
    releaseScore: 0,
    animeReleased: false,
    archived: false,
  };
}

function computeStageScore(project, market) {
  const program = 'core=story*0.52+chapters*1.6+popularity*0.94;marketFit=core+trend*0.76-risk*42';
  const scope = evaluateGameMathProgram(program, {
    story: project.scriptQuality,
    chapters: project.chapters,
    popularity: project.popularity,
    trend: market.trend,
    risk: project.delayRisk,
  });
  return scope.marketFit ?? 0;
}

function computeReleaseScore(project, studio, market) {
  return evaluateGameMathExpression(
    'max(1,script*0.64 + popularity*0.48 + studioCraft*0.33 + studioNetwork*0.28 + committee*0.19 + trend*7.2 - delayRisk*17)',
    {
      script: project.scriptQuality,
      popularity: project.popularity,
      studioCraft: studio?.craft ?? 40,
      studioNetwork: studio?.network ?? 30,
      committee: project.committeeIds.length,
      trend: market.trend,
      delayRisk: project.delayRisk,
    },
  );
}

function createInitialState() {
  return {
    day: 0,
    cash: 35_000_000,
    reputation: 22,
    market: { trend: 1.0, audienceFatigue: 0.1 },
    projects: [createProject(`manga-${Date.now().toString(36).slice(-6)}`, 0)],
    studios: STUDIO_POOL,
    investors: INVESTOR_POOL,
    releases: [],
    feed: ['Day 0: Studio indie manga didirikan.'],
    debug: { lastAction: 'bootstrap' },
  };
}

function log(state, message) {
  state.feed.push(`Day ${state.day}: ${message}`);
  if (state.feed.length > 120) state.feed.splice(0, state.feed.length - 120);
}

function applyMarketDrift(state) {
  const wave = Math.sin(state.day / 17) * 0.18;
  state.market.trend = Math.max(0.55, Math.min(1.55, 1 + wave - state.market.audienceFatigue * 0.12));
  state.market.audienceFatigue = Math.max(0.05, Math.min(0.72, state.market.audienceFatigue + 0.002));
}

function byId(state, projectId) {
  return state.projects.find((project) => project.id === projectId && !project.archived) || null;
}

export function createAnimeIndustryRuntime() {
  let state = createInitialState();
  let timer = null;

  function withAction(action, handler) {
    try {
      const result = handler();
      state.debug.lastAction = action;
      return result;
    } catch (error) {
      state.debug.lastAction = `${action}:failed`;
      if (window.fadhilAnimeDebugger?.report) {
        window.fadhilAnimeDebugger.report('interaction-error', {
          action,
          message: error instanceof Error ? error.message : String(error),
        });
      }
      return false;
    }
  }

  function tick(days = 1) {
    for (let i = 0; i < days; i += 1) {
      state.day += 1;
      applyMarketDrift(state);
      state.projects.forEach((project) => {
        if (project.stage === 'production' || project.stage === 'postproduction') {
          const studio = state.studios.find((entry) => entry.id === project.studioId);
          const speed = (studio?.speed ?? 50) / 100;
          project.productionProgress = Math.min(100, project.productionProgress + 1.5 + speed * 2.8);
          project.delayRisk = Math.max(0.03, project.delayRisk - 0.002 + (state.market.audienceFatigue - 0.2) * 0.001);
          if (project.productionProgress >= 100 && project.stage === 'production') {
            project.stage = 'postproduction';
            log(state, `${project.title} masuk tahap post-production.`);
          }
        }
      });
    }
    return state;
  }

  function brainstormProject() {
    return withAction('brainstorm-project', () => {
      const project = createProject(`manga-${(Math.random() * 1e9).toFixed(0)}`, state.day);
      state.projects.push(project);
      state.cash -= 250_000;
      log(state, `Konsep manga baru dibuat: ${project.title} (${project.genre}).`);
      return true;
    });
  }

  function serializeChapter(projectId) {
    return withAction('serialize-chapter', () => {
      const project = byId(state, projectId);
      if (!project) return false;
      if (!['ideation', 'manga_serialization'].includes(project.stage)) return false;
      project.stage = 'manga_serialization';
      project.chapters += 1;
      project.scriptQuality = Math.min(100, project.scriptQuality + 1.8);
      project.popularity = Math.min(100, project.popularity + Math.max(1, 2.4 - state.market.audienceFatigue));
      state.cash -= 120_000;
      if (project.chapters % 6 === 0) {
        state.reputation = Math.min(100, state.reputation + 1);
        log(state, `${project.title} trending setelah chapter ${project.chapters}.`);
      }
      return true;
    });
  }

  function pitchToStudio(projectId) {
    return withAction('pitch-to-studio', () => {
      const project = byId(state, projectId);
      if (!project || project.stage === 'committee_setup') return false;
      if (project.chapters < 8) return false;
      const score = computeStageScore(project, state.market);
      const studio = [...state.studios].sort((a, b) => b.network - a.network)[Math.floor(state.day % state.studios.length)];
      if (score < 38) {
        log(state, `${project.title} ditolak ${studio.name}; minta material manga lebih kuat.`);
        project.popularity = Math.max(0, project.popularity - 1);
        return false;
      }
      project.stage = 'pitching';
      project.studioId = studio.id;
      project.delayRisk = Math.max(0.08, project.delayRisk - 0.03);
      log(state, `${project.title} dilirik ${studio.name} dan masuk negosiasi adaptasi anime.`);
      return true;
    });
  }

  function formCommittee(projectId) {
    return withAction('form-committee', () => {
      const project = byId(state, projectId);
      if (!project || !project.studioId || !['pitching', 'committee_setup'].includes(project.stage)) return false;
      project.stage = 'committee_setup';
      const needed = 3;
      while (project.committeeIds.length < needed) {
        const candidate = state.investors[(state.day + project.committeeIds.length) % state.investors.length];
        if (!project.committeeIds.includes(candidate.id)) project.committeeIds.push(candidate.id);
      }
      const raised = project.committeeIds.reduce((sum, id) => {
        const inv = state.investors.find((entry) => entry.id === id);
        return sum + (inv ? 2_500_000 + inv.influence * 8_000 : 0);
      }, 0);
      project.securedBudget = Math.min(project.budgetNeed, raised);
      state.cash += Math.floor(raised * 0.2);
      log(state, `Komite produksi ${project.title} terbentuk dengan ${project.committeeIds.length} anggota.`);
      return true;
    });
  }

  function startProduction(projectId) {
    return withAction('start-production', () => {
      const project = byId(state, projectId);
      if (!project || project.stage === 'release') return false;
      if (project.securedBudget < project.budgetNeed * 0.78) return false;
      if (project.stage === 'committee_setup') project.stage = 'preproduction';
      if (project.stage === 'preproduction') {
        project.stage = 'production';
        state.cash -= 1_850_000;
        log(state, `Produksi anime ${project.title} resmi dimulai oleh studio.`);
        return true;
      }
      return false;
    });
  }

  function launchAnime(projectId) {
    return withAction('launch-anime', () => {
      const project = byId(state, projectId);
      if (!project || !['postproduction', 'release'].includes(project.stage)) return false;
      const studio = state.studios.find((entry) => entry.id === project.studioId);
      const score = computeReleaseScore(project, studio, state.market);
      project.releaseScore = score;
      project.stage = 'completed';
      project.animeReleased = true;
      project.archived = true;
      const revenue = Math.floor(2_800_000 + score * 92_000);
      state.cash += revenue;
      state.reputation = Math.min(100, state.reputation + (score >= 88 ? 8 : score >= 65 ? 5 : 2));
      state.market.audienceFatigue = Math.max(0.08, state.market.audienceFatigue - 0.06);
      state.releases.push({
        id: project.id,
        title: project.title,
        score,
        revenue,
        studio: studio?.name ?? 'Unknown Studio',
        day: state.day,
      });
      log(state, `${project.title} tayang! score ${score.toFixed(1)} | revenue ${formatMoneyCompact(revenue)}.`);
      return true;
    });
  }

  function snapshot() {
    return {
      dayLabel: formatDateFromDays(state.day),
      day: state.day,
      cashLabel: formatMoneyCompact(state.cash),
      reputation: state.reputation,
      trend: state.market.trend,
      fatigue: state.market.audienceFatigue,
      projects: state.projects.filter((project) => !project.archived).map((project) => ({
        ...project,
        studioName: state.studios.find((entry) => entry.id === project.studioId)?.name ?? '-',
        canSerialize: ['ideation', 'manga_serialization'].includes(project.stage),
        canPitch: project.chapters >= 8 && ['manga_serialization', 'pitching'].includes(project.stage),
        canCommittee: !!project.studioId && ['pitching', 'committee_setup'].includes(project.stage),
        canProduction: project.securedBudget >= project.budgetNeed * 0.78 && ['committee_setup', 'preproduction'].includes(project.stage),
        canLaunch: ['postproduction', 'release'].includes(project.stage),
      })),
      releases: state.releases.slice(-8).reverse(),
      feed: state.feed.slice(-18).reverse(),
      debug: state.debug,
    };
  }

  function toggleAuto(onFrame) {
    if (timer) {
      clearInterval(timer);
      timer = null;
      return false;
    }
    timer = setInterval(() => {
      tick(1);
      onFrame(snapshot());
    }, 260);
    return true;
  }

  return {
    stages: STAGES,
    tick,
    snapshot,
    reset() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      state = createInitialState();
      return state;
    },
    toggleAuto,
    brainstormProject,
    serializeChapter,
    pitchToStudio,
    formCommittee,
    startProduction,
    launchAnime,
  };
}
