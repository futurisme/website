import {
  evaluateGameMathExpression,
  evaluateGameMathProgram,
  formatDateFromDays,
  formatMoneyCompact,
} from '/games/animeindustry/anime-engine.bundle.js';

const STUDIO_POOL = Object.freeze([
  { id: 'st-kagayaki', name: 'Kagayaki Pictures', craft: 72, speed: 58, network: 69, ownership: 'external' },
  { id: 'st-sora', name: 'Sora Animation Lab', craft: 80, speed: 46, network: 55, ownership: 'external' },
  { id: 'st-tsubasa', name: 'Tsubasa Works', craft: 62, speed: 74, network: 51, ownership: 'external' },
  { id: 'st-kairo', name: 'Kairo Visual Dynamics', craft: 69, speed: 67, network: 73, ownership: 'external' },
]);

const INVESTOR_POOL = Object.freeze([
  { id: 'inv-pub', name: 'Penerbit', influence: 72, risk: 45 },
  { id: 'inv-tv', name: 'TV Network', influence: 81, risk: 38 },
  { id: 'inv-stream', name: 'Platform Streaming', influence: 88, risk: 66 },
  { id: 'inv-music', name: 'Label Musik', influence: 57, risk: 41 },
  { id: 'inv-merch', name: 'Merch Partner', influence: 62, risk: 59 },
]);

function createProject(id, day, medium) {
  return {
    id,
    title: `${medium === 'novel' ? 'Novel' : 'Manga'} ${id.slice(-4).toUpperCase()}`,
    medium,
    stage: 'ideation',
    popularity: 10,
    scriptQuality: 12,
    chapters: 0,
    studioId: null,
    committeeIds: [],
    budgetNeed: medium === 'novel' ? 9_500_000 : 12_000_000,
    securedBudget: 0,
    productionProgress: 0,
    delayRisk: 0.18,
    archived: false,
  };
}

function createInitialState() {
  return {
    registered: false,
    day: 0,
    cash: 8_000_000,
    reputation: 12,
    market: { trend: 1.0, audienceFatigue: 0.1 },
    player: {
      name: '',
      initialProfession: '', // Mangaka | Novelis | Animator
      career: 'creator',
      writingMedium: 'manga',
      studioId: null,
      adminScore: 0,
      fundingPool: 0,
    },
    projects: [],
    studios: STUDIO_POOL.map((studio) => ({ ...studio })),
    investors: INVESTOR_POOL,
    releases: [],
    feed: ['Day 0: Menunggu registrasi pemain.'],
    debug: { lastAction: 'bootstrap' },
  };
}

function log(state, message) {
  state.feed.push(`Day ${state.day}: ${message}`);
  if (state.feed.length > 160) state.feed.splice(0, state.feed.length - 160);
}

function byId(state, projectId) {
  return state.projects.find((project) => project.id === projectId && !project.archived) || null;
}

function computeStageScore(project, market, player) {
  const scope = evaluateGameMathProgram('core=story*0.52+chapters*1.6+popularity*0.94;marketFit=core+trend*0.76-risk*42+credibility*8', {
    story: project.scriptQuality,
    chapters: project.chapters,
    popularity: project.popularity,
    trend: market.trend,
    risk: project.delayRisk,
    credibility: player.reputation / 100,
  });
  return scope.marketFit ?? 0;
}

