import {
  evaluateGameMathExpression,
  evaluateGameMathProgram,
  formatDateFromDays,
  formatMoneyCompact,
} from '/games/animeindustry/anime-engine-bundle.js';
import {
  MANGA_TITLE_DATASET,
  STUDIO_NAME_PART_A,
  STUDIO_NAME_PART_B,
  STUDIO_NAME_PART_C,
  STUDIO_ONE_WORD_DATASET,
  UNIQUE_NPC_FIRST_NAMES,
  UNIQUE_NPC_LAST_NAMES,
} from '/games/animeindustry/name-datasets.js';

const MAX_ACTIVE_STUDIOS = 13;
const INITIAL_ACTIVE_STUDIOS = 10;
const NPC_TARGET_COUNT = 70;
const IMDB_MIN = 0.1;
const IMDB_MAX = 10;
const STUDIO_RATING_MIN = 0.1;
const STUDIO_RATING_MAX = 5;

const STUDIO_BASE_POOL = Object.freeze([
  { id: 'st-1', craft: 72, speed: 58, network: 69, ownership: 'external' },
  { id: 'st-2', craft: 80, speed: 46, network: 55, ownership: 'external' },
  { id: 'st-3', craft: 62, speed: 74, network: 51, ownership: 'external' },
  { id: 'st-4', craft: 69, speed: 67, network: 73, ownership: 'external' },
  { id: 'st-5', craft: 63, speed: 62, network: 58, ownership: 'external' },
  { id: 'st-6', craft: 74, speed: 52, network: 64, ownership: 'external' },
  { id: 'st-7', craft: 57, speed: 76, network: 49, ownership: 'external' },
  { id: 'st-8', craft: 78, speed: 49, network: 68, ownership: 'external' },
  { id: 'st-9', craft: 60, speed: 71, network: 56, ownership: 'external' },
  { id: 'st-10', craft: 67, speed: 61, network: 62, ownership: 'external' },
  { id: 'st-11', craft: 71, speed: 55, network: 65, ownership: 'external' },
  { id: 'st-12', craft: 64, speed: 69, network: 60, ownership: 'external' },
  { id: 'st-13', craft: 59, speed: 68, network: 53, ownership: 'external' },
  { id: 'st-14', craft: 76, speed: 54, network: 71, ownership: 'external' },
]);


const INVESTOR_POOL = Object.freeze([
  { id: 'inv-pub', name: 'Penerbit', influence: 72, risk: 45 },
  { id: 'inv-tv', name: 'TV Network', influence: 81, risk: 38 },
  { id: 'inv-stream', name: 'Platform Streaming', influence: 88, risk: 66 },
  { id: 'inv-music', name: 'Label Musik', influence: 57, risk: 41 },
  { id: 'inv-merch', name: 'Merch Partner', influence: 62, risk: 59 },
]);

const NPC_ROLES = ['ceo-studio', 'mangaka', 'novelis', 'animator', 'investor'];
const PROJECT_PROFILE_TAXONOMY = {
  manga: {
    genres: {
      action: ['redemption', 'rivalry', 'survival'],
      fantasy: ['world-building', 'destiny', 'found-family'],
      romance: ['slow-burn', 'second-chance', 'forbidden-love'],
      thriller: ['conspiracy', 'mind-games', 'moral-dilemma'],
      slice_of_life: ['self-growth', 'community', 'work-life'],
    },
    audiences: ['kids', 'teens', 'young_adults', 'general'],
  },
  novel: {
    genres: {
      drama: ['family-conflict', 'class-struggle', 'identity'],
      mystery: ['whodunit', 'cold-case', 'betrayal'],
      romance: ['emotional-healing', 'first-love', 'distance-relationship'],
      fantasy: ['magic-politics', 'hero-journey', 'ancient-legacy'],
      sci_fi: ['post-human', 'space-colony', 'ai-ethics'],
    },
    audiences: ['teens', 'young_adults', 'adults'],
  },
  anime: {
    genres: {
      action: ['tournament', 'revenge', 'elite-training'],
      comedy: ['workplace-chaos', 'parody', 'culture-clash'],
      sports: ['underdog', 'team-bonding', 'comeback'],
      fantasy: ['isekai-politics', 'mythic-war', 'legacy-clans'],
      sci_fi: ['mecha-conflict', 'time-loop', 'cyber-crime'],
    },
    audiences: ['kids', 'teens', 'young_adults', 'general'],
  },
  movie: {
    genres: {
      drama: ['tragedy', 'biographical', 'social-issue'],
      thriller: ['heist', 'psychological', 'cat-and-mouse'],
      fantasy: ['epic-quest', 'mythic-fall', 'legend-reborn'],
      sci_fi: ['first-contact', 'dystopia', 'terraforming'],
      family: ['friendship', 'coming-of-age', 'hope'],
    },
    audiences: ['family', 'teens', 'young_adults', 'adults'],
  },
};
function normalizeToken(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
}

function resolveProjectProfile(mediumInput, genreInput, themeInput, audienceInput) {
  const medium = normalizeToken(mediumInput);
  const genre = normalizeToken(genreInput);
  const theme = normalizeToken(themeInput);
  const targetAudience = normalizeToken(audienceInput);
  const mediumConfig = PROJECT_PROFILE_TAXONOMY[medium];
  if (!mediumConfig) return null;
  const allowedThemes = mediumConfig.genres[genre];
  if (!allowedThemes || !allowedThemes.includes(theme)) return null;
  if (!mediumConfig.audiences.includes(targetAudience)) return null;
  return { medium, genre, theme, targetAudience };
}

function computeGenreAudienceAffinity(genre, targetAudience, npc) {
  const key = `${genre}:${targetAudience}`;
  let score = 0;
  for (let i = 0; i < key.length; i += 1) score += key.charCodeAt(i) * (i + 3);
  score += Math.round((npc?.ambition ?? 20) * 11 + (npc?.reputation ?? 15) * 7 + (npc?.id?.length ?? 4) * 13);
  return (score % 100) / 100;
}

function addUniqueName(usedNames, candidate) {
  if (usedNames.has(candidate)) return false;
  usedNames.add(candidate);
  return true;
}

function generateUniqueNpcNames(targetCount, usedNames) {
  if (targetCount > UNIQUE_NPC_FIRST_NAMES.length || targetCount > UNIQUE_NPC_LAST_NAMES.length) {
    throw new Error(`NPC name pool insufficient: need ${targetCount}, have first=${UNIQUE_NPC_FIRST_NAMES.length}, last=${UNIQUE_NPC_LAST_NAMES.length}`);
  }
  const firstPool = [...UNIQUE_NPC_FIRST_NAMES];
  const lastPool = [...UNIQUE_NPC_LAST_NAMES];

  for (let i = 0; i < targetCount; i += 1) {
    const swapFirst = i + Math.floor(Math.random() * (firstPool.length - i));
    [firstPool[i], firstPool[swapFirst]] = [firstPool[swapFirst], firstPool[i]];

    const swapLast = i + Math.floor(Math.random() * (lastPool.length - i));
    [lastPool[i], lastPool[swapLast]] = [lastPool[swapLast], lastPool[i]];
  }

  const names = [];
  for (let i = 0; i < targetCount; i += 1) {
    const full = `${firstPool[i]} ${lastPool[i]}`;
    if (addUniqueName(usedNames, full)) names.push(full);
  }
  if (names.length < targetCount) {
    throw new Error(`NPC unique-name generation failed: produced ${names.length}/${targetCount}`);
  }
  return names;
}

