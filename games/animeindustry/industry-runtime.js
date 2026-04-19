import {
  evaluateGameMathExpression,
  evaluateGameMathProgram,
  formatDateFromDays,
  formatMoneyCompact,
} from '/games/animeindustry/anime-engine.bundle.js';

const MAX_ACTIVE_STUDIOS = 13;
const INITIAL_ACTIVE_STUDIOS = 10;
const NPC_TARGET_COUNT = 70;

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

const STUDIO_NAME_PART_A = ['Astra', 'Kitsune', 'Mirai', 'Kaze', 'Akari', 'Yoru', 'Shiro', 'Sora', 'Ryu', 'Nami', 'Hoshi', 'Aoi', 'Kumo', 'Suzu', 'Rei', 'Tora', 'Mizu', 'Kage', 'Nova', 'Kairo'];
const STUDIO_NAME_PART_B = ['Frame', 'Works', 'Pictures', 'Motion', 'Atelier', 'Factory', 'Studio', 'Lab', 'House', 'Arts', 'Vision', 'Spark', 'Forge', 'Arc'];
const STUDIO_NAME_PART_C = ['Collective', 'Guild', 'Division', 'Systems', 'Prime', 'Dynamics', 'Factory'];
const STUDIO_ONE_WORD_DATASET = ['SHUKARI', 'MAPPEX', 'JPNIME', 'Kaminameta', 'VINIX', 'ANIZEN', 'TOKARU'];
const MANGA_TITLE_DATASET = [
  'Astral Manuscript', 'Blue Ember Chronicle', 'Glass Horizon', 'Midnight Conveyor', 'Neon Herbarium', 'Parallel Drifters',
  'Starless Rondo', 'Velvet Protocol', 'Crimson Index', 'Winter Dial', 'Sunset Cipher', 'Binary Shrine', 'Silent Orbit',
  'Lantern of Kuro', 'Arcadia Delta', 'Phantom Cartographer', 'Sapphire Verdict', 'Echoes of Aster', 'Rainline Sonata',
  'Hollow Compass', 'Jade Overclock', 'Myriad Lantern', 'Mosaic Vanguard', 'Last Paladin Memoir', 'Ivory Resonance',
  'Urban Kitsune Files', 'Signal of the Nine', 'Seafoam Testament', 'Astral Debt', 'Tokyo Skyward Manual', 'Monolith Picnic',
  'Red Ribbon Riot', 'Pocket Nebula', 'The Indigo Harbor', 'Snowline Engine', 'Cobalt Refrain', 'Helix School Chronicle',
  'Clockwork Picnic', 'Shatterglass Parade', 'River of Cinders', 'Afterimage Parade', 'Wired Chameleon', 'Daybreak Quarry',
  'Lunar Proofreader', 'Quartz Frontier', 'Birdsong Firewall', 'Cerulean Compass', 'Night Bloom Engine', 'Peach District Arc',
  'Raven Elevator', 'Twilight Courier', 'Drift Academy', 'Nebula Baker', 'Yokai Frequency', 'Zero Gravity Band',
  'Mercury Notation', 'Abyssal Bookmark', 'Harborline Waltz', 'Velvet Sidequest', 'Mirage Courier', 'Silent Academy Loop',
  'Delta Moon Thesis', 'Garden of Relays', 'Frostlight Sermon', 'Scarlet Tramline', 'Monsoon Archivist', 'Aria of Static',
  'Cloudline Testament', 'Lantern Frontier', 'Pulse of Kyoto', 'Chrome Sparrow', 'Vortex Homeroom', 'Bamboo Overdrive',
  'Festival of Aether', 'Hidden Shrine Constructor', 'Ghostwired Utopia', 'Saturn Alley', 'Paper Katana Protocol',
  'Eclipse Delicatessen', 'Nocturne Salvagers', 'Reactor Blossom', 'Rune of Rainfall', 'Tidal Observatory', 'Misty Cadence',
];

const INVESTOR_POOL = Object.freeze([
  { id: 'inv-pub', name: 'Penerbit', influence: 72, risk: 45 },
  { id: 'inv-tv', name: 'TV Network', influence: 81, risk: 38 },
  { id: 'inv-stream', name: 'Platform Streaming', influence: 88, risk: 66 },
  { id: 'inv-music', name: 'Label Musik', influence: 57, risk: 41 },
  { id: 'inv-merch', name: 'Merch Partner', influence: 62, risk: 59 },
]);