function computeReleaseScore(project, studio, market) {
  return evaluateGameMathExpression('max(1,script*0.64 + popularity*0.48 + studioCraft*0.33 + studioNetwork*0.28 + committee*0.19 + trend*7.2 - delayRisk*17)', {
    script: project.scriptQuality,
    popularity: project.popularity,
    studioCraft: studio?.craft ?? 40,
    studioNetwork: studio?.network ?? 30,
    committee: project.committeeIds.length,
    trend: market.trend,
    delayRisk: project.delayRisk,
  });
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
      window.fadhilAnimeDebugger?.report?.('interaction-error', { action, message: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  function registerPlayer(name, profession) {
    return withAction('register-player', () => {
      const cleanName = String(name || '').trim();
      if (!cleanName || cleanName.length < 2) return false;
      if (!['Mangaka', 'Novelis', 'Animator'].includes(profession)) return false;

      state.registered = true;
      state.player.name = cleanName;
      state.player.initialProfession = profession;
      state.player.writingMedium = profession === 'Novelis' ? 'novel' : 'manga';
      state.player.career = profession === 'Animator' ? 'animator' : 'creator';
      if (profession === 'Animator') {
        const studio = state.studios[0];
        state.player.studioId = studio.id;
      }
      state.projects = [createProject(`ip-${Date.now().toString(36).slice(-6)}`, 0, state.player.writingMedium)];
      state.feed = [`Day 0: ${cleanName} memulai karier sebagai ${profession}.`];
      return true;
    });
  }

  function seekFunding() {
    return withAction('seek-funding', () => {
      const bonus = Math.floor(900_000 + state.reputation * 52_000 + state.player.adminScore * 80_000);
      state.player.fundingPool += bonus;
      state.cash += Math.floor(bonus * 0.12);
      log(state, `Pendanaan awal naik ${formatMoneyCompact(bonus)} dari calon investor.`);
      return true;
    });
  }

  function improveAdministration() {
    return withAction('improve-administration', () => {
      state.player.adminScore = Math.min(100, state.player.adminScore + 8);
      state.cash -= 180_000;
      log(state, 'Administrasi studio ditingkatkan (legal, HR, pajak, operasional).');
      return true;
    });
  }

  function foundStudioAsCeo(studioName) {
    return withAction('found-studio-as-ceo', () => {
      if (!state.registered) return false;
      const wealthOk = state.cash >= 20_000_000;
      const fundingOk = state.player.fundingPool >= 15_000_000;
      const adminOk = state.player.adminScore >= 55;
      if (!wealthOk || !fundingOk || !adminOk) {
        log(state, 'Syarat jadi CEO belum terpenuhi (kekayaan, pendanaan, administrasi).');
        return false;
      }
      const id = `st-player-${Math.random().toString(36).slice(-5)}`;
      const name = String(studioName || '').trim() || 'Aoi Foundry Studio';
      state.studios.push({ id, name, craft: 58, speed: 56, network: 44, ownership: 'player' });
      state.player.studioId = id;
      state.player.career = 'studio-founder';
      state.cash -= 9_800_000;
      state.player.fundingPool -= 10_000_000;
      log(state, `${name} resmi berdiri, dan Anda menjadi CEO studio anime.`);
      return true;
    });
  }

  function tick(days = 1) {
    for (let i = 0; i < days; i += 1) {
      state.day += 1;
      state.market.trend = Math.max(0.55, Math.min(1.55, 1 + Math.sin(state.day / 17) * 0.18 - state.market.audienceFatigue * 0.12));
      state.market.audienceFatigue = Math.max(0.05, Math.min(0.72, state.market.audienceFatigue + 0.002));

      if (state.player.career === 'animator' && state.player.studioId) {
        const studio = state.studios.find((entry) => entry.id === state.player.studioId);
        if (studio) {
          state.cash += 65_000;
          studio.craft = Math.min(98, studio.craft + 0.04);
        }
      }

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
      if (!state.registered) return false;
      const medium = state.player.writingMedium;
      state.projects.push(createProject(`ip-${(Math.random() * 1e9).toFixed(0)}`, state.day, medium));
      state.cash -= medium === 'novel' ? 150_000 : 250_000;
      log(state, `Konsep ${medium} baru dibuat.`);
      return true;
    });
  }

  function serializeChapter(projectId) {
    return withAction('serialize-chapter', () => {
      const project = byId(state, projectId);
      if (!project || !['ideation', 'manga_serialization'].includes(project.stage)) return false;
      project.stage = 'manga_serialization';
      project.chapters += 1;
      project.scriptQuality = Math.min(100, project.scriptQuality + (project.medium === 'novel' ? 2.2 : 1.8));
      project.popularity = Math.min(100, project.popularity + Math.max(1, 2.4 - state.market.audienceFatigue));
      state.cash -= project.medium === 'novel' ? 80_000 : 120_000;
      return true;
    });
  }

  function pitchToStudio(projectId) {
    return withAction('pitch-to-studio', () => {
      const project = byId(state, projectId);
      if (!project || project.chapters < 8) return false;
      const score = computeStageScore(project, state.market, state);
      const studio = state.player.career === 'studio-founder' && state.player.studioId
        ? state.studios.find((entry) => entry.id === state.player.studioId)
        : [...state.studios].sort((a, b) => b.network - a.network)[state.day % state.studios.length];
      if (!studio || score < 38) return false;
      project.stage = 'pitching';
      project.studioId = studio.id;
      project.delayRisk = Math.max(0.08, project.delayRisk - 0.03);
      return true;
    });
  }

  function formCommittee(projectId) {
    return withAction('form-committee', () => {
      const project = byId(state, projectId);
      if (!project || !project.studioId || !['pitching', 'committee_setup'].includes(project.stage)) return false;
      project.stage = 'committee_setup';
      while (project.committeeIds.length < 3) {
        const candidate = state.investors[(state.day + project.committeeIds.length) % state.investors.length];
        if (!project.committeeIds.includes(candidate.id)) project.committeeIds.push(candidate.id);
      }
      const raised = project.committeeIds.reduce((sum, id) => {
        const inv = state.investors.find((entry) => entry.id === id);
        return sum + (inv ? 2_500_000 + inv.influence * 8_000 : 0);
      }, 0);
      project.securedBudget = Math.min(project.budgetNeed, raised);
      return true;
    });
  }

  function startProduction(projectId) {
    return withAction('start-production', () => {
      const project = byId(state, projectId);
      if (!project || project.securedBudget < project.budgetNeed * 0.78) return false;
      if (project.stage === 'committee_setup') project.stage = 'preproduction';
      if (project.stage === 'preproduction') {
        project.stage = 'production';
        state.cash -= 1_850_000;
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
      project.archived = true;
      const revenue = Math.floor(2_800_000 + score * 92_000);
      state.cash += revenue;
      state.reputation = Math.min(100, state.reputation + (score >= 88 ? 8 : score >= 65 ? 5 : 2));
      state.releases.push({ id: project.id, title: project.title, medium: project.medium, score, revenue, studio: studio?.name ?? 'Unknown Studio', day: state.day });
      return true;
    });
  }

  function snapshot() {
    const ceoRequirements = {
      wealthNeed: 20_000_000,
      fundingNeed: 15_000_000,
      adminNeed: 55,
      wealthOk: state.cash >= 20_000_000,
      fundingOk: state.player.fundingPool >= 15_000_000,
      adminOk: state.player.adminScore >= 55,
    };

    return {
      registered: state.registered,
      day: state.day,
      dayLabel: formatDateFromDays(state.day),
      cashLabel: formatMoneyCompact(state.cash),
      reputation: state.reputation,
      trend: state.market.trend,
      fatigue: state.market.audienceFatigue,
      player: {
        name: state.player.name,
        initialProfession: state.player.initialProfession,
        career: state.player.career,
        writingMedium: state.player.writingMedium,
        studioName: state.studios.find((entry) => entry.id === state.player.studioId)?.name ?? '-',
        adminScore: state.player.adminScore,
        fundingPool: state.player.fundingPool,
      },
      ceoRequirements,
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
      feed: state.feed.slice(-20).reverse(),
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
    registerPlayer,
    seekFunding,
    improveAdministration,
    foundStudioAsCeo,
    tick,
    snapshot,
    reset() {
      if (timer) clearInterval(timer);
      timer = null;
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