function randomFrom(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

function generateUniqueStudioNames(targetCount, usedNames) {
  const used = new Set();
  const names = [];
  let safety = 0;
  while (names.length < targetCount && safety < targetCount * 80) {
    safety += 1;
    const roll = Math.random();
    const wordCount = roll < 0.16 ? 1 : roll < 0.94 ? 2 : 3;
    const parts = [wordCount === 1 ? randomFrom(STUDIO_ONE_WORD_DATASET) : randomFrom(STUDIO_NAME_PART_A)];
    if (wordCount >= 2) parts.push(randomFrom(STUDIO_NAME_PART_B));
    if (wordCount >= 3) parts.push(randomFrom(STUDIO_NAME_PART_C));
    const candidate = parts.join(' ');
    if (used.has(candidate) || usedNames.has(candidate)) continue;
    used.add(candidate);
    usedNames.add(candidate);
    names.push(candidate);
  }
  return names;
}

function pickNpcRole(index) {
  if (index < 42) return 'animator';
  if (index < 50) return 'ceo-studio';
  if (index < 56) return 'mangaka';
  if (index < 62) return 'investor';
  return 'novelis';
}

function createNpcAgents(studios, usedNames) {
  const generatedNames = generateUniqueNpcNames(NPC_TARGET_COUNT, usedNames);
  const npcs = [];
  for (let i = 0; i < NPC_TARGET_COUNT; i += 1) {
    const role = pickNpcRole(i);
    const name = generatedNames[i];
    const npc = {
      id: `npc-${i + 1}`,
      name,
      role,
      ambition: 35 + ((i * 7) % 50),
      reputation: 20 + ((i * 9) % 55),
      cash: 2_000_000 + (i * 230_000),
      studioId: null,
      mood: 0.5,
      active: true,
      currentProject: null,
      writesManga: false,
    };
    npcs.push(npc);
  }

  const ceoPool = npcs.filter((entry) => entry.role === 'ceo-studio');
  studios.forEach((studio, index) => {
    const ceo = ceoPool[index % ceoPool.length];
    studio.ceoNpcId = ceo.id;
    studio.scoutPower = Math.min(95, Math.round((studio.network * 0.62) + (studio.craft * 0.38)));
    ceo.studioId = studio.id;
    ceo.writesManga = index % 3 === 0;
  });

  return npcs;
}

function createProject(id, medium, title) {
  const tunedBudgetNeed = medium === 'novel'
    ? 9_500_000
    : medium === 'anime'
      ? 26_000_000
      : medium === 'movie'
        ? 44_000_000
        : 12_000_000;
  const tunedDelayRisk = medium === 'movie' ? 0.32 : medium === 'anime' ? 0.24 : 0.18;
  return {
    id,
    title,
    medium,
    stage: 'ideation',
    popularity: 10,
    scriptQuality: 12,
    visualQuality: medium === 'novel' ? 24 : 18,
    plotQuality: 16,
    competitiveness: 28,
    imdbScore: 5.2,
    ratingsCount: 0,
    chapters: 0,
    studioId: null,
    interestedStudioIds: [],
    committeeIds: [],
    committeeNegotiationLog: [],
    contractDraft: { creatorShare: 38, studioShare: 42, investorShare: 20 },
    committeeApproved: false,
    budgetNeed: tunedBudgetNeed,
    securedBudget: 0,
    plannedEpisodes: medium === 'anime' ? 12 : medium === 'movie' ? 1 : 0,
    committeeFinance: {
      committeeBudget: tunedBudgetNeed,
      spent: 0,
      debtToCommittee: 0,
      topUpRounds: 0,
      allocations: {
        visual: 0.36,
        plot: 0.24,
        audio: 0.16,
        marketing: 0.14,
        administration: 0.1,
      },
      allocationSpent: {
        visual: 0,
        plot: 0,
        audio: 0,
        marketing: 0,
        administration: 0,
      },
      committeeContributions: {},
      reviewHistory: [],
    },
    productionProgress: 0,
    delayRisk: tunedDelayRisk,
    archived: false,
    genre: '',
    theme: '',
    targetAudience: '',
  };
}

function createMetadataSignature({ title, genre, theme, targetAudience }) {
  const src = `${title}|${genre}|${theme}|${targetAudience}`;
  let hash = 2166136261;
  for (let i = 0; i < src.length; i += 1) {
    hash ^= src.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function buildCommitteeBudgetBlueprint(project, studio, state) {
  const medium = project.medium;
  const baseEpisodes = medium === 'anime'
    ? clamp(10 + Math.round((project.popularity + project.competitiveness) / 38), 10, 14)
    : medium === 'movie'
      ? 1
      : 0;
  const plannedEpisodes = Math.max(1, Math.round(project.plannedEpisodes || baseEpisodes || 1));
  const perEpisode = medium === 'anime'
    ? Math.round(1_250_000 + (project.scriptQuality + project.visualQuality + project.plotQuality) * 8_200 + (studio?.craft ?? 50) * 11_500)
    : medium === 'movie'
      ? Math.round(21_000_000 + (project.scriptQuality + project.visualQuality + project.plotQuality) * 21_000 + (studio?.craft ?? 50) * 16_000)
      : Math.round(project.budgetNeed || 8_000_000);
  const subtotal = perEpisode * plannedEpisodes;
  const contingency = Math.round(subtotal * (medium === 'movie' ? 0.16 : 0.12));
  const adminRiskBuffer = Math.round(subtotal * (0.05 + (state.player.adminScore < 25 ? 0.03 : 0)));
  const committeeBudget = subtotal + contingency + adminRiskBuffer;
  return {
    plannedEpisodes,
    perEpisode,
    committeeBudget,
    allocations: {
      visual: 0.37,
      plot: 0.23,
      audio: 0.15,
      marketing: 0.14,
      administration: 0.11,
    },
  };
}

function requestCommitteeTopUp(project, state, shortfall) {
  const committee = project.committeeFinance;
  if (!committee) return 0;
  const committeePower = project.committeeIds.reduce((sum, id) => {
    const investor = state.investors.find((row) => row.id === id);
    return sum + (investor?.influence ?? 35);
  }, 0);
  const topUp = Math.round(shortfall * clamp(0.7 + committeePower / 380, 0.72, 1.25));
  committee.topUpRounds = (committee.topUpRounds || 0) + 1;
  committee.debtToCommittee = (committee.debtToCommittee || 0) + topUp;
  committee.committeeBudget += topUp;
  project.securedBudget += topUp;
  project.committeeNegotiationLog.push(`Rapat tambahan komite menyetujui top-up ${formatMoneyCompact(topUp)}. Top-up menjadi utang studio.`);
  if (project.committeeNegotiationLog.length > 10) project.committeeNegotiationLog.shift();
  return topUp;
}

function runCommitteeQualityReview(project, state, studio) {
  const committee = project.committeeFinance;
  const spentRatio = committee ? (committee.spent / Math.max(1, committee.committeeBudget)) : 0.9;
  const debtRatio = committee ? ((committee.debtToCommittee || 0) / Math.max(1, committee.committeeBudget)) : 0;
  const qualityScore = (
    (project.visualQuality ?? project.scriptQuality) * 0.38
    + (project.plotQuality ?? project.scriptQuality) * 0.37
    + project.scriptQuality * 0.12
    + (project.competitiveness ?? 35) * 0.08
    + (studio?.craft ?? 50) * 0.05
  );
  const budgetDiscipline = clamp(100 - Math.abs(1 - spentRatio) * 90 - debtRatio * 35, 25, 100);
  const reviewScore = qualityScore * 0.82 + budgetDiscipline * 0.18 - project.delayRisk * 35;
  const passThreshold = project.medium === 'movie' ? 76 : 72;
  const passed = reviewScore >= passThreshold;
  if (committee) {
    committee.reviewHistory.push({
      day: state.day,
      score: reviewScore,
      passed,
      budgetDiscipline,
    });
    if (committee.reviewHistory.length > 8) committee.reviewHistory.shift();
  }
  return { passed, reviewScore, budgetDiscipline };
}

function getPitchReadinessThreshold(project) {
  if (!project) return 8;
  if (project.medium === 'movie') return 5;
  if (project.medium === 'anime') return 6;
  return 8;
}

function createUniquePlayerProjectTitle(state, medium) {
  const base = `${medium === 'novel' ? 'Novel' : 'Manga'} ${Math.random().toString(36).slice(-4).toUpperCase()}`;
  if (!state.usedNames.has(base)) {
    state.usedNames.add(base);
    return base;
  }
  let seq = 2;
  let candidate = `${base}-${seq}`;
  while (state.usedNames.has(candidate)) {
    seq += 1;
    candidate = `${base}-${seq}`;
  }
  state.usedNames.add(candidate);
  return candidate;
}

function generateUniqueMangaTitle(state, npc) {
  const poolPick = MANGA_TITLE_DATASET[(state.day + npc.id.length + Math.floor(Math.random() * MANGA_TITLE_DATASET.length)) % MANGA_TITLE_DATASET.length];
  const fallback = `${poolPick} ${npc.id.toUpperCase()}`;
  if (!state.usedNames.has(poolPick)) {
    state.usedNames.add(poolPick);
    return poolPick;
  }
  let seq = 2;
  let candidate = `${poolPick} ${seq}`;
  while (state.usedNames.has(candidate)) {
    seq += 1;
    candidate = `${fallback} ${seq}`;
  }
  state.usedNames.add(candidate);
  return candidate;
}

function createNpcProject(state, npc, day) {
  const mediumByRole = npc.role === 'novelis' ? 'novel' : npc.role === 'animator' ? 'anime' : 'manga';
  const taxonomy = PROJECT_PROFILE_TAXONOMY[mediumByRole] || PROJECT_PROFILE_TAXONOMY.manga;
  const genreKeys = Object.keys(taxonomy.genres);
  const genre = genreKeys[(day + npc.id.length + Math.floor(npc.ambition)) % genreKeys.length];
  const themes = taxonomy.genres[genre];
  const theme = themes[(day + Math.floor(npc.reputation) + npc.id.length) % themes.length];
  const targetAudience = taxonomy.audiences[(day + Math.floor(npc.ambition / 8)) % taxonomy.audiences.length];
  if (!npc.franchiseTitle) npc.franchiseTitle = generateUniqueMangaTitle(state, npc);
  npc.franchiseIndex = (npc.franchiseIndex ?? 0) + 1;
  const installment = npc.franchiseIndex === 1 ? 'Main Story' : npc.franchiseIndex === 2 ? 'Sequel Arc' : `Series ${npc.franchiseIndex}`;
  return {
    id: `npc-ip-${npc.id}-${day}`,
    npcId: npc.id,
    medium: mediumByRole,
    title: `${npc.franchiseTitle} • ${installment}`,
    stage: 'serialization',
    chapters: 6,
    quality: 40 + Math.min(35, Math.round(npc.reputation * 0.4)),
    visualQuality: 38 + Math.min(30, Math.round(npc.reputation * 0.32)),
    plotQuality: 41 + Math.min(30, Math.round(npc.ambition * 0.28)),
    competitiveness: 35,
    imdbScore: 5.4,
    ratingsCount: 0,
    popularity: 32 + Math.min(35, Math.round(npc.ambition * 0.35)),
    studioId: null,
    productionProgress: 0,
    launched: false,
    genre,
    theme,
    targetAudience,
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function computeNpcDecisionKernel(npc, state) {
  const discipline = evaluateGameMathExpression(
    'max(0.05, min(0.95, ambition*0.006 + reputation*0.004 + mood*0.48 + marketTrend*0.16 - fatigue*0.22))',
    {
      ambition: npc.ambition,
      reputation: npc.reputation,
      mood: npc.mood,
      marketTrend: state.market.trend,
      fatigue: state.market.audienceFatigue,
    },
  );

  const riskBudget = evaluateGameMathExpression(
    'max(0.05, min(0.9, ambition*0.007 + roleRisk*0.012 + marketDelta*0.4 - fatigue*0.2))',
    {
      ambition: npc.ambition,
      roleRisk: npc.role === 'investor' ? 40 : npc.role === 'ceo-studio' ? 28 : 22,
      marketDelta: Math.abs(state.market.trend - 1),
      fatigue: state.market.audienceFatigue,
    },
  );

  const naturalDrift = (((state.day + (npc.id?.length ?? 0) * 11) % 17) / 17) - 0.5;
  return {
    discipline: clamp(discipline + naturalDrift * 0.08, 0.05, 0.96),
    riskBudget: clamp(riskBudget + naturalDrift * 0.06, 0.05, 0.9),
  };
}

function createInitialState() {
  const usedNames = new Set();
  const studioNames = generateUniqueStudioNames(INITIAL_ACTIVE_STUDIOS, usedNames);
  const studios = STUDIO_BASE_POOL.slice(0, INITIAL_ACTIVE_STUDIOS).map((studio, index) => ({
    ...studio,
    name: studioNames[index],
    equity: { player: 0, investor: 100 },
    funds: computeInitialStudioFunds(studio),
  }));
  const npcs = createNpcAgents(studios, usedNames);
  return {
    registered: false,
    day: 0,
    cash: 8_000_000,
    reputation: 12,
    market: { trend: 1.0, audienceFatigue: 0.1 },
    player: {
      name: '',
      initialProfession: '',
      career: 'creator',
      writingMedium: 'manga',
      studioId: null,
      adminScore: 0,
      fundingPool: 0,
      studioPlanningOpen: false,
    },
    projects: [],
    studioInvestments: [],
    studioFinanceLedger: [],
    studios,
    investors: INVESTOR_POOL,
    npcs,
    npcProjects: [],
    emails: [],
    usedNames,
    releases: [],
    feed: ['Day 0: Menunggu registrasi pemain.'],
    cache: {
      rankedStudios: studios.map((entry) => entry.id),
      rankedStudiosDay: 0,
      intelligence: null,
      intelligenceDay: -1,
      communities: null,
      communitiesDay: -1,
    },
    debug: { lastAction: 'bootstrap' },
  };
}

function log(state, message) {
  state.feed.push(`Day ${state.day}: ${message}`);
  if (state.feed.length > 200) state.feed.splice(0, state.feed.length - 200);
}

function invalidateDerivedCaches(state) {
  if (!state?.cache) return;
  state.cache.intelligence = null;
  state.cache.intelligenceDay = -1;
  state.cache.rankedStudiosDay = -1;
  state.cache.communities = null;
  state.cache.communitiesDay = -1;
}

function addEmail(state, type, subject, body) {
  const email = {
    id: `mail-${state.day}-${Math.random().toString(36).slice(2, 7)}`,
    day: state.day,
    type,
    subject,
    body,
    read: false,
  };
  state.emails.push(email);
  if (state.emails.length > 120) state.emails.splice(0, state.emails.length - 120);
}

function byId(state, projectId) {
  return state.projects.find((project) => project.id === projectId && !project.archived) || null;
}

function getRankedStudios(state) {
  if (state.cache.rankedStudiosDay === state.day) return state.cache.rankedStudios;
  const intelligence = getStudioIntelligence(state);
  state.cache.rankedStudios = [...state.studios]
    .sort((a, b) => {
      const ratingA = intelligence.ratingsByStudioId.get(a.id)?.overall ?? 0;
      const ratingB = intelligence.ratingsByStudioId.get(b.id)?.overall ?? 0;
      return (ratingB + b.network * 0.12 + b.scoutPower * 0.08) - (ratingA + a.network * 0.12 + a.scoutPower * 0.08);
    })
    .map((entry) => entry.id);
  state.cache.rankedStudiosDay = state.day;
  return state.cache.rankedStudios;
}

function computeStageScore(project, market, state) {
  const scope = evaluateGameMathProgram('core=story*0.52+chapters*1.6+popularity*0.94;marketFit=core+trend*0.76-risk*42+credibility*8', {
    story: project.scriptQuality,
    chapters: project.chapters,
    popularity: project.popularity,
    trend: market.trend,
    risk: project.delayRisk,
    credibility: state.reputation / 100,
  });
  return scope.marketFit ?? 0;
}

function computeReleaseScore(project, studio, market) {
  return evaluateGameMathExpression('max(1,plot*0.34 + visual*0.29 + script*0.24 + competitiveness*0.18 + popularity*0.31 + studioCraft*0.27 + studioNetwork*0.22 + committee*0.16 + trend*7.0 - delayRisk*16)', {
    plot: project.plotQuality ?? project.scriptQuality,
    visual: project.visualQuality ?? project.scriptQuality,
    script: project.scriptQuality,
    competitiveness: project.competitiveness ?? 40,
    popularity: project.popularity,
    studioCraft: studio?.craft ?? 40,
    studioNetwork: studio?.network ?? 30,
    committee: project.committeeIds.length,
    trend: market.trend,
    delayRisk: project.delayRisk,
  });
}

function computeAudienceImdbSignal({
  visualQuality,
  plotQuality,
  competitiveness,
  trend,
  uniqueness,
  mediumBoost = 0,
  marketBaseline = 0.56,
  ageDays = 0,
}) {
  const normalizedVisual = clamp((Number(visualQuality) || 0) / 100, 0, 1);
  const normalizedPlot = clamp((Number(plotQuality) || 0) / 100, 0, 1);
  const normalizedCompetition = clamp((Number(competitiveness) || 0) / 100, 0, 1);
  const normalizedTrend = clamp((Number(trend) || 1) / 1.6, 0, 1);
  const normalizedUniqueness = clamp((Number(uniqueness) || 0) / 100, 0, 1);
  const qualityBlend = (normalizedVisual * 0.36) + (normalizedPlot * 0.42) + (normalizedCompetition * 0.22);
  const baseline = clamp(Number(marketBaseline) || 0.56, 0.2, 0.9);
  const qualityDelta = qualityBlend - baseline;
  const harshPenalty = qualityDelta < 0 ? Math.pow(Math.abs(qualityDelta), 1.42) * 4.2 : 0;
  const sweetBoost = qualityDelta > 0 ? Math.pow(qualityDelta, 1.18) * 3.4 : 0;
  const eraDecay = clamp((Number(ageDays) || 0) / 720, 0, 1.6);
  const base = 4.2
    + qualityBlend * 4.35
    + normalizedTrend * 0.58
    + normalizedUniqueness * 0.45
    + mediumBoost
    + sweetBoost
    - harshPenalty
    - eraDecay * Math.max(0, 0.44 - qualityBlend) * 1.25;
  const legacyFloor = clamp(0.9 + Math.log10(1 + Math.max(0, Number(ageDays) || 0)) * 0.95, IMDB_MIN, 3.8);
  return clamp(base, legacyFloor, IMDB_MAX);
}

function computeCompetitivePressure(state, medium) {
  const peer = state.releases
    .filter((entry) => (medium === 'movie' ? String(entry.title || '').toLowerCase().includes('movie') : !String(entry.title || '').toLowerCase().includes('movie')))
    .slice(-14);
  if (!peer.length) return 0;
  const avgScore = peer.reduce((sum, row) => sum + (Number(row.score) || 0), 0) / peer.length;
  return clamp((avgScore - 60) / 40, -0.5, 0.6);
}

function getPopularitySegment(medium) {
  if (medium === 'movie') return 'movie';
  if (medium === 'anime') return 'anime';
  return 'manga_novel';
}

function extractFranchiseKey(title) {
  const normalized = String(title || '').toLowerCase()
    .replace(/series\s*\d+/g, '')
    .replace(/sequel|main story|arc|season\s*\d+/g, '')
    .replace(/[•:|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return 'untitled';
  return normalized.split(' ').slice(0, 4).join(' ');
}

function computePopularityDemand(entry, state) {
  const stage = String(entry.stage || 'ideation');
  const qualityCore = ((entry.plotQuality ?? entry.quality ?? entry.scriptQuality ?? 20) * 0.42)
    + ((entry.visualQuality ?? entry.quality ?? entry.scriptQuality ?? 20) * 0.34)
    + ((entry.scriptQuality ?? entry.quality ?? 20) * 0.24);
  const engagement = (Number(entry.chapters) || 0) * 1.6 + (Number(entry.productionProgress) || 0) * 0.22 + (Number(entry.competitiveness) || 30) * 0.3;
  const inertia = (Number(entry.popularity) || 8) * 0.56;
  const stageFactor = stage === 'serialization' ? 1.08
    : stage === 'manga_serialization' ? 1.04
      : stage === 'production' ? 0.94
        : stage === 'postproduction' ? 0.82
          : stage === 'release' || stage === 'launch-ready' ? 0.7
            : stage === 'ideation' ? 0.56 : 0.76;
  const noContinuationPenalty = ((stage === 'release' || stage === 'launch-ready') && (entry.chapters || 0) < 3) ? 0.74 : 1;
  const fatiguePenalty = clamp(1 - state.market.audienceFatigue * 0.35, 0.62, 1.02);
  return Math.max(0.1, (qualityCore + engagement + inertia) * stageFactor * noContinuationPenalty * fatiguePenalty);
}

function buildCommunityInsights(state) {
  if (state?.cache?.communities && state.cache.communitiesDay === state.day) return state.cache.communities;
  const mediumAccumulator = { manga: 0.0001, novel: 0.0001, anime: 0.0001, movie: 0.0001 };
  const ageAccumulator = { kids: 0.0001, teens: 0.0001, young_adults: 0.0001, adults: 0.0001, general: 0.0001 };
  const regionAccumulator = { apac: 0.0001, americas: 0.0001, emea: 0.0001, online: 0.0001 };
  const genreMomentum = new Map();
  const genreCounts = new Map();
  const fatigue = clamp(Number(state.market?.audienceFatigue) || 0.1, 0, 1);
  const trend = clamp(Number(state.market?.trend) || 1, 0.4, 1.8);
  const boomAmplifier = clamp(0.8 + (trend * 0.48) - fatigue * 0.42, 0.3, 1.55);

  state.projects.forEach((project) => {
    if (project.archived) return;
    const medium = project.medium === 'novel' ? 'novel' : project.medium === 'movie' ? 'movie' : project.medium === 'anime' ? 'anime' : 'manga';
    const genre = String(project.genre || 'unknown').toLowerCase();
    const qualitySignal = ((project.plotQuality ?? project.scriptQuality ?? 0) * 0.48) + ((project.visualQuality ?? project.scriptQuality ?? 0) * 0.52);
    const saturationPenalty = Math.max(0.35, 1 - ((genreCounts.get(genre) || 0) * 0.035));
    const influence = Math.max(0.08, ((project.popularity || 0) * 0.14 + qualitySignal * 0.11) * saturationPenalty * boomAmplifier);
    mediumAccumulator[medium] += influence;
    if (project.targetAudience && ageAccumulator[project.targetAudience] != null) ageAccumulator[project.targetAudience] += influence * 0.85;
    ageAccumulator.adults += influence * fatigue * 0.22;
    ageAccumulator.teens += influence * (1 - fatigue) * 0.26;
    const regionBias = (project.genre || '').length % 3;
    if (regionBias === 0) regionAccumulator.apac += influence * 0.62;
    else if (regionBias === 1) regionAccumulator.americas += influence * 0.55;
    else regionAccumulator.emea += influence * 0.52;
    regionAccumulator.online += influence * 0.5;
    genreMomentum.set(genre, (genreMomentum.get(genre) || 0) + influence * ((qualitySignal / 100) * 1.4 + 0.4));
    genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
  });
  state.npcProjects.forEach((project) => {
    if (project.launched) return;
    const medium = project.medium === 'novel' ? 'novel' : project.medium === 'movie' ? 'movie' : project.medium === 'anime' ? 'anime' : 'manga';
    const qualitySignal = ((project.plotQuality ?? project.quality ?? 0) * 0.5) + ((project.visualQuality ?? project.quality ?? 0) * 0.5);
    const influence = Math.max(0.05, ((project.popularity || 0) * 0.09 + qualitySignal * 0.08) * (1 - fatigue * 0.28) * boomAmplifier);
    mediumAccumulator[medium] += influence;
    ageAccumulator.teens += influence * 0.24;
    ageAccumulator.young_adults += influence * 0.34;
    ageAccumulator.general += influence * 0.22;
  });

  state.releases.slice(-120).forEach((release) => {
    const medium = release.medium === 'novel' ? 'novel' : release.medium === 'movie' ? 'movie' : release.medium === 'anime' ? 'anime' : 'manga';
    const freshness = clamp(1 - ((state.day - (release.day ?? state.day)) / 1200), 0.32, 1.25);
    const influence = Math.max(0.12, ((release.score || 0) ** 1.06) * 0.06 + ((release.imdb || 0) ** 1.3) * 0.32) * freshness * boomAmplifier;
    mediumAccumulator[medium] = (mediumAccumulator[medium] || 0.0001) + influence;
    ageAccumulator.general += influence * 0.72;
    ageAccumulator.teens += influence * 0.32;
    ageAccumulator.young_adults += influence * 0.44;
    regionAccumulator.apac += influence * 0.35;
    regionAccumulator.americas += influence * 0.31;
    regionAccumulator.emea += influence * 0.29;
    regionAccumulator.online += influence * 0.54;
  });

  const day = Number(state.day) || 0;
  const animeWave = 1 + Math.sin(day / 9.5) * 0.08 + (trend - 1) * 0.12;
  const movieWave = 1 + Math.cos(day / 13.2) * 0.07 + (trend - 1) * 0.08;
  const mangaWave = 1 + Math.sin(day / 7.8) * 0.06 - fatigue * 0.04;
  const novelWave = 1 + Math.cos(day / 11.4) * 0.05 + fatigue * 0.03;
  mediumAccumulator.anime *= Math.max(0.25, animeWave);
  mediumAccumulator.movie *= Math.max(0.25, movieWave);
  mediumAccumulator.manga *= Math.max(0.25, mangaWave);
  mediumAccumulator.novel *= Math.max(0.25, novelWave);
  ageAccumulator.teens *= Math.max(0.25, 1 + Math.sin(day / 10.7) * 0.08 + (1 - fatigue) * 0.05);
  ageAccumulator.young_adults *= Math.max(0.25, 1 + Math.cos(day / 8.9) * 0.07 + trend * 0.03);
  ageAccumulator.adults *= Math.max(0.25, 1 + Math.sin(day / 14.5) * 0.06 + fatigue * 0.08);
  regionAccumulator.online *= Math.max(0.25, 1 + Math.sin(day / 6.8) * 0.09 + trend * 0.04);
  regionAccumulator.apac *= Math.max(0.25, 1 + Math.cos(day / 12.1) * 0.05);
  regionAccumulator.americas *= Math.max(0.25, 1 + Math.sin(day / 15.4) * 0.05);
  regionAccumulator.emea *= Math.max(0.25, 1 + Math.cos(day / 17.2) * 0.05);

  const mediumDampingPower = 0.86;
  Object.keys(mediumAccumulator).forEach((key) => {
    mediumAccumulator[key] = Math.pow(Math.max(0.0001, mediumAccumulator[key]), mediumDampingPower);
  });

  const normalize = (acc) => {
    const total = Object.values(acc).reduce((sum, value) => sum + value, 0) || 1;
    return Object.fromEntries(Object.entries(acc).map(([key, value]) => [key, value / total]));
  };
  const trends = [...genreMomentum.entries()]
    .map(([genre, momentum]) => {
      const count = genreCounts.get(genre) || 1;
      const saturation = Math.max(0.45, 1 - count * 0.04);
      const pioneerBoost = momentum > 8 ? 1.28 : momentum > 5 ? 1.14 : 1;
      return { genre, momentum: momentum * saturation * pioneerBoost, count };
    })
    .sort((a, b) => b.momentum - a.momentum)
    .slice(0, 8);
  const result = {
    mediumShares: normalize(mediumAccumulator),
    ageShares: normalize(ageAccumulator),
    regionShares: normalize(regionAccumulator),
    trends,
  };
  if (state?.cache) {
    state.cache.communities = result;
    state.cache.communitiesDay = state.day;
  }
  return result;
}

function computeCommunityImdbModifiers(state, { medium = 'manga', targetAudience = 'general', uniqueness = 35, ageDays = 0 }) {
  const insights = buildCommunityInsights(state);
  const mediumKey = medium === 'novel' ? 'novel' : medium === 'movie' ? 'movie' : medium === 'anime' ? 'anime' : 'manga';
  const mediumShare = insights.mediumShares[mediumKey] ?? 0.25;
  const audienceShare = insights.ageShares[targetAudience] ?? insights.ageShares.general ?? 0.25;
  const novelty = clamp((Number(uniqueness) || 0) / 100, 0, 1);
  const ageShield = clamp(Math.log10(1 + Math.max(0, Number(ageDays) || 0)) / 3.2, 0, 1);
  const marketBaseline = clamp(0.12 + mediumShare * 0.62 + audienceShare * 0.36 + novelty * 0.18, 0.08, 0.97);
  const mediumBoost = clamp(((mediumShare - 0.25) * 1.15) + ((audienceShare - 0.2) * 0.72) + novelty * 0.3 + ageShield * 0.16, -0.95, 1.25);
  return { marketBaseline, mediumBoost, insights };
}

function rebalancePopularityMarkets(state) {
  let changed = false;
  const entries = [];
  state.projects.forEach((project) => {
    if (project.archived) return;
    entries.push({
      ref: project,
      segment: getPopularitySegment(project.medium),
      franchise: extractFranchiseKey(project.title),
      stage: project.stage,
      popularity: project.popularity,
      scriptQuality: project.scriptQuality,
      visualQuality: project.visualQuality,
      plotQuality: project.plotQuality,
      competitiveness: project.competitiveness,
      chapters: project.chapters,
      productionProgress: project.productionProgress,
    });
  });
  state.npcProjects.forEach((project) => {
    if (project.launched) return;
    entries.push({
      ref: project,
      segment: getPopularitySegment(project.medium || 'manga'),
      franchise: extractFranchiseKey(project.title),
      stage: project.stage,
      popularity: project.popularity,
      quality: project.quality,
      visualQuality: project.visualQuality,
      plotQuality: project.plotQuality,
      competitiveness: project.competitiveness,
      chapters: project.chapters,
      productionProgress: project.productionProgress,
    });
  });
  const segmentMap = new Map([['manga_novel', []], ['anime', []], ['movie', []]]);
  entries.forEach((entry) => {
    if (!segmentMap.has(entry.segment)) segmentMap.set(entry.segment, []);
    segmentMap.get(entry.segment).push(entry);
  });

  const franchiseStrength = entries.reduce((acc, entry) => {
    const key = `${entry.segment}:${entry.franchise}`;
    const demand = computePopularityDemand(entry, state);
    acc.set(key, (acc.get(key) ?? 0) + demand);
    return acc;
  }, new Map());

  segmentMap.forEach((rows, segment) => {
    if (!rows.length) return;
    const weighted = rows.map((entry) => {
      const demand = computePopularityDemand(entry, state);
      const crossBoost = segment === 'anime'
        ? (franchiseStrength.get(`manga_novel:${entry.franchise}`) ?? 0) * 0.18
        : segment === 'manga_novel'
          ? (franchiseStrength.get(`anime:${entry.franchise}`) ?? 0) * 0.12
          : ((franchiseStrength.get(`anime:${entry.franchise}`) ?? 0) + (franchiseStrength.get(`manga_novel:${entry.franchise}`) ?? 0)) * 0.1;
      return { entry, demand: Math.max(0.1, demand + crossBoost) };
    });
    const totalDemand = weighted.reduce((sum, row) => sum + row.demand, 0) || 1;
    weighted.forEach((row) => {
      const nextPopularity = clamp((row.demand / totalDemand) * 100, 0.05, 100);
      if (Math.abs((row.entry.ref.popularity ?? 0) - nextPopularity) > 0.0001) changed = true;
      row.entry.ref.popularity = nextPopularity;
    });
  });
  return changed;
}

function computeStudioValuation(studio, studioReleaseScore = 0) {
  return Math.round((studio.craft + studio.speed + studio.network + studio.scoutPower) * 42_000 + studioReleaseScore * 35_000);
}

function classifyStudio(studio, valuation) {
  const category = studio.ownership === 'player'
    ? 'Founder-led'
    : studio.ownership === 'cofunded'
      ? 'Co-Funded'
      : studio.ownership === 'merger'
        ? 'Merged Alliance'
        : 'Independent';
  const tier = valuation >= 26_000_000 ? 'S' : valuation >= 18_000_000 ? 'A' : valuation >= 11_000_000 ? 'B' : valuation >= 6_000_000 ? 'C' : 'D';
  return { category, tier };
}

function getTierFinanceProfile(tier) {
  if (tier === 'S') return { support: 42_000, salaryBase: 165_000, maintenance: 128_000, taxRate: 0.145 };
  if (tier === 'A') return { support: 34_000, salaryBase: 136_000, maintenance: 96_000, taxRate: 0.132 };
  if (tier === 'B') return { support: 26_000, salaryBase: 112_000, maintenance: 72_000, taxRate: 0.118 };
  if (tier === 'C') return { support: 18_000, salaryBase: 90_000, maintenance: 56_000, taxRate: 0.102 };
  return { support: 11_000, salaryBase: 74_000, maintenance: 42_000, taxRate: 0.09 };
}

function tierToScore(tier) {
  if (tier === 'S') return 100;
  if (tier === 'A') return 86;
  if (tier === 'B') return 72;
  if (tier === 'C') return 58;
  return 45;
}

function computeStudioRating(state, studio, context = null) {
  const ctx = context ?? {};
  const releases = (ctx.releases ?? state.releases).filter((entry) => entry.studio === studio.name);
  const studioProjects = (ctx.projects ?? state.projects).filter((entry) => entry.studioId === studio.id && !entry.archived);
  const studioNpcProjects = (ctx.npcProjects ?? state.npcProjects).filter((entry) => entry.studioId === studio.id);
  const studioStaff = (ctx.staffByStudio?.get(studio.id))
    ?? state.npcs.filter((entry) => entry.role === 'animator' && entry.studioId === studio.id);
  const investorRows = (ctx.investorRowsByStudio?.get(studio.id)) ?? [];

  const releaseQualityScore = releases.length
    ? releases.reduce((sum, entry) => {
      const releaseScore = Number(entry.score) || 0;
      const imdb = Number(entry.imdb) || 0;
      const ratings = Math.log10(1 + Math.max(0, Number(entry.ratings) || 0));
      return sum + (releaseScore * 0.58) + ((imdb * 10) * 0.32) + (ratings * 14.2);
    }, 0) / releases.length
    : 0;
  const productionQualityPool = [
    ...studioProjects.map((entry) => ((entry.visualQuality ?? 0) * 0.5) + ((entry.plotQuality ?? entry.scriptQuality ?? 0) * 0.5)),
    ...studioNpcProjects.map((entry) => ((entry.visualQuality ?? entry.quality ?? 0) * 0.52) + ((entry.plotQuality ?? entry.quality ?? 0) * 0.48)),
  ];
  const productionQualityScore = productionQualityPool.length
    ? productionQualityPool.reduce((sum, value) => sum + value, 0) / productionQualityPool.length
    : ((studio.craft * 0.65) + (studio.speed * 0.35));
  const competenceSentiment = clamp(
    (studioStaff.length
      ? studioStaff.reduce((sum, entry) => sum + (entry.reputation * 0.72) + (entry.mood * 100 * 0.28), 0) / studioStaff.length
      : ((studio.craft * 0.6) + (studio.network * 0.4)))
      + (investorRows.length ? investorRows.reduce((sum, row) => sum + (row.influence * 0.45) + (row.score * 4.4), 0) / investorRows.length : 0) * 0.35,
    1,
    100,
  );
  const valuation = ctx.valuationByStudioId?.get(studio.id) ?? computeStudioValuation(studio, releaseQualityScore);
  const tier = classifyStudio(studio, valuation).tier;
  const tierScore = tierToScore(tier);
  const reliability = clamp((100 - (studioProjects.reduce((sum, entry) => sum + (entry.delayRisk ?? 0), 0) / Math.max(1, studioProjects.length)) * 100), 30, 100);

  const overall100 = clamp(
    (releaseQualityScore * 0.33)
    + (productionQualityScore * 0.27)
    + (competenceSentiment * 0.2)
    + (tierScore * 0.12)
    + (reliability * 0.08),
    1,
    99.9,
  );
  const overall = clamp((overall100 / 100) * STUDIO_RATING_MAX, STUDIO_RATING_MIN, STUDIO_RATING_MAX);

  const investorAttractiveness = clamp(
    0.58 + ((overall100 - 50) / 100) * 0.8 + (tierScore / 100) * 0.18 + (Math.log10(Math.max(1, valuation)) / 8.5),
    0.35,
    2.2,
  );
  const projectMomentum = clamp(
    0.55 + ((overall100 - 45) / 100) * 0.72 + (productionQualityScore / 100) * 0.22 + (studio.network / 100) * 0.12,
    0.4,
    1.95,
  );
  const marketingEfficiency = clamp(
    0.52 + ((overall100 - 40) / 100) * 0.88 + (studio.network / 100) * 0.2 + (releaseQualityScore / 100) * 0.14,
    0.45,
    2.1,
  );

  return {
    overall,
    tier,
    valuation,
    components: {
      releaseQuality: clamp(releaseQualityScore, 1, 100),
      productionQuality: clamp(productionQualityScore, 1, 100),
      competence: competenceSentiment,
      studioTier: tierScore,
      reliability,
    },
    multipliers: {
      investorAttractiveness,
      projectMomentum,
      marketingEfficiency,
    },
  };
}

function buildStudioIntelligenceContext(state) {
  const investorById = new Map(state.investors.map((entry) => [entry.id, entry]));
  const npcById = new Map(state.npcs.map((entry) => [entry.id, entry]));
  const releasesByStudioName = state.releases.reduce((acc, release) => {
    if (!acc.has(release.studio)) acc.set(release.studio, []);
    acc.get(release.studio).push(release);
    return acc;
  }, new Map());
  const projectsByStudioId = state.projects.reduce((acc, project) => {
    if (!project.studioId || project.archived) return acc;
    if (!acc.has(project.studioId)) acc.set(project.studioId, []);
    acc.get(project.studioId).push(project);
    return acc;
  }, new Map());
  const npcProjectsByStudioId = state.npcProjects.reduce((acc, project) => {
    if (!project.studioId) return acc;
    if (!acc.has(project.studioId)) acc.set(project.studioId, []);
    acc.get(project.studioId).push(project);
    return acc;
  }, new Map());
  const staffByStudioId = state.npcs.reduce((acc, npc) => {
    if (npc.role !== 'animator' || !npc.studioId) return acc;
    if (!acc.has(npc.studioId)) acc.set(npc.studioId, []);
    acc.get(npc.studioId).push(npc);
    return acc;
  }, new Map());
  const investorRowsByStudio = new Map();
  state.studioInvestments.forEach((entry) => {
    if (!investorRowsByStudio.has(entry.studioId)) investorRowsByStudio.set(entry.studioId, []);
    const investor = investorById.get(entry.investorId);
    const investorNpc = npcById.get(entry.investorId);
    investorRowsByStudio.get(entry.studioId).push({
      investorId: entry.investorId,
      name: investor?.name ?? investorNpc?.name ?? entry.investorId,
      influence: investor?.influence ?? investorNpc?.reputation ?? 40,
      score: Math.max(0.25, (entry.amount || 0) / 350_000),
    });
  });
  state.projects.forEach((project) => {
    if (!project.studioId || !project.committeeIds?.length) return;
    if (!investorRowsByStudio.has(project.studioId)) investorRowsByStudio.set(project.studioId, []);
    const studioRows = investorRowsByStudio.get(project.studioId);
    project.committeeIds.forEach((investorId) => {
      const investor = investorById.get(investorId);
      const investorNpc = npcById.get(investorId);
      studioRows.push({
        investorId,
        name: investor?.name ?? investorNpc?.name ?? investorId,
        influence: investor?.influence ?? investorNpc?.reputation ?? 40,
        score: 1 + ((project.securedBudget || 0) / Math.max(1, project.budgetNeed || 1)),
      });
    });
  });
  const valuationByStudioId = new Map(state.studios.map((studio) => [
    studio.id,
    computeStudioValuation(studio, (releasesByStudioName.get(studio.name) || []).reduce((sum, rel) => sum + (Number(rel.score) || 0), 0)),
  ]));

  const ratingsByStudioId = new Map(state.studios.map((studio) => [studio.id, computeStudioRating(state, studio, {
    releases: releasesByStudioName.get(studio.name) ?? [],
    projects: projectsByStudioId.get(studio.id) ?? [],
    npcProjects: npcProjectsByStudioId.get(studio.id) ?? [],
    staffByStudio: staffByStudioId,
    investorRowsByStudio,
    valuationByStudioId,
  })]));

  return {
    releasesByStudioName,
    projectsByStudioId,
    npcProjectsByStudioId,
    staffByStudioId,
    investorRowsByStudio,
    valuationByStudioId,
    ratingsByStudioId,
  };
}

function getStudioIntelligence(state, forceRefresh = false) {
  if (!forceRefresh && state.cache.intelligence && state.cache.intelligenceDay === state.day) {
    return state.cache.intelligence;
  }
  const intelligence = buildStudioIntelligenceContext(state);
  state.cache.intelligence = intelligence;
  state.cache.intelligenceDay = state.day;
  return intelligence;
}

function computeInitialStudioFunds(studio) {
  return Math.round((studio.craft + studio.speed + studio.network) * 24_000 + 1_400_000);
}

function pickStudioForAnimator(state, npc, preferredStudioId = null) {
  const studioOccupancy = state.npcs.reduce((acc, row) => {
    if (row.role !== 'animator' || !row.studioId) return acc;
    acc.set(row.studioId, (acc.get(row.studioId) ?? 0) + 1);
    return acc;
  }, new Map());
  const candidates = state.studios.map((studio) => {
    const occupancy = studioOccupancy.get(studio.id) ?? 0;
    const fit = studio.speed * 0.36 + studio.craft * 0.34 + studio.network * 0.18 + studio.scoutPower * 0.12;
    const familiarity = preferredStudioId === studio.id ? 10 : 0;
    const fatiguePenalty = occupancy * 7.5;
    const motivation = (npc.mood * 12) + (npc.ambition * 0.2);
    return { id: studio.id, score: fit + familiarity + motivation - fatiguePenalty };
  });
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.id ?? null;
}

export function createAnimeIndustryRuntime() {
  let state = createInitialState();
  let timer = null;

  function withAction(action, handler) {
    try {
      const result = handler();
      state.debug.lastAction = action;
      if (result) invalidateDerivedCaches(state);
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
      if (profession === 'Animator') state.player.studioId = state.studios[0]?.id ?? null;
      state.projects = [createProject(`ip-${Date.now().toString(36).slice(-6)}`, state.player.writingMedium, createUniquePlayerProjectTitle(state, state.player.writingMedium))];
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

  function openStudioPlanning() {
    return withAction('open-studio-planning', () => {
      if (!state.registered) return false;
      state.player.studioPlanningOpen = true;
      addEmail(state, 'system', 'Perencanaan studio dibuka', 'Inbox investasi pendirian studio sekarang aktif. Anda dapat menerima tawaran investor secara berkala.');
      return true;
    });
  }

  function foundStudioAsCeo(studioName) {
    return withAction('found-studio-as-ceo', () => {
      if (!state.registered) return false;
      const capitalNeed = 1_800_000;
      const personalCapital = Math.max(0, state.cash);
      const investorCapital = Math.max(0, state.player.fundingPool);
      if (personalCapital + investorCapital < capitalNeed) {
        log(state, 'Modal belum cukup untuk mendirikan studio (butuh gabungan dana pribadi/investor).');
        return false;
      }
      const id = `st-player-${Math.random().toString(36).slice(-5)}`;
      const name = String(studioName || '').trim() || `Studio ${state.player.name.split(' ')[0]}`;
      if (state.usedNames.has(name)) {
        log(state, 'Nama studio sudah dipakai. Gunakan nama lain.');
        return false;
      }
      const usePersonal = Math.min(capitalNeed, personalCapital);
      const useInvestor = Math.max(0, capitalNeed - usePersonal);
      const playerShare = useInvestor === 0 ? 100 : Math.max(45, Math.round((usePersonal / capitalNeed) * 100));
      const investorShare = 100 - playerShare;

      state.studios.push({
        id,
        name,
        craft: 58,
        speed: 56,
        network: 44,
        ownership: 'player',
        scoutPower: 50,
        ceoNpcId: null,
        equity: { player: playerShare, investor: investorShare },
        funds: 2_800_000,
      });
      state.usedNames.add(name);
      state.player.studioId = id;
      state.player.career = 'studio-founder';
      state.cash -= usePersonal;
      state.player.fundingPool -= useInvestor;
      log(state, `${name} berdiri. Saham pemain ${playerShare}%${investorShare > 0 ? `, investor ${investorShare}%` : ' (100% dana pribadi)'}.`);
      if (investorShare > 0) {
        addEmail(state, 'investor', `Penawaran lanjutan untuk ${name}`, `Investor meminta evaluasi ulang saham. Saat ini investor memegang ${investorShare}%.`);
      }
      return true;
    });
  }

  function tickNpcEcosystem() {
    const ANIMATOR_SWITCH_COOLDOWN_DAYS = 21;
    const rankedStudios = getRankedStudios(state);
    const studioById = new Map(state.studios.map((studio) => [studio.id, studio]));
    const studioRatingsById = getStudioIntelligence(state, true).ratingsByStudioId;
    const projectById = new Map(state.npcProjects.map((project) => [project.id, project]));
    const audienceSignal = state.projects.reduce((acc, project) => {
      if (project.archived || !project.targetAudience) return acc;
      acc.set(project.targetAudience, (acc.get(project.targetAudience) ?? 0) + project.popularity * 0.05 + project.scriptQuality * 0.03);
      return acc;
    }, new Map());

    for (let index = 0; index < state.npcs.length; index += 1) {
      const npc = state.npcs[index];
      if (!npc.active) continue;
      const kernel = computeNpcDecisionKernel(npc, state);
      npc.mood = clamp(npc.mood + (state.market.trend - 1) * 0.08 + (kernel.discipline - 0.5) * 0.05, 0.05, 0.95);
      npc.reputation = clamp(npc.reputation + (kernel.discipline - 0.48) * 0.12, 1, 99);

      if (npc.role === 'investor') {
        const investorIncome = Math.floor(34_000 + npc.ambition * 180 + kernel.discipline * 16_000);
        npc.cash += investorIncome;
        const investorPulse = 0.5 + kernel.riskBudget * 0.35 + kernel.discipline * 0.15;
        if (state.day % 4 === index % 4 && npc.cash > 1_500_000 && state.studios.length) {
          const investorRef = state.investors[index % state.investors.length];
          const preferredStudioId = pickStudioForAnimator(state, { ...npc, mood: kernel.discipline, ambition: npc.ambition });
          const targetStudio = state.studios.find((studio) => studio.id === preferredStudioId) || state.studios[index % state.studios.length];
          if (targetStudio) {
            const studioRating = studioRatingsById.get(targetStudio.id);
            const investmentPull = studioRating?.multipliers?.investorAttractiveness ?? 1;
            const influence = investorRef?.influence ?? npc.reputation ?? 40;
            const amount = Math.round((120_000 + influence * 10_000) * (0.68 + investorPulse) * investmentPull);
            const cappedAmount = Math.min(amount, Math.max(0, npc.cash - 500_000));
            if (cappedAmount > 0) {
              npc.cash -= cappedAmount;
              state.studioInvestments.push({
                id: `inv-${investorRef?.id ?? npc.id}-${targetStudio.id}-${state.day}`,
                investorId: investorRef?.id ?? npc.id,
                studioId: targetStudio.id,
                amount: cappedAmount,
                day: state.day,
              });
              if (state.studioInvestments.length > 500) state.studioInvestments.splice(0, state.studioInvestments.length - 500);
            }
          }
        }
        if (state.player.studioPlanningOpen && npc.cash > 3_000_000 && index % 3 === state.day % 3) {
          const amount = Math.floor((180_000 + npc.ambition * 1700) * (0.72 + investorPulse));
          state.player.fundingPool += amount;
          npc.cash -= amount;
        }
      }

      if (npc.role === 'animator') {
        const canEvaluateSwitch = !npc.studioId || (state.day + index) % 17 === 0;
        const cooldownReady = !npc.lastStudioSwitchDay || (state.day - npc.lastStudioSwitchDay) >= ANIMATOR_SWITCH_COOLDOWN_DAYS;
        if (canEvaluateSwitch && cooldownReady) {
          const nextStudioId = pickStudioForAnimator(state, npc, npc.studioId);
          if (nextStudioId && nextStudioId !== npc.studioId) {
            npc.studioId = nextStudioId;
            npc.lastStudioSwitchDay = state.day;
            if ((state.day + index) % 17 === 0) log(state, `${npc.name} berpindah ke ${studioById.get(nextStudioId)?.name ?? 'studio baru'} untuk proyek yang lebih cocok.`);
          }
        }
      }

      if (npc.role === 'animator' && npc.studioId) {
        const studio = studioById.get(npc.studioId);
        if (studio) {
          studio.speed = clamp(studio.speed + 0.015 + npc.mood * 0.01 + kernel.discipline * 0.012, 1, 99);
          studio.craft = clamp(studio.craft + 0.014 + npc.reputation * 0.0006 + kernel.discipline * 0.01, 1, 99);
        }
      }

      if (npc.role === 'ceo-studio' && npc.studioId) {
        const studio = studioById.get(npc.studioId);
        if (studio) {
          studio.network = clamp(studio.network + 0.02 + npc.mood * 0.015 + kernel.discipline * 0.02, 1, 99);
          studio.scoutPower = clamp(studio.scoutPower + 0.01 + kernel.riskBudget * 0.02, 1, 99);
        }
      }

      const isWriter = npc.role === 'mangaka' || npc.writesManga || npc.role === 'novelis';
      if (!isWriter) continue;
      if (!npc.currentProject) {
        const launchIntent = kernel.discipline * 0.58 + kernel.riskBudget * 0.42 + (npc.ambition / 100) * 0.24;
        if (launchIntent < 0.52) {
          npc.reputation = clamp(npc.reputation + 0.04, 1, 99);
          continue;
        }
        const npcProject = createNpcProject(state, npc, state.day);
        state.npcProjects.push(npcProject);
        projectById.set(npcProject.id, npcProject);
        npc.currentProject = npcProject.id;
        log(state, `${npc.name} memulai serial baru: ${npcProject.title}.`);
        continue;
      }

      const project = projectById.get(npc.currentProject);
      if (!project || project.launched) {
        npc.currentProject = null;
        continue;
      }

      if (project.stage === 'serialization') {
        const affinity = computeGenreAudienceAffinity(project.genre, project.targetAudience, npc);
        const liveAudienceDemand = audienceSignal.get(project.targetAudience) ?? 0;
        const writingBoost = 1 + (npc.ambition > 62 ? 1 : 0) + (kernel.discipline > 0.7 ? 1 : 0);
        project.chapters += writingBoost;
        project.quality = clamp(project.quality + 1.1 + (npc.ambition / 130) + kernel.discipline * 0.7 + affinity * 0.45 + liveAudienceDemand * 0.015, 1, 100);
        project.plotQuality = clamp((project.plotQuality ?? project.quality) + 0.94 + kernel.discipline * 0.42 + affinity * 0.32, 1, 100);
        project.visualQuality = clamp((project.visualQuality ?? project.quality) + 0.72 + (npc.reputation / 210) + liveAudienceDemand * 0.01, 1, 100);
        project.competitiveness = clamp((project.competitiveness ?? 34) + 0.58 + kernel.riskBudget * 0.34, 1, 100);
        project.popularity = clamp(project.popularity + 0.85 + (npc.reputation / 190) + kernel.riskBudget * 0.5 + affinity * 0.55 + liveAudienceDemand * 0.03, 1, 100);
        if (project.chapters >= 10) {
          project.stage = 'studio-interest';
          const ownStudio = npc.writesManga && npc.studioId ? studioById.get(npc.studioId) : null;
          const studio = ownStudio ?? studioById.get(rankedStudios[index % rankedStudios.length]);
          project.studioId = studio?.id ?? null;
          log(state, `${project.title} karya ${npc.name} dilirik ${studio?.name ?? 'studio'} untuk adaptasi anime.`);
        }
        continue;
      }
      if (project.stage === 'studio-interest') {
        project.stage = 'production';
        continue;
      }
      if (project.stage === 'production') {
        const studio = studioById.get(project.studioId);
        const studioMomentum = studio ? (studioRatingsById.get(studio.id)?.multipliers?.projectMomentum ?? 1) : 1;
        const speed = ((studio?.speed ?? 50) / 100) * 3.1 * studioMomentum;
        project.productionProgress = clamp(project.productionProgress + 1.8 + speed + npc.mood + kernel.discipline * 0.6, 0, 100);
        if (project.productionProgress >= 100) project.stage = 'launch-ready';
        continue;
      }
      if (project.stage === 'launch-ready') {
        project.launched = true;
        const studio = studioById.get(project.studioId);
        const affinity = computeGenreAudienceAffinity(project.genre, project.targetAudience, npc);
        const releaseScore = Math.max(52, project.quality * 0.24 + (project.plotQuality ?? project.quality) * 0.31 + (project.visualQuality ?? project.quality) * 0.29 + (project.competitiveness ?? 30) * 0.16 + project.popularity * 0.33 + ((studio?.craft ?? 60) * 0.2) + kernel.discipline * 3.2 + affinity * 3.4);
        const uniqueness = clamp((project.competitiveness ?? 30) + affinity * 20, 5, 100);
        const communityModifiers = computeCommunityImdbModifiers(state, {
          medium: 'anime',
          targetAudience: project.targetAudience || 'general',
          uniqueness,
          ageDays: 0,
        });
        const imdbScore = computeAudienceImdbSignal({
          visualQuality: project.visualQuality ?? project.quality,
          plotQuality: project.plotQuality ?? project.quality,
          competitiveness: project.competitiveness ?? 30,
          trend: state.market.trend,
          uniqueness,
          mediumBoost: 0.08 + communityModifiers.mediumBoost,
          marketBaseline: communityModifiers.marketBaseline,
          ageDays: 0,
        });
        project.imdbScore = imdbScore;
        project.ratingsCount = Math.round(4_000 + releaseScore * 120);
        state.releases.push({
          id: project.id,
          title: project.title,
          medium: 'manga-npc',
          score: releaseScore,
          imdb: imdbScore,
          ratings: project.ratingsCount,
          revenue: Math.round(1_600_000 + releaseScore * 55_000),
          studio: studio?.name ?? 'Unknown Studio',
          day: state.day,
        });
        log(state, `${project.title} (NPC ${npc.name}) resmi rilis anime.`);
        npc.currentProject = null;
        npc.cash += Math.round(220_000 + releaseScore * 8_500 * (0.35 + kernel.riskBudget));
      }
    }

    if (state.registered && state.player.studioPlanningOpen && state.day % 9 === 0) {
      const investor = state.investors[state.day % state.investors.length];
      const amount = 1_100_000 + ((state.day % 5) * 350_000);
      state.player.fundingPool += amount;
      addEmail(
        state,
        'investor',
        `Inbox: Tawaran investasi ${investor.name}`,
        `${investor.name} menawarkan dana ${formatMoneyCompact(amount)} untuk ekspansi produksi. Dana otomatis masuk ke funding pool.`
      );
    }
  }

  function runStudioFinanceCycle() {
    const studioById = new Map(state.studios.map((studio) => [studio.id, studio]));
    const animatorCountByStudio = state.npcs.reduce((acc, npc) => {
      if (npc.role === 'animator' && npc.studioId) acc.set(npc.studioId, (acc.get(npc.studioId) ?? 0) + 1);
      return acc;
    }, new Map());
    const activeProjectsByStudio = state.projects.reduce((acc, project) => {
      if (!project.studioId || project.archived) return acc;
      if (!acc.has(project.studioId)) acc.set(project.studioId, []);
      acc.get(project.studioId).push(project);
      return acc;
    }, new Map());
    const todaysInvestments = state.studioInvestments.reduce((acc, item) => {
      if (item.day !== state.day) return acc;
      acc.set(item.studioId, (acc.get(item.studioId) ?? 0) + item.amount);
      return acc;
    }, new Map());
    const releaseSignalByStudioName = state.releases.reduce((acc, release) => {
      const age = Math.max(0, state.day - release.day);
      if (age > 180) return acc;
      const attention = (release.medium === 'movie' ? 1.2 : 1) * Math.max(0.08, 1 - age / 180);
      acc.set(release.studio, (acc.get(release.studio) ?? 0) + release.score * attention);
      return acc;
    }, new Map());
    const studioRatingsById = getStudioIntelligence(state, true).ratingsByStudioId;

    for (let i = 0; i < state.studios.length; i += 1) {
      const studio = state.studios[i];
      if (!Number.isFinite(studio.funds)) studio.funds = computeInitialStudioFunds(studio);
      const valuation = computeStudioValuation(studio, releaseSignalByStudioName.get(studio.name) ?? 0);
      const tier = classifyStudio(studio, valuation).tier;
      const finance = getTierFinanceProfile(tier);
      const staffCount = animatorCountByStudio.get(studio.id) ?? 0;
      const projects = activeProjectsByStudio.get(studio.id) ?? [];
      const studioRating = studioRatingsById.get(studio.id);
      const marketingEfficiency = studioRating?.multipliers?.marketingEfficiency ?? 1;
      const investorAttractiveness = studioRating?.multipliers?.investorAttractiveness ?? 1;

      const governmentSupport = finance.support + Math.round((studio.network + studio.scoutPower) * 90);
      const volumeSalesBase = projects
        .filter((project) => ['manga', 'novel'].includes(project.medium))
        .reduce((sum, project) => sum + (28_000 + project.chapters * 8_500 + project.popularity * 1_100), 0);
      const volumeSales = Math.round(volumeSalesBase * marketingEfficiency);
      const screeningRevenue = Math.round((releaseSignalByStudioName.get(studio.name) ?? 0) * 2_650 * marketingEfficiency);
      const investorIncome = Math.round((todaysInvestments.get(studio.id) ?? 0) * investorAttractiveness);
      const income = governmentSupport + volumeSales + screeningRevenue + investorIncome;

      const salaryExpense = staffCount * finance.salaryBase + 76_000;
      const marketingExpense = Math.round(projects.reduce((sum, project) => sum + (22_000 + project.popularity * 360 + (project.medium === 'movie' ? 18_000 : 0)), 0) * clamp(1.05 - (marketingEfficiency - 1) * 0.14, 0.72, 1.18));
      const productionExpense = projects.reduce((sum, project) => sum + (
        ['production', 'postproduction'].includes(project.stage) ? 145_000 : ['preproduction', 'committee_setup'].includes(project.stage) ? 92_000 : 38_000
      ), 0);
      const committeeExpense = projects.reduce((sum, project) => sum + ((project.committeeIds?.length ?? 0) * 11_000), 0);
      const maintenanceExpense = finance.maintenance + Math.round((studio.craft + studio.speed) * 420);
      const taxableBase = Math.max(0, income - (salaryExpense + marketingExpense + productionExpense + committeeExpense + maintenanceExpense));
      const taxExpense = Math.round(taxableBase * finance.taxRate);
      const annualTaxSettlement = state.day % 365 === 0 ? Math.round(Math.max(0, valuation * 0.005)) : 0;

      const expense = salaryExpense + marketingExpense + productionExpense + committeeExpense + maintenanceExpense + taxExpense + annualTaxSettlement;
      const net = income - expense;
      studio.funds += net;
      if (studio.funds < 0) {
        studio.network = clamp(studio.network - 0.08, 1, 99);
        studio.speed = clamp(studio.speed - 0.06, 1, 99);
      } else {
        studio.network = clamp(studio.network + 0.02, 1, 99);
      }

      state.studioFinanceLedger.push({
        day: state.day,
        studioId: studio.id,
        income,
        expense,
        net,
        funds: Math.round(studio.funds),
      });
    }
    if (state.studioFinanceLedger.length > 900) state.studioFinanceLedger.splice(0, state.studioFinanceLedger.length - 900);
  }

  function tick(days = 1) {
    for (let i = 0; i < days; i += 1) {
      state.day += 1;
      invalidateDerivedCaches(state);
      state.market.trend = Math.max(0.55, Math.min(1.55, 1 + Math.sin(state.day / 17) * 0.18 - state.market.audienceFatigue * 0.12));
      state.market.audienceFatigue = Math.max(0.05, Math.min(0.72, state.market.audienceFatigue + 0.002));

      if (state.player.career === 'animator' && state.player.studioId) {
        const studio = state.studios.find((entry) => entry.id === state.player.studioId);
        if (studio) {
          state.cash += 65_000;
          studio.craft = Math.min(98, studio.craft + 0.04);
        }
      }

      tickNpcEcosystem();
      runStudioFinanceCycle();

      state.projects.forEach((project) => {
        if (project.stage === 'committee_setup') {
          const committeeStrength = project.committeeIds.reduce((sum, id) => {
            const investor = state.investors.find((entry) => entry.id === id);
            return sum + (investor ? investor.influence : 0);
          }, 0);
          const fundingGap = Math.max(0, project.budgetNeed - project.securedBudget);
          const fundingTick = Math.min(fundingGap, Math.round(160_000 + committeeStrength * 1400 + state.player.adminScore * 620));
          project.securedBudget = Math.min(project.budgetNeed, project.securedBudget + fundingTick);
          if (project.securedBudget >= project.budgetNeed * 0.8 && project.committeeApproved) {
            project.stage = 'preproduction';
            log(state, `${project.title} lolos komite dan masuk pre-production.`);
          }
        }

        if (project.stage === 'production' || project.stage === 'postproduction') {
          const studio = state.studios.find((entry) => entry.id === project.studioId);
          const speed = (studio?.speed ?? 50) / 100;
          const committee = project.committeeFinance;
          const episodeBudget = (committee?.committeeBudget ?? project.budgetNeed) / Math.max(1, project.plannedEpisodes || 12);
          const burnRate = project.stage === 'production' ? 0.9 : 0.45;
          const burnCost = Math.round(episodeBudget * burnRate * (project.medium === 'movie' ? 1.18 : 1));
          if (committee) {
            const projectedSpent = committee.spent + burnCost;
            if (projectedSpent > project.securedBudget) {
              const shortfall = projectedSpent - project.securedBudget;
              requestCommitteeTopUp(project, state, shortfall);
            }
            committee.spent += burnCost;
            committee.allocationSpent.visual += burnCost * committee.allocations.visual;
            committee.allocationSpent.plot += burnCost * committee.allocations.plot;
            committee.allocationSpent.audio += burnCost * committee.allocations.audio;
            committee.allocationSpent.marketing += burnCost * committee.allocations.marketing;
            committee.allocationSpent.administration += burnCost * committee.allocations.administration;
          }
          if (studio) studio.funds = (studio.funds || 0) - burnCost * 0.08;

          project.productionProgress = Math.min(100, project.productionProgress + 1.5 + speed * 2.8);
          const visualBudgetQualityBoost = committee ? clamp((committee.allocations.visual * 1.45) - 0.28, 0.12, 0.42) : 0.24;
          const plotBudgetQualityBoost = committee ? clamp((committee.allocations.plot * 1.35) - 0.2, 0.1, 0.34) : 0.18;
          project.visualQuality = Math.min(100, (project.visualQuality ?? project.scriptQuality) + visualBudgetQualityBoost + (studio?.craft ?? 50) * 0.004);
          project.plotQuality = Math.min(100, (project.plotQuality ?? project.scriptQuality) + plotBudgetQualityBoost + (studio?.craft ?? 50) * 0.0032);
          project.competitiveness = Math.min(100, (project.competitiveness ?? 35) + 0.08 + (studio?.network ?? 50) * 0.0015 + (committee?.allocations.marketing ?? 0.14) * 0.4);
          project.delayRisk = Math.max(0.03, project.delayRisk - 0.002 + (state.market.audienceFatigue - 0.2) * 0.001);
          if (project.productionProgress >= 100 && project.stage === 'production') {
            project.stage = 'postproduction';
            log(state, `${project.title} masuk tahap post-production.`);
          }
        }
      });

      const popularityChanged = rebalancePopularityMarkets(state);
      if (popularityChanged) invalidateDerivedCaches(state);
    }
    return state;
  }

  function brainstormProject() {
    return withAction('brainstorm-project', () => {
      if (!state.registered) return false;
      const medium = state.player.writingMedium;
      state.projects.push(createProject(`ip-${(Math.random() * 1e9).toFixed(0)}`, medium, createUniquePlayerProjectTitle(state, medium)));
      state.cash -= medium === 'novel' ? 150_000 : 250_000;
      log(state, `Konsep ${medium} baru dibuat.`);
      return true;
    });
  }

  function createProjectFromDraft(draft) {
    return withAction('create-project-from-draft', () => {
      if (!state.registered) return false;
      const profile = resolveProjectProfile(draft?.medium, draft?.genre, draft?.theme, draft?.targetAudience);
      const medium = profile?.medium ?? null;
      const title = String(draft?.title || '').trim();
      const genre = profile?.genre ?? '';
      const theme = profile?.theme ?? '';
      const targetAudience = profile?.targetAudience ?? '';
      if (!medium || !title || !genre || !theme || !targetAudience) return false;
      if (state.usedNames.has(title)) return false;

      const conceptCost = medium === 'novel' ? 160_000 : medium === 'manga' ? 260_000 : medium === 'anime' ? 680_000 : 1_050_000;
      if (state.cash < conceptCost) return false;

      const project = createProject(`ip-${(Math.random() * 1e9).toFixed(0)}`, medium, title);
      const signature = createMetadataSignature({ title, genre, theme, targetAudience });
      const realismBoost = ((signature % 17) + state.reputation * 0.06 + state.player.adminScore * 0.1) * 0.35;
      project.genre = genre;
      project.theme = theme;
      project.targetAudience = targetAudience;
      project.scriptQuality = clamp(project.scriptQuality + realismBoost + (medium === 'movie' ? 4 : medium === 'anime' ? 3 : 2), 8, 45);
      project.plotQuality = clamp(project.scriptQuality + (signature % 11) * 0.7 + (medium === 'novel' ? 4 : 2), 10, 64);
      project.visualQuality = clamp((project.visualQuality ?? 18) + (signature % 9) * 0.8 + (medium === 'movie' ? 6 : medium === 'anime' ? 5 : medium === 'manga' ? 4 : 2), 14, 66);
      project.competitiveness = clamp((project.competitiveness ?? 28) + (signature % 13) * 0.9 + state.reputation * 0.08, 18, 72);
      project.popularity = clamp(project.popularity + (signature % 9) + (targetAudience.length > 10 ? 2 : 0), 6, 40);
      project.chapters = medium === 'anime' ? 2 : medium === 'movie' ? 3 : 0;
      if (medium === 'anime' || medium === 'movie') project.stage = 'manga_serialization';

      state.projects.push(project);
      state.usedNames.add(title);
      state.cash -= conceptCost;
      log(state, `${title} (${medium}) resmi masuk pipeline. Genre: ${genre}; Tema: ${theme}; Audience: ${targetAudience}.`);
      return true;
    });
  }

  function serializeChapter(projectId) {
    return withAction('serialize-chapter', () => {
      const project = byId(state, projectId);
      if (!project || !['ideation', 'manga_serialization'].includes(project.stage)) return false;
      project.stage = 'manga_serialization';
      project.chapters += 1;
      const qualityBoost = project.medium === 'novel' ? 2.2 : project.medium === 'movie' ? 1.6 : project.medium === 'anime' ? 1.7 : 1.8;
      project.scriptQuality = Math.min(100, project.scriptQuality + qualityBoost);
      project.plotQuality = Math.min(100, (project.plotQuality ?? project.scriptQuality) + qualityBoost * 1.14);
      project.competitiveness = Math.min(100, (project.competitiveness ?? 30) + 0.7 + (project.popularity / 250));
      project.popularity = Math.min(100, project.popularity + Math.max(1, 2.4 - state.market.audienceFatigue));
      state.cash -= project.medium === 'novel' ? 80_000 : project.medium === 'anime' ? 170_000 : project.medium === 'movie' ? 240_000 : 120_000;
      return true;
    });
  }

  function pitchToStudio(projectId) {
    return withAction('pitch-to-studio', () => {
      const project = byId(state, projectId);
      const pitchThreshold = getPitchReadinessThreshold(project);
      if (!project || project.chapters < pitchThreshold) return false;
      const score = computeStageScore(project, state.market, state);
      if (score < 38) return false;

      const rankedStudios = getRankedStudios(state);
      const interested = rankedStudios.slice(0, Math.max(1, Math.min(3, 1 + Math.floor(score / 55))));
      if (state.player.career === 'studio-founder' && state.player.studioId && !interested.includes(state.player.studioId)) {
        interested.unshift(state.player.studioId);
      }

      project.stage = 'studio_interest';
      project.interestedStudioIds = interested;
      project.studioId = interested.length === 1 ? interested[0] : null;
      project.delayRisk = Math.max(0.08, project.delayRisk - 0.03);
      const destination = project.medium === 'movie' ? 'film anime' : 'adaptasi anime';
      log(state, `${project.title} dilirik ${interested.length} studio untuk ${destination}.`);
      addEmail(state, 'studio-offer', `Inbox: Tawaran studio untuk ${project.title}`, `${interested.length} studio tertarik. Buka Production Committee untuk memilih partner studio.`);
      return true;
    });
  }

  function chooseAdaptationStudio(projectId, studioId) {
    return withAction('choose-adaptation-studio', () => {
      const project = byId(state, projectId);
      if (!project || !['studio_interest', 'committee_setup'].includes(project.stage)) return false;
      if (!project.interestedStudioIds.includes(studioId)) return false;
      project.studioId = studioId;
      if (project.stage === 'studio_interest') project.stage = 'committee_setup';
      log(state, `${project.title} memilih ${state.studios.find((entry) => entry.id === studioId)?.name ?? 'studio'} sebagai partner produksi.`);
      return true;
    });
  }

  function formCommittee(projectId) {
    return withAction('form-committee', () => {
      const project = byId(state, projectId);
      if (!project || !['studio_interest', 'committee_setup'].includes(project.stage)) return false;
      if (!project.studioId) return false;
      const studio = state.studios.find((entry) => entry.id === project.studioId);
      const blueprint = buildCommitteeBudgetBlueprint(project, studio, state);
      project.stage = 'committee_setup';
      project.delayRisk = Math.max(0.05, project.delayRisk - 0.02);
      project.plannedEpisodes = blueprint.plannedEpisodes;
      project.budgetNeed = blueprint.committeeBudget;
      project.committeeFinance = {
        committeeBudget: blueprint.committeeBudget,
        spent: 0,
        debtToCommittee: 0,
        topUpRounds: 0,
        allocations: blueprint.allocations,
        allocationSpent: { visual: 0, plot: 0, audio: 0, marketing: 0, administration: 0 },
        committeeContributions: {},
        reviewHistory: [],
      };
      while (project.committeeIds.length < 3) {
        const candidate = state.investors[(state.day + project.committeeIds.length) % state.investors.length];
        if (!project.committeeIds.includes(candidate.id)) project.committeeIds.push(candidate.id);
      }
      const raised = project.committeeIds.reduce((sum, id) => {
        const inv = state.investors.find((entry) => entry.id === id);
        const contribution = inv ? Math.round(2_300_000 + inv.influence * 9_000) : 0;
        project.committeeFinance.committeeContributions[id] = contribution;
        return sum + contribution;
      }, 0);
      project.securedBudget = Math.min(project.budgetNeed, raised);
      project.committeeNegotiationLog.push(`Komite dibentuk. Target ${project.plannedEpisodes} episode, kebutuhan anggaran ${formatMoneyCompact(project.budgetNeed)}.`);
      return true;
    });
  }

  function discussCommitteeContract(projectId) {
    return withAction('discuss-committee-contract', () => {
      const project = byId(state, projectId);
      if (!project || project.stage !== 'committee_setup' || !project.studioId) return false;
      const studio = state.studios.find((entry) => entry.id === project.studioId);
      const ceoNpc = state.npcs.find((entry) => entry.id === studio?.ceoNpcId);
      const investorNpc = state.npcs.find((entry) => entry.role === 'investor');
      const bargainingPower = state.reputation + state.player.adminScore * 0.5 + project.chapters;

      if (bargainingPower >= 40) {
        project.contractDraft.creatorShare = Math.min(48, project.contractDraft.creatorShare + 2);
        project.contractDraft.studioShare = Math.max(34, project.contractDraft.studioShare - 1);
      } else {
        project.contractDraft.creatorShare = Math.max(28, project.contractDraft.creatorShare - 1);
        project.contractDraft.studioShare = Math.min(52, project.contractDraft.studioShare + 1);
      }

      project.contractDraft.investorShare = Math.max(16, 100 - project.contractDraft.creatorShare - project.contractDraft.studioShare);
      const total = project.contractDraft.creatorShare + project.contractDraft.studioShare + project.contractDraft.investorShare;
      if (total !== 100) project.contractDraft.studioShare += 100 - total;

      const line = `${ceoNpc?.name ?? 'CEO Studio'} & ${investorNpc?.name ?? 'Investor NPC'} menilai draft ${project.contractDraft.creatorShare}/${project.contractDraft.studioShare}/${project.contractDraft.investorShare}.`;
      project.committeeNegotiationLog.push(line);
      if (project.committeeNegotiationLog.length > 7) project.committeeNegotiationLog.shift();

      if (project.committeeNegotiationLog.length >= 3) {
        project.committeeApproved = project.securedBudget >= project.budgetNeed * 0.68;
        if (!project.committeeApproved) {
          project.committeeNegotiationLog.push('Draft disetujui, namun dana belum cukup. Komite menunggu putaran pendanaan berikutnya.');
        }
      }
      return true;
    });
  }

  function startProduction(projectId) {
    return withAction('start-production', () => {
      const project = byId(state, projectId);
      if (!project || !project.committeeApproved || project.securedBudget < project.budgetNeed * 0.78) return false;
      if (project.stage === 'committee_setup') project.stage = 'preproduction';
      if (project.stage === 'preproduction') {
        project.stage = 'production';
        const committee = project.committeeFinance;
        const studio = state.studios.find((entry) => entry.id === project.studioId);
        const prepCost = Math.round((project.budgetNeed || 0) * 0.08);
        if (committee) {
          committee.spent += prepCost;
          committee.allocationSpent.administration += prepCost * 0.42;
          committee.allocationSpent.visual += prepCost * 0.28;
          committee.allocationSpent.plot += prepCost * 0.2;
          committee.allocationSpent.audio += prepCost * 0.1;
        }
        if (studio) studio.funds = (studio.funds || 0) - prepCost * 0.06;
        log(state, `${project.title} resmi mulai produksi (${project.plannedEpisodes} episode).`);
        return true;
      }
      return false;
    });
  }

  function launchAnime(projectId) {
    return withAction('launch-anime', () => {
      const project = byId(state, projectId);
      if (!project || !['postproduction', 'committee_review', 'release'].includes(project.stage)) return false;
      const studio = state.studios.find((entry) => entry.id === project.studioId);
      if (project.stage === 'postproduction' || project.stage === 'committee_review') {
        const review = runCommitteeQualityReview(project, state, studio);
        if (!review.passed) {
          project.stage = 'production';
          project.productionProgress = Math.max(58, project.productionProgress - 24);
          project.delayRisk = clamp(project.delayRisk + 0.025, 0.03, 0.52);
          project.committeeNegotiationLog.push(`Review komite menolak rilis (score ${review.reviewScore.toFixed(1)}). Studio wajib revisi kualitas visual/alur.`);
          if (project.committeeNegotiationLog.length > 10) project.committeeNegotiationLog.shift();
          return false;
        }
        project.stage = 'release';
      }
      const competitionPressure = computeCompetitivePressure(state, project.medium);
      const score = computeReleaseScore(project, studio, state.market) - competitionPressure * 6.2;
      project.archived = true;
      const creatorRatio = project.contractDraft.creatorShare / 100;
      const revenue = Math.floor((2_800_000 + score * 92_000) * creatorRatio);
      const uniqueness = clamp((project.competitiveness ?? 35) - competitionPressure * 24 + ((project.genre || '').length % 6) * 2.4, 5, 100);
      const communityModifiers = computeCommunityImdbModifiers(state, {
        medium: project.medium,
        targetAudience: project.targetAudience || 'general',
        uniqueness,
        ageDays: 0,
      });
      const imdb = computeAudienceImdbSignal({
        visualQuality: project.visualQuality ?? project.scriptQuality,
        plotQuality: project.plotQuality ?? project.scriptQuality,
        competitiveness: project.competitiveness ?? 35,
        trend: state.market.trend,
        uniqueness,
        mediumBoost: (project.medium === 'movie' ? 0.16 : 0.05) + communityModifiers.mediumBoost,
        marketBaseline: communityModifiers.marketBaseline,
        ageDays: 0,
      });
      const ratings = Math.max(850, Math.round(6_500 + score * 190 + (project.popularity || 0) * 65));
      const previousImdb = Number(project.imdbScore) || 5.2;
      const previousRatings = Number(project.ratingsCount) || 0;
      project.ratingsCount = previousRatings + ratings;
      project.imdbScore = clamp(((previousImdb * previousRatings) + (imdb * ratings)) / Math.max(1, project.ratingsCount), IMDB_MIN, IMDB_MAX);
      state.cash += revenue;
      if (project.committeeFinance?.debtToCommittee) {
        const debtPayment = Math.round(project.committeeFinance.debtToCommittee * 0.38);
        const paid = Math.min(revenue, debtPayment);
        state.cash -= paid;
        project.committeeFinance.debtToCommittee = Math.max(0, project.committeeFinance.debtToCommittee - paid);
      }
      state.reputation = Math.min(100, state.reputation + (score >= 88 ? 8 : score >= 65 ? 5 : 2));
      state.releases.push({ id: project.id, title: project.title, medium: project.medium, score, imdb: project.imdbScore, ratings: project.ratingsCount, revenue, studio: studio?.name ?? 'Unknown Studio', day: state.day });
      return true;
    });
  }

  function markEmailRead(emailId) {
    return withAction('mark-email-read', () => {
      const email = state.emails.find((entry) => entry.id === emailId);
      if (!email) return false;
      email.read = true;
      return true;
    });
  }

  function exportCompactSave() {
    return withAction('export-compact-save', () => {
      const compact = {
        v: 1,
        d: state.day,
        c: Math.round(state.cash),
        r: Math.round(state.reputation),
        p: {
          n: state.player.name,
          i: state.player.initialProfession,
          cr: state.player.career,
          wm: state.player.writingMedium,
          sid: state.player.studioId,
          a: Math.round(state.player.adminScore),
          f: Math.round(state.player.fundingPool),
          sp: !!state.player.studioPlanningOpen,
        },
        s: state.studios.map((entry) => ({ id: entry.id, n: entry.name, c: entry.craft, sp: entry.speed, nw: entry.network, o: entry.ownership, sc: entry.scoutPower, ceo: entry.ceoNpcId, eqp: entry.equity?.player ?? 0, eqi: entry.equity?.investor ?? 0, fd: entry.funds ?? 0 })),
        pj: state.projects.map((entry) => ({ id: entry.id, t: entry.title, m: entry.medium, st: entry.stage, p: entry.popularity, q: entry.scriptQuality, vq: entry.visualQuality, pq: entry.plotQuality, cp: entry.competitiveness, im: clamp(entry.imdbScore, IMDB_MIN, IMDB_MAX), rc: entry.ratingsCount, ch: entry.chapters, sid: entry.studioId, ints: entry.interestedStudioIds, cm: entry.committeeIds, cd: entry.contractDraft, ca: entry.committeeApproved, bn: entry.budgetNeed, sb: entry.securedBudget, pp: entry.productionProgress, dr: entry.delayRisk, ar: !!entry.archived, g: entry.genre, th: entry.theme, ta: entry.targetAudience, pe: entry.plannedEpisodes, cf: entry.committeeFinance })),
        iv: state.studioInvestments.slice(-500).map((entry) => ({ id: entry.id, iid: entry.investorId, sid: entry.studioId, am: entry.amount, d: entry.day })),
        fl: state.studioFinanceLedger.slice(-600).map((entry) => ({ d: entry.day, sid: entry.studioId, i: entry.income, e: entry.expense, n: entry.net, f: entry.funds })),
        rl: state.releases.slice(-30).map((entry) => ({ id: entry.id, t: entry.title, s: entry.score, im: clamp(entry.imdb, IMDB_MIN, IMDB_MAX), rt: entry.ratings, rv: entry.revenue, st: entry.studio, d: entry.day })),
        em: state.emails.slice(-40).map((entry) => ({ id: entry.id, s: entry.subject, b: entry.body, r: entry.read, t: entry.type, d: entry.day })),
      };
      return `AI26:${JSON.stringify(compact)}`;
    });
  }

  function importCompactSave(rawText) {
    return withAction('import-compact-save', () => {
      const raw = String(rawText || '').trim();
      if (!raw.startsWith('AI26:')) return false;
      const data = JSON.parse(raw.slice(5));
      if (!data || typeof data !== 'object') return false;

      const fresh = createInitialState();
      fresh.registered = true;
      fresh.day = Number(data.d) || 0;
      fresh.cash = Number(data.c) || 0;
      fresh.reputation = Number(data.r) || 0;
      fresh.player = {
        ...fresh.player,
        name: data.p?.n ?? fresh.player.name,
        initialProfession: data.p?.i ?? fresh.player.initialProfession,
        career: data.p?.cr ?? fresh.player.career,
        writingMedium: data.p?.wm ?? fresh.player.writingMedium,
        studioId: data.p?.sid ?? fresh.player.studioId,
        adminScore: Number(data.p?.a) || 0,
        fundingPool: Number(data.p?.f) || 0,
        studioPlanningOpen: !!data.p?.sp,
      };
      fresh.studios = Array.isArray(data.s) ? data.s.map((entry) => ({
        id: entry.id, name: entry.n, craft: Number(entry.c) || 50, speed: Number(entry.sp) || 50, network: Number(entry.nw) || 50,
        ownership: entry.o ?? 'external', scoutPower: Number(entry.sc) || 50, ceoNpcId: entry.ceo ?? null,
        equity: { player: Number(entry.eqp) || 0, investor: Number(entry.eqi) || 0 }, funds: Number(entry.fd) || computeInitialStudioFunds({ craft: Number(entry.c) || 50, speed: Number(entry.sp) || 50, network: Number(entry.nw) || 50 }),
      })) : fresh.studios;
      fresh.projects = Array.isArray(data.pj) ? data.pj.map((entry) => ({
        id: entry.id, title: entry.t, medium: entry.m, stage: entry.st, popularity: Number(entry.p) || 0, scriptQuality: Number(entry.q) || 0,
        visualQuality: Number(entry.vq) || Number(entry.q) || 0, plotQuality: Number(entry.pq) || Number(entry.q) || 0, competitiveness: Number(entry.cp) || 30,
        imdbScore: clamp(Number(entry.im) || 5.2, IMDB_MIN, IMDB_MAX), ratingsCount: Number(entry.rc) || 0,
        chapters: Number(entry.ch) || 0, studioId: entry.sid ?? null, interestedStudioIds: Array.isArray(entry.ints) ? entry.ints : [],
        committeeIds: Array.isArray(entry.cm) ? entry.cm : [], committeeNegotiationLog: [], contractDraft: entry.cd ?? { creatorShare: 38, studioShare: 42, investorShare: 20 },
        committeeApproved: !!entry.ca, budgetNeed: Number(entry.bn) || 10_000_000, securedBudget: Number(entry.sb) || 0, productionProgress: Number(entry.pp) || 0, plannedEpisodes: Number(entry.pe) || (entry.m === 'anime' ? 12 : entry.m === 'movie' ? 1 : 0),
        committeeFinance: entry.cf ?? { committeeBudget: Number(entry.bn) || 10_000_000, spent: 0, debtToCommittee: 0, topUpRounds: 0, allocations: { visual: 0.37, plot: 0.23, audio: 0.15, marketing: 0.14, administration: 0.11 }, allocationSpent: { visual: 0, plot: 0, audio: 0, marketing: 0, administration: 0 }, committeeContributions: {}, reviewHistory: [] },
        delayRisk: Number(entry.dr) || 0.1, archived: !!entry.ar, genre: entry.g ?? '', theme: entry.th ?? '', targetAudience: entry.ta ?? '',
      })) : [];
      fresh.studioInvestments = Array.isArray(data.iv) ? data.iv.map((entry) => ({
        id: entry.id ?? `inv-${entry.iid ?? 'x'}-${entry.sid ?? 'x'}-${Number(entry.d) || 0}`,
        investorId: entry.iid ?? '',
        studioId: entry.sid ?? '',
        amount: Number(entry.am) || 0,
        day: Number(entry.d) || 0,
      })) : [];
      fresh.studioFinanceLedger = Array.isArray(data.fl) ? data.fl.map((entry) => ({
        day: Number(entry.d) || 0,
        studioId: entry.sid ?? '',
        income: Number(entry.i) || 0,
        expense: Number(entry.e) || 0,
        net: Number(entry.n) || 0,
        funds: Number(entry.f) || 0,
      })) : [];
      fresh.releases = Array.isArray(data.rl) ? data.rl.map((entry) => ({ id: entry.id, title: entry.t, score: Number(entry.s) || 0, imdb: clamp(Number(entry.im) || 0, IMDB_MIN, IMDB_MAX), ratings: Number(entry.rt) || 0, revenue: Number(entry.rv) || 0, studio: entry.st ?? 'Unknown', day: Number(entry.d) || 0, medium: 'manga' })) : [];
      fresh.emails = Array.isArray(data.em) ? data.em.map((entry) => ({ id: entry.id, subject: entry.s, body: entry.b, read: !!entry.r, type: entry.t ?? 'system', day: Number(entry.d) || 0 })) : [];
      fresh.feed = [`Day ${fresh.day}: Save berhasil di-load.`];
      fresh.usedNames = new Set([...fresh.studios.map((s) => s.name), ...fresh.projects.map((p) => p.title), ...fresh.npcs.map((n) => n.name)]);
      state = fresh;
      return true;
    });
  }

  function proposeMergerStudio() {
    return withAction('propose-merger-studio', () => {
      if (state.player.career !== 'studio-founder' || !state.player.studioId) return false;
      const candidates = [...state.studios]
        .filter((entry) => entry.id !== state.player.studioId)
        .sort((a, b) => (b.craft + b.network + b.speed) - (a.craft + a.network + a.speed))
        .slice(0, 2);
      if (candidates.length < 2) return false;
      if (Math.random() > 0.08) {
        log(state, 'Proposal merger ditolak dewan lintas studio (sangat jarang disetujui).');
        return false;
      }
      const newName = `${candidates[0].name.split(' ')[0]} ${candidates[1].name.split(' ')[0]} Alliance`;
      if (state.usedNames.has(newName)) return false;
      const id = `st-merger-${Math.random().toString(36).slice(-5)}`;
      const craft = Math.min(98, Math.round((candidates[0].craft + candidates[1].craft) / 2 + 6));
      const speed = Math.min(98, Math.round((candidates[0].speed + candidates[1].speed) / 2 + 4));
      const network = Math.min(99, Math.round((candidates[0].network + candidates[1].network) / 2 + 8));
      state.studios.push({ id, name: newName, craft, speed, network, ownership: 'merger', scoutPower: 70, ceoNpcId: null, equity: { player: 34, investor: 66 }, funds: 4_400_000 });
      state.usedNames.add(newName);
      log(state, `Merger disetujui. Studio baru ${newName} resmi berdiri.`);
      return true;
    });
  }

  function proposeCoFundedStudio() {
    return withAction('propose-cofunded-studio', () => {
      if (state.player.career !== 'studio-founder' || !state.player.studioId) return false;
      const partners = state.studios.filter((entry) => entry.id !== state.player.studioId).slice(0, 2);
      if (partners.length < 2) return false;
      const baseName = `${partners[0].name.split(' ')[0]} Funded Studio`;
      const name = state.usedNames.has(baseName) ? `${baseName} ${state.day}` : baseName;
      const id = `st-cofund-${Math.random().toString(36).slice(-5)}`;
      const contribution = 650_000;
      const available = state.cash >= contribution;
      if (!available) return false;
      state.cash -= contribution;
      state.studios.push({ id, name, craft: 55, speed: 59, network: 52, ownership: 'cofunded', scoutPower: 58, ceoNpcId: null, equity: { player: 40, investor: 60 }, funds: 2_300_000 });
      state.usedNames.add(name);
      log(state, `${name} dibentuk lewat co-funding multi-studio.`);
      return true;
    });
  }

  function buildRankings() {
    const TOP_CONTENT_LIMIT = 50;
    const intelligence = getStudioIntelligence(state);
    const manga = [
      ...state.projects.filter((entry) => !entry.archived).map((entry) => ({
        title: entry.title,
        score: (entry.plotQuality ?? entry.scriptQuality) * 0.34 + (entry.visualQuality ?? entry.scriptQuality) * 0.28 + (entry.scriptQuality * 0.2) + (entry.competitiveness ?? 30) * 0.18 + entry.popularity * 0.22 + entry.chapters,
        popularity: clamp(entry.popularity, 0, 100),
        imdb: clamp(entry.imdbScore || computeAudienceImdbSignal({
          visualQuality: entry.visualQuality ?? entry.scriptQuality,
          plotQuality: entry.plotQuality ?? entry.scriptQuality,
          competitiveness: entry.competitiveness ?? 30,
          trend: state.market.trend,
          uniqueness: (entry.competitiveness ?? 30) * 0.92,
          ...computeCommunityImdbModifiers(state, {
            medium: entry.medium,
            targetAudience: entry.targetAudience || 'general',
            uniqueness: (entry.competitiveness ?? 30) * 0.92,
            ageDays: 0,
          }),
        }), IMDB_MIN, IMDB_MAX),
        volume: entry.chapters,
        format: entry.medium === 'novel' ? 'Novel' : 'Manga',
      })),
      ...state.npcProjects.filter((entry) => !entry.launched).map((entry) => ({
        title: entry.title,
        score: entry.quality * 0.22 + (entry.plotQuality ?? entry.quality) * 0.33 + (entry.visualQuality ?? entry.quality) * 0.28 + (entry.competitiveness ?? 30) * 0.17 + entry.popularity * 0.2 + entry.chapters,
        popularity: clamp(entry.popularity, 0, 100),
        imdb: clamp(entry.imdbScore || computeAudienceImdbSignal({
          visualQuality: entry.visualQuality ?? entry.quality,
          plotQuality: entry.plotQuality ?? entry.quality,
          competitiveness: entry.competitiveness ?? 30,
          trend: state.market.trend,
          uniqueness: (entry.competitiveness ?? 30) * 0.95,
          ...computeCommunityImdbModifiers(state, {
            medium: entry.medium || 'manga',
            targetAudience: entry.targetAudience || 'general',
            uniqueness: (entry.competitiveness ?? 30) * 0.95,
            ageDays: 0,
          }),
        }), IMDB_MIN, IMDB_MAX),
        volume: entry.chapters,
        format: entry.medium === 'novel' ? 'Novel' : entry.medium === 'anime' ? 'Anime Draft' : 'Manga',
      })),
    ]
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_CONTENT_LIMIT);

    const releaseCountByTitle = state.releases.reduce((acc, entry) => {
      acc.set(entry.title, (acc.get(entry.title) ?? 0) + 1);
      return acc;
    }, new Map());

    const anime = state.releases
      .map((entry) => ({
        title: entry.title,
        score: entry.score,
        popularity: clamp(entry.score * 0.93, 0, 100),
        imdb: clamp(
          Number(entry.imdb) || (5 + (entry.score / 100) * 4.8),
          clamp(0.9 + Math.log10(1 + Math.max(0, (state.day - (entry.day ?? state.day)))) * 0.95, IMDB_MIN, 3.8),
          IMDB_MAX,
        ),
        series: `Series ${releaseCountByTitle.get(entry.title) ?? 1}`,
        format: String(entry.title || '').toLowerCase().includes('movie') ? 'Movie' : 'Anime',
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_CONTENT_LIMIT);

    const studioReleaseScore = state.releases.reduce((acc, rel) => {
      acc.set(rel.studio, (acc.get(rel.studio) ?? 0) + rel.score);
      return acc;
    }, new Map());
    const studioReleaseCount = state.releases.reduce((acc, rel) => {
      acc.set(rel.studio, (acc.get(rel.studio) ?? 0) + 1);
      return acc;
    }, new Map());

    const studio = state.studios
      .map((entry) => {
        const rating = intelligence.ratingsByStudioId.get(entry.id) ?? computeStudioRating(state, entry);
        return {
          id: entry.id,
          name: entry.name,
          score: entry.craft + entry.speed + entry.network + entry.scoutPower + (studioReleaseScore.get(entry.name) ?? 0) + Math.max(0, (entry.funds ?? 0) / 220_000) + rating.overall * 34,
          popularity: clamp((entry.network * 0.42) + (entry.craft * 0.22) + (entry.speed * 0.16) + rating.overall * 4, 0, 100),
          totalAnime: studioReleaseCount.get(entry.name) ?? 0,
          rating: clamp(rating.overall, STUDIO_RATING_MIN, STUDIO_RATING_MAX),
          tier: rating.tier,
        };
      })
      .sort((a, b) => b.score - a.score);

    const studioValueById = new Map(
      state.studios.map((entry) => [entry.id, intelligence.valuationByStudioId.get(entry.id) ?? computeStudioValuation(entry, studioReleaseScore.get(entry.name) ?? 0)]),
    );

    const individual = [
      {
        name: state.player.name || 'Player',
        role: state.player.career === 'studio-founder' ? 'ceo-studio' : (state.player.initialProfession || 'mangaka').toLowerCase(),
        score: state.cash + state.player.fundingPool + (state.player.studioId ? Math.round((studioValueById.get(state.player.studioId) ?? 0) * 0.24) : 0),
        isPlayer: true,
      },
      ...state.npcs.map((entry) => ({
        name: entry.name,
        role: entry.role,
        score: entry.cash + (entry.studioId ? Math.round((studioValueById.get(entry.studioId) ?? 0) * (entry.role === 'ceo-studio' ? 0.38 : 0.1)) : 0),
        isPlayer: false,
      })),
    ].filter((entry) => entry && typeof entry.name === 'string' && entry.name.trim() && Number.isFinite(entry.score));

    const ceoRows = individual
      .filter((entry) => entry.role === 'ceo-studio')
      .sort((a, b) => b.score - a.score);
    const nonCeoRows = individual
      .filter((entry) => entry.role !== 'ceo-studio')
      .sort((a, b) => b.score - a.score);
    const rankedIndividuals = [...ceoRows, ...nonCeoRows];

    return { manga, anime, studio, individual: rankedIndividuals };
  }

  function snapshot() {
    const ceoRequirements = {
      wealthNeed: 0,
      fundingNeed: 1_800_000,
      adminNeed: 0,
      wealthOk: true,
      fundingOk: state.cash + state.player.fundingPool >= 1_800_000,
      adminOk: true,
    };
    const popularityChanged = rebalancePopularityMarkets(state);
    if (popularityChanged) invalidateDerivedCaches(state);

    const intelligence = getStudioIntelligence(state);
    const communities = buildCommunityInsights(state);
    const npcById = new Map(state.npcs.map((npc) => [npc.id, npc]));
    const studioById = new Map(state.studios.map((studio) => [studio.id, studio]));
    const studioReleaseScore = state.releases.reduce((acc, rel) => {
      acc.set(rel.studio, (acc.get(rel.studio) ?? 0) + rel.score);
      return acc;
    }, new Map());
    const studioDetailsMap = {};
    state.studios.forEach((studio) => {
      const valuation = intelligence.valuationByStudioId.get(studio.id) ?? computeStudioValuation(studio, studioReleaseScore.get(studio.name) ?? 0);
      const profile = classifyStudio(studio, valuation);
      const rating = intelligence.ratingsByStudioId.get(studio.id) ?? computeStudioRating(state, studio, { valuationByStudioId: new Map([[studio.id, valuation]]) });
      const founderName = studio.ownership === 'player' || (state.player.studioId === studio.id)
        ? state.player.name
        : npcById.get(studio.ceoNpcId)?.name ?? 'Board Consortium';
      const ceoName = npcById.get(studio.ceoNpcId)?.name ?? (studio.ownership === 'player' ? state.player.name : 'TBD');
      const activeProjects = intelligence.projectsByStudioId.get(studio.id) ?? [];
      const npcProjects = (intelligence.npcProjectsByStudioId.get(studio.id) ?? []).filter((entry) => !entry.launched);
      const releaseAssets = intelligence.releasesByStudioName.get(studio.name) ?? [];
      const animeAssets = activeProjects.filter((project) => ['anime', 'movie'].includes(project.medium)).map((project) => project.title)
        .concat(releaseAssets.filter((entry) => !String(entry.title || '').toLowerCase().includes('movie')).map((entry) => `${entry.title} (Released)`));
      const mangaAssets = activeProjects.filter((project) => ['manga', 'novel'].includes(project.medium)).map((project) => project.title)
        .concat(npcProjects.map((entry) => entry.title));
      const movieAssets = activeProjects.filter((project) => project.medium === 'movie').map((project) => project.title)
        .concat(releaseAssets.filter((entry) => String(entry.title || '').toLowerCase().includes('movie')).map((entry) => `${entry.title} (Released)`));
      const staff = (intelligence.staffByStudioId.get(studio.id) ?? [])
        .map((npc) => ({ id: npc.id, name: npc.name, reputation: npc.reputation, mood: npc.mood }));
      const investorScoreMap = (intelligence.investorRowsByStudio.get(studio.id) ?? [])
        .reduce((acc, entry) => {
          const key = entry.investorId ?? entry.name ?? 'unknown-investor';
          const current = acc.get(key) ?? { id: key, name: entry.name ?? key, score: 0, influence: 0 };
          current.score += Number(entry.score) || 0;
          current.influence = Math.max(current.influence, Number(entry.influence) || 0);
          acc.set(key, current);
          return acc;
        }, new Map());
      const investors = [...investorScoreMap.values()]
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);
      const latestFinance = [...state.studioFinanceLedger].reverse().find((entry) => entry.studioId === studio.id) ?? null;
      studioDetailsMap[studio.id] = {
        id: studio.id,
        name: studio.name,
        founderName,
        ceoName,
        category: profile.category,
        tier: profile.tier,
        rating,
        valuation,
        assets: { anime: animeAssets.slice(0, 8), manga: mangaAssets.slice(0, 10), movie: movieAssets.slice(0, 6) },
        staff: staff.slice(0, 12),
        investors,
        funds: Math.round(studio.funds ?? 0),
        finance: latestFinance,
      };
    });

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
        currentProfession: state.player.career === 'studio-founder' ? 'CEO Studio' : state.player.career === 'animator' ? 'Animator' : state.player.initialProfession,
        writingMedium: state.player.writingMedium,
        studioName: studioById.get(state.player.studioId)?.name ?? '-',
        adminScore: state.player.adminScore,
        fundingPool: state.player.fundingPool,
        studioPlanningOpen: state.player.studioPlanningOpen,
      },
      ceoRequirements,
      visualAccess: {
        main: true,
        fullProfile: true,
        fullProjects: true,
        fullStudios: true,
        fullEmail: true,
        fullCommittee: true,
        fullFeed: true,
        fullFoundStudio: true,
        fullRanking: true,
        fullCommunities: true,
        fullManagement: state.player.career === 'studio-founder',
        subProject: true,
        subStudio: true,
      },
      rankings: buildRankings(),
      communities: {
        regions: [
          { key: 'APAC', value: communities.regionShares.apac ?? 0.25 },
          { key: 'Americas', value: communities.regionShares.americas ?? 0.25 },
          { key: 'EMEA', value: communities.regionShares.emea ?? 0.25 },
          { key: 'Online-Global', value: communities.regionShares.online ?? 0.25 },
        ],
        ages: [
          { key: 'Kids', value: communities.ageShares.kids ?? 0.2 },
          { key: 'Teens', value: communities.ageShares.teens ?? 0.2 },
          { key: 'Young Adults', value: communities.ageShares.young_adults ?? 0.2 },
          { key: 'Adults', value: communities.ageShares.adults ?? 0.2 },
          { key: 'General', value: communities.ageShares.general ?? 0.2 },
        ],
        mediums: [
          { key: 'Manga', value: communities.mediumShares.manga ?? 0.25 },
          { key: 'Novel', value: communities.mediumShares.novel ?? 0.25 },
          { key: 'Anime', value: communities.mediumShares.anime ?? 0.25 },
          { key: 'Movie', value: communities.mediumShares.movie ?? 0.25 },
        ],
        trends: (communities.trends || []).map((entry) => ({
          genre: entry.genre,
          momentum: Number(entry.momentum) || 0,
          count: Number(entry.count) || 0,
        })),
      },
      management: {
        isCeo: state.player.career === 'studio-founder',
        studio: studioById.get(state.player.studioId) ?? null,
      },
      studios: state.studios.map((studio) => ({
        ...studio,
        ceoName: npcById.get(studio.ceoNpcId)?.name ?? (studio.ownership === 'player' ? state.player.name : 'TBD'),
        valuation: studioDetailsMap[studio.id]?.valuation ?? 0,
        category: studioDetailsMap[studio.id]?.category ?? 'Independent',
        tier: studioDetailsMap[studio.id]?.tier ?? 'C',
        rating: clamp(studioDetailsMap[studio.id]?.rating?.overall ?? STUDIO_RATING_MIN, STUDIO_RATING_MIN, STUDIO_RATING_MAX),
        funds: Math.round(studio.funds ?? 0),
      })),
      studioDetails: studioDetailsMap,
      npcs: state.npcs.slice(0, 12),
      npcProjects: state.npcProjects.filter((entry) => !entry.launched).slice(-8),
      unreadEmails: state.emails.filter((entry) => !entry.read).slice(-40).reverse(),
      projects: state.projects.filter((project) => !project.archived).map((project) => ({
        ...project,
        studioName: studioById.get(project.studioId)?.name ?? '-',
        interestedStudios: project.interestedStudioIds.map((id) => {
          const studio = studioById.get(id);
          return { id, name: studio?.name ?? id };
        }),
        canSerialize: ['ideation', 'manga_serialization'].includes(project.stage),
        canPitch: project.chapters >= getPitchReadinessThreshold(project) && ['manga_serialization', 'pitching', 'studio_interest'].includes(project.stage),
        canCommittee: ['studio_interest', 'committee_setup'].includes(project.stage),
        canProduction: project.committeeApproved && project.securedBudget >= project.budgetNeed * 0.78 && ['committee_setup', 'preproduction'].includes(project.stage),
        canLaunch: ['postproduction', 'committee_review', 'release'].includes(project.stage),
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
    openStudioPlanning,
    foundStudioAsCeo,
    proposeMergerStudio,
    proposeCoFundedStudio,
    chooseAdaptationStudio,
    discussCommitteeContract,
    markEmailRead,
    exportCompactSave,
    importCompactSave,
    tick,
    snapshot,
    reset() {
      if (timer) clearInterval(timer);
      timer = null;
      state = createInitialState();
      return state;
    },
    toggleAuto,
    createProjectFromDraft,
    serializeChapter,
    pitchToStudio,
    formCommittee,
    startProduction,
    launchAnime,
  };
}