const NPC_FIRST_NAMES = [
  'Akira', 'Haruto', 'Souta', 'Yuma', 'Rin', 'Takumi', 'Naoki', 'Daichi', 'Kenta', 'Shin',
  'Kaori', 'Yui', 'Sakura', 'Aoi', 'Misaki', 'Nanami', 'Hikari', 'Miyu', 'Reina', 'Kana',
];
const NPC_LAST_NAMES = [
  'Sakamoto', 'Tachibana', 'Aoyama', 'Kurosawa', 'Morioka', 'Ishikawa', 'Kanzaki', 'Fujimoto', 'Hoshino', 'Shirakawa',
  'Naruse', 'Kirishima', 'Amamiya', 'Tsukishiro', 'Matsuda', 'Kojima', 'Mizuno', 'Hayashida', 'Nishimura', 'Okamoto',
];
const NPC_ROLES = ['ceo-studio', 'mangaka', 'novelis', 'animator', 'investor'];

function addUniqueName(usedNames, candidate) {
  if (usedNames.has(candidate)) return false;
  usedNames.add(candidate);
  return true;
}

function generateUniqueNpcNames(targetCount, usedNames) {
  const names = [];
  let seed = 0;
  while (names.length < targetCount && seed < targetCount * 40) {
    const first = NPC_FIRST_NAMES[seed % NPC_FIRST_NAMES.length];
    const last = NPC_LAST_NAMES[Math.floor(seed / NPC_FIRST_NAMES.length) % NPC_LAST_NAMES.length];
    const full = `${first} ${last}`;
    if (addUniqueName(usedNames, full)) names.push(full);
    seed += 1;
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
  return {
    id,
    title,
    medium,
    stage: 'ideation',
    popularity: 10,
    scriptQuality: 12,
    chapters: 0,
    studioId: null,
    interestedStudioIds: [],
    committeeIds: [],
    committeeNegotiationLog: [],
    contractDraft: { creatorShare: 38, studioShare: 42, investorShare: 20 },
    committeeApproved: false,
    budgetNeed: medium === 'novel' ? 9_500_000 : 12_000_000,
    securedBudget: 0,
    productionProgress: 0,
    delayRisk: 0.18,
    archived: false,
  };
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
  if (!npc.franchiseTitle) npc.franchiseTitle = generateUniqueMangaTitle(state, npc);
  npc.franchiseIndex = (npc.franchiseIndex ?? 0) + 1;
  const installment = npc.franchiseIndex === 1 ? 'Main Story' : npc.franchiseIndex === 2 ? 'Sequel Arc' : `Series ${npc.franchiseIndex}`;
  return {
    id: `npc-ip-${npc.id}-${day}`,
    npcId: npc.id,
    title: `${npc.franchiseTitle} • ${installment}`,
    stage: 'serialization',
    chapters: 6,
    quality: 40 + Math.min(35, Math.round(npc.reputation * 0.4)),
    popularity: 32 + Math.min(35, Math.round(npc.ambition * 0.35)),
    studioId: null,
    productionProgress: 0,
    launched: false,
  };
}

function createInitialState() {
  const usedNames = new Set();
  const studioNames = generateUniqueStudioNames(INITIAL_ACTIVE_STUDIOS, usedNames);
  const studios = STUDIO_BASE_POOL.slice(0, INITIAL_ACTIVE_STUDIOS).map((studio, index) => ({
    ...studio,
    name: studioNames[index],
    equity: { player: 0, investor: 100 },
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
    studios,
    investors: INVESTOR_POOL,
    npcs,
    npcProjects: [],
    emails: [],
    usedNames,
    releases: [],
    feed: ['Day 0: Menunggu registrasi pemain.'],
    cache: { rankedStudios: studios.map((entry) => entry.id), rankedStudiosDay: 0 },
    debug: { lastAction: 'bootstrap' },
  };
}

function log(state, message) {
  state.feed.push(`Day ${state.day}: ${message}`);
  if (state.feed.length > 200) state.feed.splice(0, state.feed.length - 200);
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
  state.cache.rankedStudios = [...state.studios]
    .sort((a, b) => (b.network + b.scoutPower + b.craft) - (a.network + a.scoutPower + a.craft))
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
    const rankedStudios = getRankedStudios(state);
    state.npcs.forEach((npc, index) => {
      if (!npc.active) return;
      if (npc.role === 'investor' && state.day % 9 === (index % 5)) {
        npc.cash += 55_000;
      }
      if (npc.role === 'mangaka' && state.day % 13 === (index % 7)) {
        if (!npc.currentProject) {
          const npcProject = createNpcProject(state, npc, state.day);
          state.npcProjects.push(npcProject);
          npc.currentProject = npcProject.id;
          log(state, `${npc.name} memulai serial baru: ${npcProject.title}.`);
          return;
        }
        const project = state.npcProjects.find((entry) => entry.id === npc.currentProject && !entry.launched);
        if (!project) return;
        if (project.stage === 'serialization') {
          project.chapters += 1;
          project.quality = Math.min(100, project.quality + 2 + (npc.ambition / 100));
          project.popularity = Math.min(100, project.popularity + 1.6 + (npc.reputation / 140));
          if (project.chapters >= 10) {
            project.stage = 'studio-interest';
            const ownStudio = npc.writesManga && npc.studioId ? state.studios.find((entry) => entry.id === npc.studioId) : null;
            const studio = ownStudio ?? state.studios.find((entry) => entry.id === rankedStudios[index % rankedStudios.length]);
            project.studioId = studio?.id ?? null;
            log(state, `${project.title} karya ${npc.name} dilirik ${studio?.name ?? 'studio'} untuk adaptasi anime.`);
          }
          return;
        }
        if (project.stage === 'studio-interest') {
          project.stage = 'production';
          log(state, `${project.title} (NPC) lolos production committee dan masuk produksi.`);
          return;
        }
        if (project.stage === 'production') {
          const studio = state.studios.find((entry) => entry.id === project.studioId);
          const speed = ((studio?.speed ?? 50) / 100) * 3.1;
          project.productionProgress = Math.min(100, project.productionProgress + 2.2 + speed);
          if (project.productionProgress >= 100) {
            project.stage = 'launch-ready';
            log(state, `${project.title} (NPC) siap tayang.`);
          }
          return;
        }
        if (project.stage === 'launch-ready') {
          project.launched = true;
          const studio = state.studios.find((entry) => entry.id === project.studioId);
          const releaseScore = Math.max(52, project.quality * 0.55 + project.popularity * 0.45 + ((studio?.craft ?? 60) * 0.2));
          state.releases.push({
            id: project.id,
            title: project.title,
            medium: 'manga-npc',
            score: releaseScore,
            revenue: Math.round(1_600_000 + releaseScore * 55_000),
            studio: studio?.name ?? 'Unknown Studio',
            day: state.day,
          });
          log(state, `${project.title} (NPC Mangaka ${npc.name}) resmi rilis anime.`);
          npc.currentProject = null;
        }
      }
      if (npc.role === 'ceo-studio' && npc.studioId && state.day % 15 === (index % 4)) {
        const studio = state.studios.find((entry) => entry.id === npc.studioId);
        if (studio) {
          studio.network = Math.min(95, studio.network + 0.3);
          studio.craft = Math.min(98, studio.craft + 0.2);
        }
      }
    });

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

      tickNpcEcosystem();

      state.projects.forEach((project) => {
        if (project.stage === 'committee_setup') {
          const committeeStrength = project.committeeIds.reduce((sum, id) => {
            const investor = state.investors.find((entry) => entry.id === id);
            return sum + (investor ? investor.influence : 0);
          }, 0);
          const fundingTick = 120_000 + committeeStrength * 1100 + state.player.adminScore * 520;
          project.securedBudget = Math.min(project.budgetNeed, project.securedBudget + fundingTick);
          if (project.securedBudget >= project.budgetNeed * 0.78 && project.committeeApproved) {
            project.stage = 'preproduction';
            log(state, `${project.title} lolos komite dan masuk pre-production.`);
          }
        }

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
      state.projects.push(createProject(`ip-${(Math.random() * 1e9).toFixed(0)}`, medium, createUniquePlayerProjectTitle(state, medium)));
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
      log(state, `${project.title} dilirik ${interested.length} studio untuk adaptasi anime.`);
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
      project.stage = 'committee_setup';
      project.delayRisk = Math.max(0.05, project.delayRisk - 0.02);
      while (project.committeeIds.length < 3) {
        const candidate = state.investors[(state.day + project.committeeIds.length) % state.investors.length];
        if (!project.committeeIds.includes(candidate.id)) project.committeeIds.push(candidate.id);
      }
      const raised = project.committeeIds.reduce((sum, id) => {
        const inv = state.investors.find((entry) => entry.id === id);
        return sum + (inv ? 2_300_000 + inv.influence * 9_000 : 0);
      }, 0);
      project.securedBudget = Math.min(project.budgetNeed, raised);
      project.committeeNegotiationLog.push('Komite dibentuk. Mulai diskusi kontrak dengan CEO studio & investor.');
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
        project.committeeApproved = true;
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
        state.cash -= 1_850_000;
        log(state, `${project.title} resmi mulai produksi anime.`);
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
      const creatorRatio = project.contractDraft.creatorShare / 100;
      const revenue = Math.floor((2_800_000 + score * 92_000) * creatorRatio);
      state.cash += revenue;
      state.reputation = Math.min(100, state.reputation + (score >= 88 ? 8 : score >= 65 ? 5 : 2));
      state.releases.push({ id: project.id, title: project.title, medium: project.medium, score, revenue, studio: studio?.name ?? 'Unknown Studio', day: state.day });
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
      state.studios.push({ id, name: newName, craft, speed, network, ownership: 'merger', scoutPower: 70, ceoNpcId: null, equity: { player: 34, investor: 66 } });
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
      state.studios.push({ id, name, craft: 55, speed: 59, network: 52, ownership: 'cofunded', scoutPower: 58, ceoNpcId: null, equity: { player: 40, investor: 60 } });
      state.usedNames.add(name);
      log(state, `${name} dibentuk lewat co-funding multi-studio.`);
      return true;
    });
  }

  function buildRankings() {
    const manga = [
      ...state.projects.filter((entry) => !entry.archived).map((entry) => ({
        title: entry.title,
        score: entry.scriptQuality * 0.6 + entry.popularity * 0.4 + entry.chapters,
      })),
      ...state.npcProjects.filter((entry) => !entry.launched).map((entry) => ({
        title: entry.title,
        score: entry.quality * 0.62 + entry.popularity * 0.38 + entry.chapters,
      })),
    ].sort((a, b) => b.score - a.score).slice(0, 8);

    const anime = state.releases
      .map((entry) => ({ title: entry.title, score: entry.score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    const studioReleaseScore = state.releases.reduce((acc, rel) => {
      acc.set(rel.studio, (acc.get(rel.studio) ?? 0) + rel.score);
      return acc;
    }, new Map());

    const studio = state.studios
      .map((entry) => ({
        name: entry.name,
        score: entry.craft + entry.speed + entry.network + entry.scoutPower + (studioReleaseScore.get(entry.name) ?? 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    return { manga, anime, studio };
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
        studioName: state.studios.find((entry) => entry.id === state.player.studioId)?.name ?? '-',
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
        fullManagement: state.player.career === 'studio-founder',
        subProject: true,
      },
      rankings: buildRankings(),
      management: {
        isCeo: state.player.career === 'studio-founder',
        studio: state.studios.find((entry) => entry.id === state.player.studioId) ?? null,
      },
      studios: state.studios.map((studio) => ({
        ...studio,
        ceoName: state.npcs.find((npc) => npc.id === studio.ceoNpcId)?.name ?? (studio.ownership === 'player' ? state.player.name : 'TBD'),
      })),
      npcs: state.npcs.slice(0, 12),
      npcProjects: state.npcProjects.filter((entry) => !entry.launched).slice(-8),
      unreadEmails: state.emails.filter((entry) => !entry.read).slice(-40).reverse(),
      projects: state.projects.filter((project) => !project.archived).map((project) => ({
        ...project,
        studioName: state.studios.find((entry) => entry.id === project.studioId)?.name ?? '-',
        interestedStudios: project.interestedStudioIds.map((id) => {
          const studio = state.studios.find((entry) => entry.id === id);
          return { id, name: studio?.name ?? id };
        }),
        canSerialize: ['ideation', 'manga_serialization'].includes(project.stage),
        canPitch: project.chapters >= 8 && ['manga_serialization', 'pitching', 'studio_interest'].includes(project.stage),
        canCommittee: ['studio_interest', 'committee_setup'].includes(project.stage),
        canProduction: project.committeeApproved && project.securedBudget >= project.budgetNeed * 0.78 && ['committee_setup', 'preproduction'].includes(project.stage),
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
    openStudioPlanning,
    foundStudioAsCeo,
    proposeMergerStudio,
    proposeCoFundedStudio,
    chooseAdaptationStudio,
    discussCommitteeContract,
    markEmailRead,
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
