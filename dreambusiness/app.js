import {
  COMPANY_KEYS,
  DEFAULT_PROFILE_DRAFT,
  createCommunityCompanyPlan,
  createInitialGameState,
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
  buildProductRankingRows,
  buildRichestPeopleRows,
  buildTopCompanyRankingRows,
  runTicksBatched,
  simulateTick,
  transactShares,
  getDisplayCompanies,
  getTopCompaniesSnapshot,
} from '/dreambusiness/dream-engine-bundle.js';

const statsEl = document.getElementById('stats');
const autoBtn = document.getElementById('auto');
const companySelect = document.getElementById('companySelect');
const investSlider = document.getElementById('investSlider');
const sliderValueLabel = document.getElementById('sliderValueLabel');
const sharePercentPreview = document.getElementById('sharePercentPreview');
const sliderModeInvestBtn = document.getElementById('sliderModeInvest');
const sliderModeSellBtn = document.getElementById('sliderModeSell');
const actionStatus = document.getElementById('actionStatus');
const frameMain = document.getElementById('frameMain');
const frameFull = document.getElementById('frameFull');
const frameRanking = document.getElementById('frameRanking');
const frameInvestment = document.getElementById('frameInvestment');
const frameNews = document.getElementById('frameNews');
const frameSub = document.getElementById('frameSub');
const frameProfile = document.getElementById('frameProfile');
const frameMarkets = document.getElementById('frameMarkets');
const frameMyCompany = document.getElementById('frameMyCompany');
const newsTimeline = document.getElementById('newsTimeline');
const companyFrameList = document.getElementById('companyFrameList');
const companyDetailTitle = document.getElementById('companyDetailTitle');
const companyDetailBody = document.getElementById('companyDetailBody');
const toFullframeBtn = document.getElementById('toFullframe');
const toInvestmentBtn = document.getElementById('toInvestment');
const toRankingBtn = document.getElementById('toRanking');
const toNewsBtn = document.getElementById('toNews');
const toProfileBtn = document.getElementById('toProfile');
const toMarketsBtn = document.getElementById('toMarkets');
const toMyCompanyBtn = document.getElementById('toMyCompany');
const backFromFullBtn = document.getElementById('backFromFull');
const backFromRankingBtn = document.getElementById('backFromRanking');
const backFromInvestmentBtn = document.getElementById('backFromInvestment');
const backFromNewsBtn = document.getElementById('backFromNews');
const backFromSubBtn = document.getElementById('backFromSub');
const backFromProfileBtn = document.getElementById('backFromProfile');
const backFromMarketsBtn = document.getElementById('backFromMarkets');
const backFromMyCompanyBtn = document.getElementById('backFromMyCompany');
const rankingList = document.getElementById('rankingList');
const rankingTopCompaniesBtn = document.getElementById('rankingTopCompanies');
const rankingRichestBtn = document.getElementById('rankingRichest');
const rankingCpuBtn = document.getElementById('rankingCpu');
const rankingGameBtn = document.getElementById('rankingGame');
const rankingComputerBtn = document.getElementById('rankingComputer');
const rankingPhoneBtn = document.getElementById('rankingPhone');
const buyBtn = document.getElementById('buyBtn');
const sellBtn = document.getElementById('sellBtn');
const investPlanBtn = document.getElementById('investPlanBtn');
const licenseBtn = document.getElementById('licenseBtn');
const communityBtn = document.getElementById('communityBtn');
const topDate = document.getElementById('topDate');
const profileBody = document.getElementById('profileBody');
const topCash = document.getElementById('topCash');
const marketsBody = document.getElementById('marketsBody');
const myCompanyTabs = document.getElementById('myCompanyTabs');
const myCompanyBody = document.getElementById('myCompanyBody');
const foundCompanyBtn = document.getElementById('foundCompanyBtn');

let game = createInitialGameState(DEFAULT_PROFILE_DRAFT);
let auto = false;
let timer = null;
let frame = 'main';
let selectedCompanyForDetail = null;
let rankingMode = 'companies';
let previousSharePrices = {};
let sliderMode = 'invest';
let previousPlayerCash = null;
let selectedMyCompanyKey = null;
const sliderPercentByMode = { invest: 25, sell: 25 };
const RICHEST_ROWS_LIMIT = 76; // 75 NPC + 1 player
const rankingCache = {
  tick: -1,
  companies: null,
  richest: null,
products: null,
};
const upgradeBaselineByCompany = {};
const rdFundByCompany = {};
const releaseRegistry = [];
const companyReleaseState = {};

function on(element, eventName, handler) {
  if (!element) return;
  element.addEventListener(eventName, handler);
}

function debugReport(kind, message, detail = {}) {
  if (window.__dreambusinessDebug && typeof window.__dreambusinessDebug.report === "function") {
    window.__dreambusinessDebug.report(kind, message, detail);
  }
}


function formatSignedCompact(value) {
  const safe = Number.isFinite(value) ? value : 0;
  const sign = safe >= 0 ? '+' : '-';
  return `${sign}${formatMoneyCompact(Math.abs(safe), 2)}`;
}

function formatHeaderDate(dayIndex) {
  const safeDayIndex = Number.isFinite(dayIndex) ? dayIndex : 0;
  const base = new Date(Date.UTC(2000, 0, 1));
  base.setUTCDate(base.getUTCDate() + Math.max(0, Math.floor(safeDayIndex)));
  const yy = String(base.getUTCFullYear() % 100).padStart(2, '0');
  const mm = String(base.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(base.getUTCDate()).padStart(2, '0');
  return `${yy}/${mm}/${dd}`;
}

function renderHoldingsPie(rows, palette) {
  const normalized = rows.length ? rows : [{ key: "Cash", value: 1, amount: 0 }];
  let start = 0;
  const slices = normalized.map((row, index) => {
    const share = Math.max(0, Number(row.value) || 0);
    const end = start + share;
    const largeArc = end - start > 0.5 ? 1 : 0;
    const x1 = 50 + Math.cos(2 * Math.PI * start - Math.PI / 2) * 44;
    const y1 = 50 + Math.sin(2 * Math.PI * start - Math.PI / 2) * 44;
    const x2 = 50 + Math.cos(2 * Math.PI * end - Math.PI / 2) * 44;
    const y2 = 50 + Math.sin(2 * Math.PI * end - Math.PI / 2) * 44;
    start = end;
    return `<path d="M 50 50 L ${x1.toFixed(2)} ${y1.toFixed(2)} A 44 44 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z" fill="${palette[index % palette.length]}"></path>`;
  }).join();
  return `<svg viewBox="0 0 100 100" class="holdings-pie" aria-hidden="true">${slices}</svg>`;
}

function getMyCompanyCandidates() {
  return Object.values(game.companies).filter((company) => {
    if (!company.isEstablished) return false;
    const playerShares = Number(company.investors?.[game.player.id] ?? 0);
    const totalShares = Math.max(1, Number(company.totalShares ?? 1));
    const ownership = (playerShares / totalShares) * 100;
    return company.ceoId === game.player.id || ownership >= 50;
  });
}

function renderMyCompanyFrame() {
  if (!myCompanyTabs || !myCompanyBody) return;
  const companies = getMyCompanyCandidates();
  if (!selectedMyCompanyKey || !companies.some((entry) => entry.key === selectedMyCompanyKey)) {
    selectedMyCompanyKey = companies[0]?.key ?? null;
  }
  myCompanyTabs.innerHTML = companies.length
    ? companies.map((entry) => `<button data-my-company="${entry.key}" class="${entry.key === selectedMyCompanyKey ? 'switch-active' : ''}">${escapeHtml(entry.name)}</button>`).join('')
    : '<small>No controlled company yet.</small>';
  const active = companies.find((entry) => entry.key === selectedMyCompanyKey);
  if (!active) {
    myCompanyBody.innerHTML = '<p>Use Found Company to start your own company.</p>';
    return;
  }
  const investorBoard = Object.entries(active.investors ?? {})
    .map(([investorId, shares]) => ({ investorId, shares: Number(shares ?? 0) }))
    .filter((entry) => entry.shares > 0)
    .sort((a, b) => b.shares - a.shares);
  const playerShares = Number(active.investors?.[game.player.id] ?? 0);
  const totalShares = Math.max(1, investorBoard.reduce((sum, entry) => sum + entry.shares, 0));
  const ownershipRaw = (playerShares / totalShares) * 100;
  const ownership = Math.max(0, Math.min(100, ownershipRaw));
  const playerRank = investorBoard.findIndex((entry) => entry.investorId === game.player.id) + 1;
  const execRole = active.ceoId === game.player.id ? 'CEO'
    : active.executives?.cto?.occupantId === game.player.id ? 'CTO'
      : active.executives?.cfo?.occupantId === game.player.id ? 'CFO'
        : active.executives?.cmo?.occupantId === game.player.id ? 'CMO'
          : active.executives?.coo?.occupantId === game.player.id ? 'COO'
            : playerRank > 0 && playerRank <= 3 ? 'Majority Shareholder' : 'Shareholder';
  const rdFund = ensureRdFund(active, game.elapsedDays);
  const hasMajorityInfluence = playerRank > 0 && playerRank <= 3;
  const canTech = (execRole === 'CEO' || execRole === 'CTO') && rdFund.monthlyBudget - rdFund.spent > 150;
  const canOps = execRole === 'CEO' || execRole === 'COO' || hasMajorityInfluence;
  const canFinance = execRole === 'CEO' || execRole === 'CFO' || hasMajorityInfluence;
  const canBrand = execRole === 'CEO' || execRole === 'CMO' || hasMajorityInfluence;
  const canCritique = execRole === 'Shareholder' || hasMajorityInfluence;
  const upgradeOptions = Object.keys(active.upgrades ?? {}).map((key) => `<option value="${key}">${toTitleCase(key)}</option>`).join('');
  const actionLine = (label, allow, reason) => `<li class="${allow ? 'mgmt-allow' : 'mgmt-block'}">${allow ? '🟢' : '🔴'} ${label} — ${reason}</li>`;
  myCompanyBody.innerHTML = `
    <article class="detail-tile">
      <h3>${escapeHtml(active.name)}</h3>
      <p>Role: ${execRole}</p>
      <p>Ownership: ${ownership.toFixed(4)}%</p>
      <p>Shareholder Rank: ${playerRank > 0 ? `#${playerRank}` : 'N/A'}</p>
      <p>Cash: ${formatMoneyCompact(active.cash)}</p>
      <p>Last Release: ${escapeHtml(active.lastRelease || '-')}</p>
    </article>
    <article class="detail-tile">
      <h3>Manajemen</h3>
      <ul class="mgmt-list">
        ${actionLine('Teknologi / Spek', canTech, canTech ? 'R&D fund cukup, aksi upgrade dimungkinkan.' : 'Butuh role CEO dan dana R&D memadai.')}
        ${actionLine('Operasional / Visi Produk', canOps, canOps ? 'Bisa ikut menentukan ritme dan arah rilis.' : 'Wewenang terbatas pada role saat ini.')}
        ${actionLine('Keuangan / Biaya', canFinance, canFinance ? 'Bisa usulkan kontrol biaya & harga pasar.' : 'Akses keuangan terbatas.')}
        ${actionLine('Marketing / Demand', canBrand, canBrand ? 'Bisa memberi arahan branding & promo.' : 'Akses marketing terbatas.')}
        ${actionLine('Kritik / Saran', canCritique, canCritique ? 'Bisa memberi tekanan/intimidasi strategis terbatas.' : 'Role eksekutif fokus eksekusi, bukan kritik pasif.')}
      </ul>
      <div class="button-row">
        <select id="myCompanyUpgradeSelect">${upgradeOptions}</select>
        <button data-mgmt-action="upgrade-tech" ${canTech ? '' : 'disabled'}>Upgrade Tech</button>
        <button data-mgmt-action="ops-push" ${canOps ? '' : 'disabled'}>Push Ops Plan</button>
        <button data-mgmt-action="finance-tune" ${canFinance ? '' : 'disabled'}>Tune Cost</button>
        <button data-mgmt-action="brand-push" ${canBrand ? '' : 'disabled'}>Boost Brand</button>
        <button data-mgmt-action="shareholder-pressure" ${canCritique ? '' : 'disabled'}>Critic/Pressure</button>
      </div>
      <p id="myCompanyMgmtStatus"></p>
    </article>
  `;
}

function renderProfileFrame() {
  if (!profileBody) return;
  const holdings = getInvestorHoldingsValue(game, game.player.id);
  const netWorth = game.player.cash + holdings;
  const weekly = getInvestorWeeklyIncomeEstimate(game, game.player.id);
  const topSnapshot = getTopCompaniesSnapshot(game, getCompanyValuation, getSharePrice, 5)
    .filter((row) => isCompanyVisibleInUi(row.key))
    .map((row) => `<li>${escapeHtml(row.name)} • ${formatMoneyCompact(row.valuation)} • $${row.sharePrice.toFixed(2)}</li>`)
    .join('');

  profileBody.innerHTML = `
    <article class="profile-metric"><h3>Identity</h3><p>${escapeHtml(game.player.name)} (${escapeHtml(game.player.id)})</p></article>
    <article class="profile-metric"><h3>Net Worth</h3><p>${formatMoneyCompact(netWorth)}</p></article>
    <article class="profile-metric"><h3>Cash</h3><p>${formatMoneyCompact(game.player.cash)}</p></article>
    <article class="profile-metric"><h3>Portfolio Value</h3><p>${formatMoneyCompact(holdings)}</p></article>
    <article class="profile-metric"><h3>Weekly Income</h3><p>${formatMoneyCompact(weekly)}</p></article>
    <article class="profile-metric"><h3>Top Portfolio Universe</h3><ul>${topSnapshot || '<li>No company snapshot available.</li>'}</ul></article>
  `;
}

function estimateReleaseSpecAndPrice(company, type) {
  const techLevel = Math.max(1, Math.round(((Number(company.upgrades?.architecture?.value ?? 1) + Number(company.upgrades?.coreDesign?.value ?? 1) + Number(company.upgrades?.clockSpeed?.value ?? 1)) / 3)));
  const environmentBudget = Math.max(1, company.cash * 0.004 + company.researchPerDay * 20);
  const chosenLevel = Math.max(1, Math.min(techLevel, Math.round(environmentBudget / 120)));
  const basePrice = type === "CPU" ? 180 : type === "Game" ? 60 : type === "Computer" ? 620 : 420;
  const productPrice = Math.max(20, basePrice + chosenLevel * (type === "CPU" ? 38 : type === "Game" ? 12 : 28));
  return { techLevel, chosenLevel, productPrice };
}

function compactReleaseName(raw, fallback) {
  const text = String(raw || '').trim();
  if (!text) return fallback;
  const rilisIdx = text.toLowerCase().indexOf(' rilis ');
  if (rilisIdx > 0) return text.slice(0, rilisIdx).trim();
  const parenIdx = text.indexOf('(');
  if (parenIdx > 0) return text.slice(0, parenIdx).trim();
  return text;
}

function classifyCompanyType(company) {
  if (company.field === 'semiconductor') return 'CPU';
  if (company.field === 'game') return 'Game';
  return 'Device';
}

function renderMarketsFrame() {
  if (!marketsBody) return;
  const rowsByType = { CPU: [], Game: [], Computer: [], Phone: [] };
  releaseRegistry.forEach((row) => rowsByType[row.type]?.push(row));
  marketsBody.innerHTML = Object.entries(rowsByType)
    .map(([type, rows]) => `
      <section class="market-group">
        <h3>${type} Releases</h3>
        <ul>${rows.length ? rows.map((row) => `<li>${escapeHtml(row.date)} • ${escapeHtml(row.company)} • ${escapeHtml(row.product)} • L${row.tech}/${row.techMax} • $${Number(row.price ?? 0).toFixed(0)}</li>`).join('') : '<li>No releases yet.</li>'}</ul>
      </section>
    `)
    .join('');
}

function getReleaseCadenceDays(company) {
  const keySeed = hashSeedFromText(`${company.key}:${company.ceoId || company.founder || 'npc'}`);
  const baseCadence = company.field === 'semiconductor' ? 9 : company.field === 'game' ? 6 : 7;
  const variation = keySeed % 4;
  const maturityOffset = Math.max(0, 2 - Math.min(2, Math.floor((company.releaseCount || 0) / 6)));
  return Math.max(3, baseCadence + variation - maturityOffset);
}


function getReleaseMarketPressure(type, day) {
  const windowDays = 10;
  const recent = releaseRegistry.filter((entry) => entry.type === type && (day - Number(entry.day || 0)) >= 0 && (day - Number(entry.day || 0)) <= windowDays);
  const sameDay = recent.filter((entry) => Number(entry.day || 0) === day).length;
  const nearWindow = recent.filter((entry) => (day - Number(entry.day || 0)) <= 3).length;
  const staleWindow = recent.filter((entry) => (day - Number(entry.day || 0)) > 7).length;
  const congestion = (sameDay * 0.7) + (nearWindow * 0.33) + (recent.length * 0.12);
  const marketSilence = staleWindow >= 3 ? 0.15 : 0;
  return Math.max(0, congestion - marketSilence);
}

function estimateReleaseProfitDelta(company, spec, pressure) {
  const revenueSignal = Math.max(0, Number(company.revenuePerDay || 0));
  const qualitySignal = Math.max(1, Number(spec.tech || spec.chosenLevel || 1));
  const baseGross = (revenueSignal * 1.8) + (qualitySignal * 2400);
  const pressurePenalty = Math.min(0.78, pressure * 0.12);
  const idlePenalty = Number(company.releaseCount || 0) > 0 ? 0 : 0.05;
  const marginMultiplier = Math.max(0.12, 1 - pressurePenalty - idlePenalty);
  return baseGross * marginMultiplier;
}

function applySpecializedReleaseLogic(state) {
  const next = { ...state, companies: { ...state.companies } };
  const cpuPool = Object.values(next.companies)
    .filter((company) => company.isEstablished && company.field === 'semiconductor' && (company.releaseCount ?? 0) > 0)
    .map((company) => ({ key: company.key, company: company.name, score: Math.max(1, getCompanyValuation(company)), price: Math.max(0.01, getSharePrice(company)) }))
    .sort((a, b) => (b.score / Math.max(1, b.price)) - (a.score / Math.max(1, a.price)));

  const today = Number(next.elapsedDays || 0);
  const releaseSlotsPerDay = Math.max(1, Math.floor(Object.keys(next.companies).length / 8));
  let usedReleaseSlots = 0;

  for (const company of Object.values(next.companies)) {
    if (!company?.isEstablished) continue;
    const prev = companyReleaseState[company.key] ?? { releaseCount: 0 };
    const nowCount = Number(company.releaseCount ?? 0);
    const type = classifyCompanyType(company);
    const cadenceDays = getReleaseCadenceDays(company);
    const lastReleaseDay = Number(companyReleaseState[company.key]?.lastReleaseDay ?? -9999);
    const readyByCadence = (today - lastReleaseDay) >= cadenceDays;
    const slotAvailable = usedReleaseSlots < releaseSlotsPerDay;
    const canReleaseToday = nowCount > prev.releaseCount && readyByCadence && slotAvailable;
    const launchPressure = getReleaseMarketPressure(type === "Device" ? "Computer" : type, today);
    const avoidCrowdedLaunch = launchPressure >= 1.2 && (today - lastReleaseDay) < (cadenceDays + 4);

    if (nowCount > prev.releaseCount && (!canReleaseToday || avoidCrowdedLaunch)) {
      const waitDays = Math.max(1, cadenceDays - (today - lastReleaseDay));
      next.companies[company.key] = { ...company, releaseCount: prev.releaseCount, lastRelease: `Pipeline queued: launch in ~${waitDays} day(s).` };
      continue;
    }

    if (type === 'CPU' && nowCount > prev.releaseCount) {
      const spec = estimateReleaseSpecAndPrice(company, 'CPU');
      next.companies[company.key] = { ...company, lastRelease: `${company.name} Core ${nowCount}` };
      companyReleaseState[company.key] = { ...(companyReleaseState[company.key] || {}), lastSpec: spec };
    }

    if (type === 'Game' && nowCount > prev.releaseCount) {
      const spec = estimateReleaseSpecAndPrice(company, 'Game');
      next.companies[company.key] = { ...company, lastRelease: `${company.name} Game ${nowCount}` };
      companyReleaseState[company.key] = { ...(companyReleaseState[company.key] || {}), lastSpec: spec };
    }

    if (type === 'Device' && nowCount > prev.releaseCount) {
      if (!cpuPool.length) {
        next.companies[company.key] = { ...company, releaseCount: prev.releaseCount, lastRelease: 'Blocked: device release needs at least one released CPU in market.' };
        debugReport('release-blocked', `${company.name} blocked release without CPU`, { companyKey: company.key, day: next.elapsedDays });
        continue;
      }
      const selectedCpu = cpuPool[0];
      const unitType = company.releaseCount % 2 === 0 ? 'Computer' : 'Phone';
      const spec = estimateReleaseSpecAndPrice(company, unitType);
      const productName = `${company.name} ${unitType} ${String(nowCount).padStart(2, '0')} (${selectedCpu.company} CPU)`;
      const licensingFee = Math.max(1, company.cash * 0.012);
      const cpuCompany = next.companies[selectedCpu.key];
      const taxedIncome = licensingFee * 0.75;
      const deviceCash = Math.max(0, company.cash - licensingFee);
      next.companies[company.key] = { ...company, cash: deviceCash, lastRelease: productName };
      if (cpuCompany) {
        next.companies[selectedCpu.key] = { ...cpuCompany, cash: cpuCompany.cash + taxedIncome };
      }
      companyReleaseState[company.key] = { ...(companyReleaseState[company.key] || {}), lastSpec: spec, cpuPartner: selectedCpu.company };
      debugReport('cpu-license', `${company.name} paid ${formatMoneyCompact(licensingFee)} to ${selectedCpu.company} (net ${formatMoneyCompact(taxedIncome)})`, { companyKey: company.key, cpuKey: selectedCpu.key });
    }

    if (nowCount > prev.releaseCount) {
      usedReleaseSlots += 1;
      const rawProductText = next.companies[company.key]?.lastRelease ?? company.lastRelease ?? `${company.name} Release ${nowCount}`;
      const productText = compactReleaseName(rawProductText, `${company.name} Release ${nowCount}`);
      const releaseType = type === 'Device' && /phone/i.test(productText) ? 'Phone' : type === 'Device' ? 'Computer' : type;
      const spec = companyReleaseState[company.key]?.lastSpec || estimateReleaseSpecAndPrice(company, releaseType);
      const profitDelta = estimateReleaseProfitDelta(next.companies[company.key] || company, spec, getReleaseMarketPressure(releaseType, today));
      const launchCompany = next.companies[company.key] || company;
      next.companies[company.key] = { ...launchCompany, cash: Math.max(0, Number(launchCompany.cash || 0) + profitDelta) };
      releaseRegistry.push({
        day: next.elapsedDays,
        date: formatHeaderDate(next.elapsedDays),
        company: company.name,
        product: productText,
        type: releaseType,
        price: spec.productPrice,
        tech: spec.chosenLevel,
        techMax: spec.techLevel,
        pressure: Number(getReleaseMarketPressure(releaseType, today).toFixed(3)),
        projectedProfit: Math.round(profitDelta),
      });
    }
  }

  const releasedCompanyNamesToday = new Set(releaseRegistry.filter((entry) => entry.day === today).map((entry) => entry.company));
  Object.values(next.companies).forEach((company) => {
    const previous = companyReleaseState[company.key] || {};
    const releaseCount = Number(company.releaseCount ?? 0);
    const hadReleaseToday = releasedCompanyNamesToday.has(company.name);
    companyReleaseState[company.key] = {
      ...previous,
      releaseCount,
      lastReleaseDay: hadReleaseToday ? today : Number(previous.lastReleaseDay ?? -9999),
    };
  });
  return next;
}

function isPlanOpenFunding(plan) {
  if (!plan || plan.isEstablished) return false;
  const planStatus = String(plan.status ?? '').toLowerCase();
  return planStatus === '' || planStatus === 'funding' || planStatus === 'open' || planStatus === 'active';
}

function isCompanyVisibleInUi(companyKey) {
  const company = game.companies[companyKey];
  return Boolean(company?.isEstablished && COMPANY_KEYS.includes(companyKey));
}

function parseFeedEntry(entry) {
  const [head, ...tail] = String(entry ?? '').split(':');
  if (tail.length === 0) {
    return { dateLabel: formatDateFromDays(game.elapsedDays), detail: head.trim() };
  }
  return { dateLabel: head.trim(), detail: tail.join(':').trim() };
}

function parseCompactMoney(text) {
  const match = String(text).match(/(-?\$?\s?\d[\d,.]*)(?:\s?([KMBT]))?/i);
  if (!match) return null;
  const numeric = Number(match[1].replace(/\$/g, '').replace(/,/g, '').trim());
  if (!Number.isFinite(numeric)) return null;
  const unit = (match[2] ?? '').toUpperCase();
  const scale = unit === 'T' ? 1e12 : unit === 'B' ? 1e9 : unit === 'M' ? 1e6 : unit === 'K' ? 1e3 : 1;
  return numeric * scale;
}

function buildNewsItems() {
  const keywordRules = [
    { category: 'Pergantian CEO', regex: /\bCEO\b|chief executive|direktur utama|pergantian pimpinan|mengganti pimpinan/i, base: 9 },
    { category: 'Investasi Besar', regex: /investasi|berkomitmen|modal|pendanaan|funding|suntikan dana/i, base: 5 },
    { category: 'Penjualan Besar', regex: /menjual|penjualan|melepas|divestasi|buyback|akuisisi/i, base: 5 },
    { category: 'Saham Ekstrem', regex: /saham|listing|harga|valuasi|anjlok|melonjak|drastis/i, base: 4 },
  ];
  const intensityRegex = /rekor|terbesar|di atas rata-rata|sangat mahal|anjlok|melonjak|drastis|panic|euforia/i;
  const moneyValues = game.activityFeed
    .map((entry) => parseCompactMoney(parseFeedEntry(entry).detail))
    .filter((value) => Number.isFinite(value) && value > 0);
  const amountAverage = moneyValues.length
    ? moneyValues.reduce((sum, value) => sum + value, 0) / moneyValues.length
    : 0;

  const events = [];
  const seen = new Set();
  for (let index = game.activityFeed.length - 1; index >= 0; index -= 1) {
    const parsed = parseFeedEntry(game.activityFeed[index]);
    const matchRule = keywordRules.find((rule) => rule.regex.test(parsed.detail));
    if (!matchRule) continue;

    const amount = parseCompactMoney(parsed.detail);
    const amountBoost = amountAverage > 0 && amount > amountAverage * 1.75 ? 3 : 0;
    const intensityBoost = intensityRegex.test(parsed.detail) ? 2 : 0;
    const score = matchRule.base + amountBoost + intensityBoost;
    const severity = score >= 10 ? 'critical' : score >= 7 ? 'high' : 'normal';
    const signature = `${parsed.dateLabel}:${matchRule.category}:${parsed.detail.slice(0, 44)}`;
    if (seen.has(signature)) continue;
    seen.add(signature);
    events.push({
      day: index,
      dateLabel: parsed.dateLabel,
      category: matchRule.category,
      severity,
      headline: parsed.detail,
      detail: amountBoost > 0
        ? 'Nilai transaksi berada jauh di atas rata-rata periode ini.'
        : 'Peristiwa besar terdeteksi dari activity log.',
      score,
    });
  }

  for (const company of Object.values(game.companies)) {
    const currentPrice = getSharePrice(company);
    const previousPrice = previousSharePrices[company.key];
    previousSharePrices[company.key] = currentPrice;
    if (!Number.isFinite(previousPrice) || previousPrice <= 0) continue;
    const deltaPct = ((currentPrice - previousPrice) / previousPrice) * 100;
    if (Math.abs(deltaPct) < 15) continue;
    const severity = Math.abs(deltaPct) >= 25 ? 'critical' : 'high';
    const signature = `${game.elapsedDays}:${company.key}:price`;
    if (seen.has(signature)) continue;
    seen.add(signature);
    events.push({
      day: game.elapsedDays + 1_000_000,
      dateLabel: formatDateFromDays(game.elapsedDays),
      category: 'Saham Ekstrem',
      severity,
      headline: `${company.name} ${deltaPct > 0 ? 'naik drastis' : 'anjlok drastis'} ${Math.abs(deltaPct).toFixed(1)}%.`,
      detail: `Harga saham berubah dari $${previousPrice.toFixed(2)} ke $${currentPrice.toFixed(2)}.`,
      score: severity === 'critical' ? 11 : 8,
    });
  }

  return events
    .sort((a, b) => b.day - a.day || b.score - a.score)
    .slice(0, 5);
}

function renderNewsFrame() {
  const items = buildNewsItems();
  if (items.length === 0) {
    newsTimeline.innerHTML = '<p class="news-empty">Belum ada peristiwa besar. Jalankan simulasi dulu.</p>';
    return;
  }
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.dateLabel]) acc[item.dateLabel] = [];
    acc[item.dateLabel].push(item);
    return acc;
  }, {});
  newsTimeline.innerHTML = Object.entries(grouped)
    .map(([date, rows]) => `
      <section class="news-date-group">
        <h3>${escapeHtml(date)}</h3>
        <ul>
          ${rows.map((row) => `
            <li class="news-item" data-severity="${row.severity}">
              <div class="news-item-head">
                <strong>${escapeHtml(row.category)}</strong>
                <small>${row.severity === 'critical' ? 'Critical' : row.severity === 'high' ? 'High Impact' : 'Normal'}</small>
              </div>
              <p>${escapeHtml(row.headline)}</p>
              <span>${escapeHtml(row.detail)}</span>
            </li>
          `).join('')}
        </ul>
      </section>
    `)
    .join('');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function isValidGameState(candidate) {
  return Boolean(
    candidate
    && typeof candidate === 'object'
    && Number.isFinite(candidate.elapsedDays)
    && Number.isFinite(candidate.tickCount)
    && candidate.player
    && Number.isFinite(candidate.player.cash)
    && candidate.companies
  );
}

function applyActionSafely(action, options = {}) {
  const {
    successMessage = null,
    noopMessage = 'Action did not change the game state.',
    errorMessage = 'An error occurred while processing this action.',
  } = options;
  try {
    const next = action(game);
    if (next === game) {
      setStatus(noopMessage, true);
      return false;
    }
    if (!isValidGameState(next)) {
      setStatus(`${errorMessage} (invalid state)`, true);
      return false;
    }
    game = next;
    if (successMessage) setStatus(successMessage);
    return true;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    setStatus(`${errorMessage} (${reason})`, true);
    return false;
  }
}

function stopAutoIfRunning() {
  if (!auto) return;
  auto = false;
  autoBtn.textContent = 'Start';
  autoBtn.setAttribute('aria-pressed', 'false');
  if (timer) clearInterval(timer);
  timer = null;
}

function selectedCompanyKey() {
  return companySelect.value || COMPANY_KEYS[0];
}

function selectedTradeAmount() {
  const raw = sliderPercentByMode[sliderMode];
  return Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 0;
}

function selectedTradeAmountByMode(mode) {
  const raw = sliderPercentByMode[mode];
  return Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 0;
}

function setStatus(message, isError = false) {
  actionStatus.textContent = message;
  actionStatus.style.color = isError ? '#f1a0a0' : '#9ad7a8';
}

function getPlayerContext(company) {
  const investorCash = game.player.cash;
  const currentShares = Number(company.investors[game.player.id] ?? 0);
  const sharePrice = getSharePrice(company);
  const holdingValue = currentShares * sharePrice;
  return { investorCash, currentShares, holdingValue };
}

function getRequestedTradeValue(mode, context) {
  const sliderPercent = selectedTradeAmountByMode(mode === 'buy' ? 'invest' : 'sell') / 100;
  if (mode === 'buy') return context.investorCash * sliderPercent;
  return context.holdingValue * sliderPercent;
}

function syncSliderModeUI() {
  sliderModeInvestBtn.classList.toggle('switch-active', sliderMode === 'invest');
  sliderModeSellBtn.classList.toggle('switch-active', sliderMode === 'sell');
  investSlider.value = String(selectedTradeAmount());
}

function updateSliderPreview() {
  const key = selectedCompanyKey();
  const company = game.companies[key];
  if (!company) return;
  const context = getPlayerContext(company);
  syncSliderModeUI();
  const activeTradeMode = sliderMode === 'invest' ? 'buy' : 'sell';
  const sliderPercent = selectedTradeAmount();
  const requestedValue = getRequestedTradeValue(activeTradeMode, context);
  const preview = getTradePreview(
    game,
    company,
    game.player.id,
    context.investorCash,
    context.currentShares,
    activeTradeMode,
    requestedValue,
    'auto'
  );
  if (sliderMode === 'invest') {
    sliderValueLabel.textContent = `Invest ${sliderPercent.toFixed(0)}% cash = ${formatMoneyCompact(requestedValue, 2)}`;
    sharePercentPreview.textContent = `Estimated ownership after buy: ${preview.futureOwnership.toFixed(2)}% (fee ${formatMoneyCompact(preview.feeValue, 2)})`;
  } else {
    sliderValueLabel.textContent = `Sell ${sliderPercent.toFixed(0)}% holdings = ${formatMoneyCompact(requestedValue, 2)}`;
    sharePercentPreview.textContent = `Estimated ownership after sell: ${preview.futureOwnership.toFixed(2)}% (fee ${formatMoneyCompact(preview.feeValue, 2)})`;
  }
  updateInvestmentActionState();
}

function setActionButtonState(button, canRun, canMessage, failMessage) {
  button.classList.toggle('action-can-run', canRun);
  button.classList.toggle('action-will-fail', !canRun);
  button.setAttribute('aria-label', canRun ? canMessage : failMessage);
  button.title = canRun ? canMessage : failMessage;
}

function canExecuteSafely(simulateAction) {
  try {
    const next = simulateAction(game);
    return next !== game && isValidGameState(next);
  } catch {
    return false;
  }
}

function updateInvestmentActionState() {
  const key = selectedCompanyKey();
  const company = game.companies[key];
  if (!company) {
    setActionButtonState(buyBtn, false, 'Buy is available', 'Buy akan gagal: company tidak ditemukan.');
    setActionButtonState(sellBtn, false, 'Sell is available', 'Sell akan gagal: company tidak ditemukan.');
    setActionButtonState(investPlanBtn, false, 'Invest plan is available', 'Invest Plan akan gagal: plan tidak ditemukan.');
    setActionButtonState(licenseBtn, false, 'License flow is available', 'License Flow akan gagal.');
    setActionButtonState(communityBtn, false, 'Community plan is available', 'Community Plan akan gagal.');
    return;
  }

  const context = getPlayerContext(company);
  const buyAmount = getRequestedTradeValue('buy', context);
  const sellAmount = getRequestedTradeValue('sell', context);
  const buyPreview = getTradePreview(game, company, game.player.id, context.investorCash, context.currentShares, 'buy', buyAmount, 'auto');
  const sellPreview = getTradePreview(game, company, game.player.id, context.investorCash, context.currentShares, 'sell', sellAmount, 'auto');
  setActionButtonState(
    buyBtn,
    buyPreview.grossTradeValue > 0,
    'Buy (Auto) siap dieksekusi.',
    'Buy (Auto) dipastikan gagal (dana/likuiditas tidak cukup).'
  );
  setActionButtonState(
    sellBtn,
    sellPreview.grossTradeValue > 0,
    'Sell (Auto) siap dieksekusi.',
    'Sell (Auto) dipastikan gagal (kepemilikan/likuiditas tidak cukup).'
  );

  const planAmount = Math.max(1, buyAmount);
  const canInvestPlan = canExecuteSafely((state) => investInCompanyPlan(state, state.player.id, key, planAmount));
  setActionButtonState(
    investPlanBtn,
    canInvestPlan,
    'Invest Plan siap dieksekusi.',
    'Invest Plan dipastikan gagal pada kondisi saat ini.'
  );

  const canLicense = canExecuteSafely((state) => {
    const companies = Object.values(state.companies);
    const gameCompany = companies.find((item) => item.isEstablished && item.field === 'game');
    const appStoreCompany = companies.find((item) => item.isEstablished && item.field === 'software' && item.softwareSpecialization === 'app-store');
    if (!gameCompany || !appStoreCompany) return state;
    return requestAppStoreLicense(
      state,
      state.player.id,
      gameCompany.key,
      appStoreCompany.key,
      'license request from standalone dreambusiness'
    );
  });
  setActionButtonState(
    licenseBtn,
    canLicense,
    'License Flow siap dieksekusi.',
    'License Flow dipastikan gagal (pair game/app-store belum valid atau ditolak aturan).'
  );

  const communityAmount = Math.max(6, buyAmount);
  const canCommunity = canExecuteSafely((state) => createCommunityCompanyPlan(
    state,
    state.player.id,
    `${company.name} Labs`,
    communityAmount,
    company.field,
    company.softwareSpecialization ?? undefined
  ));
  setActionButtonState(
    communityBtn,
    canCommunity,
    'Community Plan siap dieksekusi.',
    'Community Plan dipastikan gagal (fund/slot/nama tidak memenuhi aturan).'
  );
}

function render() {
  Object.values(game.companies).forEach((company) => ensureCompanyUpgradeBaseline(company));
  const displayCompanies = getDisplayCompanies(game).filter((item) => isCompanyVisibleInUi(item.key));
  if (!companySelect.options.length || companySelect.options.length !== displayCompanies.length) {
    companySelect.innerHTML = displayCompanies
      .map((item) => `<option value="${item.key}">${item.name}</option>`)
      .join('');
  }
  if (displayCompanies.length > 0 && !displayCompanies.some((item) => item.key === companySelect.value)) {
    companySelect.value = displayCompanies[0].key;
  }

  const investorWorth = getInvestorHoldingsValue(game, game.player.id);
  const dailyDelta = previousPlayerCash === null ? 0 : game.player.cash - previousPlayerCash;
  previousPlayerCash = game.player.cash;

  const palette = ['#1d4ed8','#dc2626','#059669','#d97706','#7c3aed','#0ea5e9','#be123c','#65a30d','#ea580c','#4338ca','#0891b2','#e11d48','#16a34a','#a16207','#9333ea','#0284c7','#b91c1c','#4d7c0f','#c2410c','#5b21b6','#0f766e','#9f1239','#14b8a6','#f59e0b','#ef4444','#22c55e','#06b6d4','#a855f7'];
  const holdingsRows = Object.values(game.companies)
    .map((company) => {
      const shares = Number(company.investors?.[game.player.id] ?? 0);
      if (shares <= 0) return null;
      const amount = shares * getSharePrice(company);
      return { key: company.name, amount };
    })
    .filter(Boolean)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);
  const totalHoldings = holdingsRows.reduce((sum, row) => sum + row.amount, 0);
  const normalized = holdingsRows.map((row) => ({ ...row, value: totalHoldings > 0 ? row.amount / totalHoldings : 0 }));

  statsEl.innerHTML = `
    <article>
      <h2>Total Holdings</h2>
      <strong>${formatMoneyCompact(investorWorth)}</strong>
      <div class="holdings-chart-wrap">
        <div class="holdings-chart">${renderHoldingsPie(normalized, palette)}</div>
        <ul class="holdings-legend">${normalized.length ? normalized.map((row, index) => `<li><span class="holdings-dot" style="background:${palette[index % palette.length]}"></span>${escapeHtml(row.key)} • ${(row.value * 100).toFixed(1)}% • ${formatMoneyCompact(row.amount)}</li>`).join('') : '<li>No shares yet.</li>'}</ul>
      </div>
    </article>
  `;

  if (topDate) {
    const dateSource = Number.isFinite(game.elapsedDays) && game.elapsedDays > 0 ? game.elapsedDays : game.tickCount;
    topDate.textContent = formatHeaderDate(dateSource);
  }
  if (topCash) {
    topCash.textContent = `💵${formatMoneyCompact(game.player.cash)} ${formatSignedCompact(dailyDelta)}`;
    topCash.classList.toggle('top-cash-positive', dailyDelta >= 0);
    topCash.classList.toggle('top-cash-negative', dailyDelta < 0);
  }

  if (frame === 'investment') {
    updateSliderPreview();
    updateInvestmentActionState();
  }
  if (frame === 'full' || frame === 'sub') {
    renderCompanyFrames();
  }
  if (frame === 'ranking') renderRankingFrame();
  if (frame === 'news') renderNewsFrame();
  if (frame === 'profile') renderProfileFrame();
  if (frame === 'markets') renderMarketsFrame();
  if (frame === 'myCompany') renderMyCompanyFrame();
  renderFrameVisibility();
}

function renderFrameVisibility() {
  frameMain.classList.toggle('frame-active', frame === 'main');
  frameFull.classList.toggle('frame-active', frame === 'full');
  frameRanking.classList.toggle('frame-active', frame === 'ranking');
  frameInvestment.classList.toggle('frame-active', frame === 'investment');
  frameNews.classList.toggle('frame-active', frame === 'news');
  frameSub.classList.toggle('frame-active', frame === 'sub');
  frameProfile?.classList.toggle('frame-active', frame === 'profile');
  frameMarkets?.classList.toggle('frame-active', frame === 'markets');
  frameMyCompany?.classList.toggle('frame-active', frame === 'myCompany');
}

function renderCompanyFrames() {
  const snapshots = getTopCompaniesSnapshot(game, getCompanyValuation, getSharePrice, 12)
    .filter((company) => isCompanyVisibleInUi(company.key));
  companyFrameList.innerHTML = snapshots
    .map((company) => `
      <button class="company-card-btn ${game.companies[company.key]?.isEstablished ? '' : 'company-card-proposal'}" data-company-card="${company.key}">
        <strong>${company.name}</strong><br />
        ${game.companies[company.key]?.isEstablished ? '<small class="company-status-live">Running</small><br />' : '<small class="company-status-proposal">Open Funding</small><br />'}
        <span>Valuation ${formatMoneyCompact(company.valuation)}</span><br />
        <span>Share $${company.sharePrice.toFixed(2)} | MS ${company.marketShare.toFixed(1)}%</span>
      </button>
    `)
    .join('');

}

function renderRankingFrame() {
  if (rankingCache.tick !== game.tickCount) {
    rankingCache.tick = game.tickCount;
    rankingCache.companies = buildTopCompanyRankingRows(game, getCompanyValuation, getSharePrice, 24)
      .filter((row) => isCompanyVisibleInUi(row.key))
      .slice(0, 12)
      .map((row, index) => ({ ...row, rank: index + 1 }));
    rankingCache.richest = buildRichestPeopleRows(game, getInvestorHoldingsValue, RICHEST_ROWS_LIMIT);
    rankingCache.products = buildProductRankingRows(game, getCompanyValuation, 10);
  }

  const renderRankingCards = (rows, formatter) => {
    rankingList.innerHTML = rows
      .map((row) => `
        <li class="ranking-item">
          <article class="ranking-card">
            <header class="ranking-card-head">
              <span class="ranking-badge">#${row.rank}</span>
              <strong class="ranking-name">${escapeHtml(row.name)}</strong>
            </header>
            <p class="ranking-meta">${formatter(row)}</p>
          </article>
        </li>
      `)
      .join('');
  };

  if (rankingMode === 'companies') {
    renderRankingCards(
      rankingCache.companies,
      (row) => `Valuation ${formatMoneyCompact(row.valuation)} • Share $${row.sharePrice.toFixed(2)} • MS ${row.marketShare.toFixed(1)}%`
    );
    return;
  }

  if (rankingMode === 'richest') {
    renderRankingCards(
      rankingCache.richest,
      (row) => `Net Worth ${formatMoneyCompact(row.total)} • Cash ${formatMoneyCompact(row.cash)} • Holdings ${formatMoneyCompact(row.holdings)}`
    );
    return;
  }

  const marketRows = releaseRegistry
    .slice()
    .reverse()
    .map((row, index) => ({ rank: index + 1, name: row.product, type: row.type, companyName: row.company, day: row.day }));

  const filtered = marketRows.filter((row) => {
    if (rankingMode === 'cpu') return row.type === 'CPU';
    if (rankingMode === 'game') return row.type === 'Game';
    if (rankingMode === 'computer') return row.type === 'Computer';
    if (rankingMode === 'phone') return row.type === 'Phone';
    return false;
  }).slice(0, 24).map((row, index) => ({ ...row, rank: index + 1 }));

  renderRankingCards(filtered, (row) => {
    const release = releaseRegistry.find((entry) => entry.product === row.name && entry.company === row.companyName);
    const spec = release ? `L${release.tech}/${release.techMax} • $${Number(release.price).toFixed(0)}` : '-';
    return `Type ${row.type} • Company ${escapeHtml(row.companyName)} • Day ${Math.floor(row.day)} • ${spec}`;
  });
}

function formatPersonNameByInvestorId(investorId) {
  if (!investorId) return '—';
  if (investorId === game.player.id) return game.player.name;
  const npc = game.npcs.find((entry) => entry.id === investorId);
  if (npc) return npc.name;
  const company = Object.values(game.companies).find((entry) => entry.key === investorId);
  if (company) return `${company.name} (Corporate)`;
  return investorId;
}

function toTitleCase(value) {
  return String(value)
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const UPGRADE_BASELINE_DEFAULTS = {
  architecture: 2,
  clockSpeed: 1.5,
  coreDesign: 1,
  cacheStack: 512,
  lithography: 180,
  powerEfficiency: 98,
};

function getUpgradeSpecLabel(key, value) {
  if (key === 'architecture') return `Gen ${value.toFixed(0)} architecture`;
  if (key === 'clockSpeed') return `${value.toFixed(2)} GHz boost clock`;
  if (key === 'coreDesign') return `${value.toFixed(0)} cores`;
  if (key === 'cacheStack') return value >= 1024 ? `${(value / 1024).toFixed(2)} MB L3 cache` : `${value.toFixed(0)} KB L3 cache`;
  if (key === 'lithography') return `${value.toFixed(0)} nm node process`;
  if (key === 'powerEfficiency') return `${value.toFixed(0)} W TDP profile`;
  return `${value.toFixed(2)}`;
}

function getUpgradeStepImpactLabel(key, step) {
  const magnitude = Math.abs(Number(step ?? 0));
  if (!Number.isFinite(magnitude) || magnitude <= 0) return 'No upgrade delta';
  if (key === 'architecture') return `+${magnitude.toFixed(0)} gen / upgrade`;
  if (key === 'clockSpeed') return `+${magnitude.toFixed(2)} GHz / upgrade`;
  if (key === 'coreDesign') return `+${magnitude.toFixed(0)} core / upgrade`;
  if (key === 'cacheStack') return `+${magnitude.toFixed(0)} KB cache / upgrade`;
  if (key === 'lithography') return `-${magnitude.toFixed(0)} nm / upgrade`;
  if (key === 'powerEfficiency') return `-${magnitude.toFixed(0)} W TDP / upgrade`;
  return `${magnitude.toFixed(2)} / upgrade`;
}

function ensureCompanyUpgradeBaseline(company) {
  if (!company?.key || upgradeBaselineByCompany[company.key]) return;
  const baseline = {};
  Object.entries(company.upgrades ?? {}).forEach(([upgradeKey, upgrade]) => {
    const fallback = UPGRADE_BASELINE_DEFAULTS[upgradeKey];
    baseline[upgradeKey] = Number.isFinite(fallback) ? fallback : Number(upgrade?.value ?? 0);
  });
  upgradeBaselineByCompany[company.key] = baseline;
}

function estimateUpgradeTierAndCost(companyKey, key, upgrade) {
  const baseline = upgradeBaselineByCompany[companyKey]?.[key]
    ?? UPGRADE_BASELINE_DEFAULTS[key]
    ?? upgrade.value;
  const step = Math.max(0.0001, Math.abs(Number(upgrade.step ?? 1)));
  const prefersLowerValue = key === 'lithography' || key === 'powerEfficiency';
  const delta = prefersLowerValue ? baseline - upgrade.value : upgrade.value - baseline;
  const tier = Math.max(0, Math.round(delta / step));
  const premiumGrowth = Math.max(1.03, Number(upgrade.costGrowth ?? 1.12) * 1.12);
  const nextTierCost = Math.round(Number(upgrade.baseCost ?? 1000) * Math.pow(premiumGrowth, tier + 1));
  return { tier, nextTierCost };
}

function calculateResearchPerDayFromState(company) {
  const researchers = Number(company.teams?.researchers?.count ?? 0);
  const architecture = Number(company.upgrades?.architecture?.value ?? 0);
  const lithography = Number(company.upgrades?.lithography?.value ?? 220);
  return 4.2 + researchers * 2.2 + architecture * 0.8 + (220 - lithography) * 0.04;
}

function getRdMonthKey(elapsedDays) {
  return Math.floor(Math.max(0, elapsedDays) / 30);
}

function estimateDynamicRdMonthlyBudget(company) {
  const researchBase = Math.max(24, Number(company.researchPerDay ?? 0) * 30 * 0.9);
  const cash = Math.max(0, Number(company.cash ?? 0));
  const valuation = Math.max(20, getCompanyValuation(company));
  const productionReserve = Math.max(18, Number(company.revenuePerDay ?? 0) * 10, valuation * 0.012);
  const idleCash = Math.max(0, cash - productionReserve);
  const idleCashRatio = idleCash / Math.max(1, productionReserve);
  const cashFundedBudget = idleCash * Math.min(0.72, Math.max(0.22, 0.2 + idleCashRatio * 0.08));
  return Math.max(researchBase, cashFundedBudget, valuation * 0.018);
}

function ensureRdFund(company, elapsedDays) {
  const monthKey = getRdMonthKey(elapsedDays);
  const existing = rdFundByCompany[company.key];
  const monthlyBudget = estimateDynamicRdMonthlyBudget(company);
  if (existing?.monthKey === monthKey) {
    existing.monthlyBudget = Math.max(existing.monthlyBudget, monthlyBudget);
    return existing;
  }
  const refreshed = { monthKey, monthlyBudget, spent: 0 };
  rdFundByCompany[company.key] = refreshed;
  return refreshed;
}

function getRdFundRemaining(company, elapsedDays) {
  const entry = ensureRdFund(company, elapsedDays);
  return Math.max(0, entry.monthlyBudget - entry.spent);
}


function hashSeedFromText(text) {
  let hash = 2166136261;
  const value = String(text || '');
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function getNpcCognitionTraits(npcId, companyKey) {
  const seed = hashSeedFromText(`${npcId}:${companyKey}`);
  const sample = (shift) => ((seed >>> shift) & 1023) / 1023;
  return {
    strategy: clamp01(0.25 + sample(1) * 0.75),
    courage: clamp01(0.2 + sample(5) * 0.8),
    moral: clamp01(0.25 + sample(9) * 0.75),
    precision: clamp01(0.2 + sample(13) * 0.8),
    discipline: clamp01(0.2 + sample(17) * 0.8),
  };
}


function getLeadershipInfluence(company) {
  const executives = [
    { role: 'CEO', id: company.ceoId, weight: 1.0 },
    { role: 'CTO', id: company.executives?.cto?.occupantId ?? null, weight: 0.72 },
    { role: 'CFO', id: company.executives?.cfo?.occupantId ?? null, weight: 0.66 },
    { role: 'COO', id: company.executives?.coo?.occupantId ?? null, weight: 0.64 },
    { role: 'CMO', id: company.executives?.cmo?.occupantId ?? null, weight: 0.58 },
  ].filter((entry) => entry.id);

  if (!executives.length) {
    return { strategy: 0.5, courage: 0.5, moral: 0.5, precision: 0.5, discipline: 0.5, authority: 0 };
  }

  let totalWeight = 0;
  const aggregate = { strategy: 0, courage: 0, moral: 0, precision: 0, discipline: 0 };
  for (const executive of executives) {
    const traits = getNpcCognitionTraits(executive.id, company.key);
    totalWeight += executive.weight;
    aggregate.strategy += traits.strategy * executive.weight;
    aggregate.courage += traits.courage * executive.weight;
    aggregate.moral += traits.moral * executive.weight;
    aggregate.precision += traits.precision * executive.weight;
    aggregate.discipline += traits.discipline * executive.weight;
  }

  const normalize = (value) => clamp01(value / Math.max(0.0001, totalWeight));
  return {
    strategy: normalize(aggregate.strategy),
    courage: normalize(aggregate.courage),
    moral: normalize(aggregate.moral),
    precision: normalize(aggregate.precision),
    discipline: normalize(aggregate.discipline),
    authority: totalWeight,
  };
}

function scoreUpgradeOpportunity(company, upgradeKey, upgrade, nextTierCost, traits, marketPressure) {
  const step = Math.max(0.0001, Math.abs(Number(upgrade.step ?? 1)));
  const baseCost = Math.max(1, Number(upgrade.baseCost ?? nextTierCost));
  const efficiency = step / Math.max(1, nextTierCost / baseCost);
  const isRisky = upgradeKey === 'clockSpeed' || upgradeKey === 'architecture';
  const isSafe = upgradeKey === 'powerEfficiency' || upgradeKey === 'cooling';
  const shortTerm = (company.revenuePerDay * 0.0012) + (company.marketShare * 0.04) + (traits.precision * 1.3);
  const longTerm = (company.researchPerDay * 0.05) + (company.reputation * 0.03) + (traits.strategy * 2.4);
  const courageBias = isRisky ? traits.courage * 1.6 : 0;
  const moralBias = isSafe ? traits.moral * 1.2 : 0;
  const disciplinePenalty = (1 - traits.discipline) * 0.8;
  return (efficiency * 18) + shortTerm + longTerm + courageBias + moralBias + marketPressure - disciplinePenalty;
}


function getExecutiveRoleFit(role, candidateTraits, ceoTraits) {
  const target = role === 'cto'
    ? { strategy: 0.82, courage: 0.56, moral: 0.52, precision: 0.86, discipline: 0.72 }
    : role === 'cfo'
      ? { strategy: 0.7, courage: 0.42, moral: 0.68, precision: 0.9, discipline: 0.88 }
      : role === 'coo'
        ? { strategy: 0.68, courage: 0.62, moral: 0.64, precision: 0.66, discipline: 0.92 }
        : { strategy: 0.64, courage: 0.72, moral: 0.6, precision: 0.58, discipline: 0.64 };

  const ceoPrinciple = (ceoTraits.moral * 0.35) + (ceoTraits.strategy * 0.4) + (ceoTraits.discipline * 0.25);
  const alignment = 1 - Math.abs(candidateTraits.moral - ceoTraits.moral) * 0.45;
  const distancePenalty =
    Math.abs(candidateTraits.strategy - target.strategy) * 0.26 +
    Math.abs(candidateTraits.courage - target.courage) * 0.16 +
    Math.abs(candidateTraits.moral - target.moral) * 0.2 +
    Math.abs(candidateTraits.precision - target.precision) * 0.22 +
    Math.abs(candidateTraits.discipline - target.discipline) * 0.16;
  return (ceoPrinciple * 0.34) + (alignment * 0.26) + (1 - distancePenalty);
}

function applyNpcExecutiveGovernanceCycle(state) {
  const next = { ...state, companies: { ...state.companies } };
  const npcPool = Array.isArray(next.npcs) ? next.npcs.map((npc) => npc.id).filter(Boolean) : [];
  if (!npcPool.length) return state;

  let changed = false;
  for (const company of Object.values(next.companies)) {
    if (!company?.isEstablished) continue;
    if (!company.ceoId || company.ceoId === next.player.id) continue;

    const ceoTraits = getNpcCognitionTraits(company.ceoId, company.key);
    const governancePulse = (Number(next.elapsedDays || 0) + (hashSeedFromText(company.key) % 11)) % 7;
    if (governancePulse !== 0) continue;

    const candidateIds = npcPool.filter((id) => id !== company.ceoId);
    if (!candidateIds.length) continue;

    const roles = ['cto', 'cfo', 'coo', 'cmo'];
    const used = new Set([company.ceoId]);
    const updatedExecutives = { ...(company.executives || {}) };

    for (const role of roles) {
      const ranked = candidateIds
        .filter((id) => !used.has(id))
        .map((id) => {
          const traits = getNpcCognitionTraits(id, company.key);
          const fit = getExecutiveRoleFit(role, traits, ceoTraits);
          const variability = pseudoNoise(hashSeedFromText(`${id}:${role}`), next.elapsedDays, 0.77) * 0.18;
          return { id, score: fit + variability };
        })
        .sort((a, b) => b.score - a.score);
      const chosen = ranked[0];
      if (!chosen) continue;
      used.add(chosen.id);
      const previous = updatedExecutives[role] || {};
      updatedExecutives[role] = { ...previous, occupantId: chosen.id };
    }

    next.companies[company.key] = { ...company, executives: updatedExecutives };
    changed = true;
  }

  return changed ? next : state;
}

function applyNpcResearchCycle(state) {
  let next = state;
  const companies = { ...next.companies };
  let changed = false;

  const marketAverage = Object.values(companies).reduce((sum, c) => sum + Math.max(0, Number(c.marketShare ?? 0)), 0) / Math.max(1, Object.keys(companies).length);

  Object.values(companies).forEach((company) => {
    ensureCompanyUpgradeBaseline(company);
    if (!company.isEstablished) return;
    if (!company.ceoId || company.ceoId === next.player.id) return;

    const ceoTraits = getNpcCognitionTraits(company.ceoId, company.key);
    const leadership = getLeadershipInfluence(company);
    const traits = {
      strategy: clamp01((ceoTraits.strategy * 0.62) + (leadership.strategy * 0.38)),
      courage: clamp01((ceoTraits.courage * 0.65) + (leadership.courage * 0.35)),
      moral: clamp01((ceoTraits.moral * 0.6) + (leadership.moral * 0.4)),
      precision: clamp01((ceoTraits.precision * 0.58) + (leadership.precision * 0.42)),
      discipline: clamp01((ceoTraits.discipline * 0.55) + (leadership.discipline * 0.45)),
    };
    const marketPressure = (Math.max(0, marketAverage - Number(company.marketShare ?? 0)) * 0.08) + ((1 - traits.moral) * 0.5);

    let workingCompany = company;
    const fund = ensureRdFund(workingCompany, next.elapsedDays);
    const targetResearchLiquidity = Math.max(workingCompany.research, fund.monthlyBudget * (0.42 + traits.strategy * 0.26));
    const researchTopUpGap = Math.max(0, targetResearchLiquidity - Number(workingCompany.research ?? 0));
    const productionReserve = Math.max(18, Number(workingCompany.revenuePerDay ?? 0) * 10, getCompanyValuation(workingCompany) * 0.012);
    const availableCashForRd = Math.max(0, Number(workingCompany.cash ?? 0) - productionReserve);
    const rdTopUp = Math.min(researchTopUpGap / 0.92, availableCashForRd * (0.28 + traits.strategy * 0.26));
    if (rdTopUp > 1) {
      workingCompany = {
        ...workingCompany,
        cash: Math.max(0, workingCompany.cash - rdTopUp),
        research: workingCompany.research + rdTopUp * 0.92,
        researchAssetValue: Number(workingCompany.researchAssetValue ?? 0) + rdTopUp * 0.92,
      };
      fund.spent += rdTopUp;
      changed = true;
    }
    const thinkingDepth = 2 + Math.round(traits.strategy * 2 + Math.min(3, fund.monthlyBudget / Math.max(1, productionReserve)));

    for (let round = 0; round < thinkingDepth; round += 1) {
      const upgradeOptions = Object.entries(workingCompany.upgrades ?? {})
        .map(([upgradeKey, upgrade]) => {
          const { nextTierCost } = estimateUpgradeTierAndCost(workingCompany.key, upgradeKey, upgrade);
          const decisionScore = scoreUpgradeOpportunity(workingCompany, upgradeKey, upgrade, nextTierCost, traits, marketPressure);
          return { upgradeKey, upgrade, nextTierCost, decisionScore };
        })
        .sort((a, b) => b.decisionScore - a.decisionScore);

      const candidate = upgradeOptions.find((option, index) => {
        const remainingFund = Math.max(0, fund.monthlyBudget - fund.spent);
        const liquidityGuard = Math.max(1, workingCompany.cash * (0.02 + (1 - traits.courage) * 0.04));
        const budgetSafe = remainingFund >= option.nextTierCost && workingCompany.research >= option.nextTierCost;
        const canAffordRisk = (workingCompany.cash - option.nextTierCost) >= liquidityGuard;
        const variationGate = index === 0 || Math.random() < (0.45 + traits.precision * 0.35);
        return budgetSafe && canAffordRisk && variationGate;
      });
      if (!candidate) break;

      const current = workingCompany.upgrades[candidate.upgradeKey];
      const nextValue = candidate.upgradeKey === 'lithography' || candidate.upgradeKey === 'powerEfficiency'
        ? Math.max(candidate.upgradeKey === 'lithography' ? 5 : 28, current.value + current.step)
        : current.value + current.step;

      const researchCost = candidate.nextTierCost;
      const shortTermPenalty = Math.max(0, researchCost * (0.0004 + (1 - traits.discipline) * 0.0005));
      const strategicBoost = Math.max(0, candidate.decisionScore * (0.02 + traits.strategy * 0.05));

      workingCompany = {
        ...workingCompany,
        cash: Math.max(0, workingCompany.cash - shortTermPenalty),
        research: Math.max(0, workingCompany.research - researchCost),
        reputation: Math.max(1, workingCompany.reputation + (traits.moral - 0.5) * 0.04 + (strategicBoost * 0.002)),
        upgrades: {
          ...workingCompany.upgrades,
          [candidate.upgradeKey]: {
            ...current,
            value: nextValue,
          },
        },
      };
      workingCompany = {
        ...workingCompany,
        researchPerDay: calculateResearchPerDayFromState(workingCompany),
      };
      fund.spent += researchCost;
      changed = true;
    }

    if (workingCompany !== company) {
      companies[workingCompany.key] = workingCompany;
    }
  });

  if (!changed) return next;
  return {
    ...next,
    companies,
  };
}


function pseudoNoise(seed, day, salt = 0) {
  const value = Math.sin((seed * 0.0001) + (day * 0.173) + salt) * 43758.5453;
  return value - Math.floor(value);
}

function applyNpcMarketInteractionCycle(state) {
  const next = { ...state, companies: { ...state.companies } };
  const npcIds = Array.isArray(next.npcs) ? next.npcs.map((npc) => npc.id) : [];
  if (!npcIds.length) return state;

  let changed = false;
  const establishedCompanies = Object.values(next.companies).filter((company) => company?.isEstablished);
  if (!establishedCompanies.length) return state;

  const valuationRows = establishedCompanies
    .map((company) => ({
      company,
      valuation: Math.max(1, getCompanyValuation(company)),
      sharePrice: Math.max(0.01, getSharePrice(company)),
    }))
    .sort((a, b) => b.valuation - a.valuation);

  for (const npcId of npcIds) {
    const seed = hashSeedFromText(`${npcId}:market`);
    const candidateRows = valuationRows.slice(0, 8);
    if (!candidateRows.length) continue;

    const pickIndex = Math.min(candidateRows.length - 1, Math.floor(pseudoNoise(seed, next.elapsedDays, 0.5) * candidateRows.length));
    const pick = candidateRows[pickIndex];
    const companyKey = pick.company.key;
    const currentCompany = next.companies[companyKey];
    if (!currentCompany) continue;

    const individualTraits = getNpcCognitionTraits(npcId, companyKey);
    const leadership = getLeadershipInfluence(currentCompany);
    const traits = {
      strategy: clamp01((individualTraits.strategy * 0.45) + (leadership.strategy * 0.55)),
      courage: clamp01((individualTraits.courage * 0.4) + (leadership.courage * 0.6)),
      moral: clamp01((individualTraits.moral * 0.5) + (leadership.moral * 0.5)),
      precision: clamp01((individualTraits.precision * 0.48) + (leadership.precision * 0.52)),
      discipline: clamp01((individualTraits.discipline * 0.42) + (leadership.discipline * 0.58)),
    };
    const investorShares = Number(currentCompany.investors?.[npcId] ?? 0);
    const riskMood = pseudoNoise(seed, next.elapsedDays, 1.3);
    const conviction = clamp01((traits.strategy * 0.4) + (traits.courage * 0.3) + (traits.precision * 0.3));
    const actionBias = (riskMood + conviction) / 2;

    const baseAmount = Math.max(1, currentCompany.cash * (0.00035 + traits.courage * 0.0009));
    const activityMultiplier = 0.8 + pseudoNoise(seed, next.elapsedDays, 2.1) * 0.6;
    const notionalAmount = baseAmount * activityMultiplier;

    const buySignal = actionBias > 0.54 && pick.sharePrice < (pick.valuation / Math.max(1, currentCompany.totalShares || 1)) * (1.2 + traits.precision * 0.5);
    const sellSignal = investorShares > 0 && (actionBias < 0.41 || currentCompany.marketShare < 1.2);

    if (buySignal) {
      const result = transactShares(next, npcId, companyKey, 'buy', notionalAmount, 'auto');
      if (result.tradedValue > 0) {
        Object.assign(next, result.next);
        changed = true;
      }
      continue;
    }

    if (sellSignal) {
      const portion = 0.08 + (1 - traits.moral) * 0.22;
      const sellValue = Math.min(investorShares * pick.sharePrice, investorShares * portion * pick.sharePrice);
      const result = transactShares(next, npcId, companyKey, 'sell', sellValue, 'auto');
      if (result.tradedValue > 0) {
        Object.assign(next, result.next);
        changed = true;
      }
    }
  }

  return changed ? next : state;
}

function renderCompanyDetail() {
  const key = selectedCompanyForDetail;
  const company = key ? game.companies[key] : null;
  if (!company) {
    companyDetailTitle.textContent = 'Company Subfullframe';
    companyDetailBody.innerHTML = '<p>Company not found.</p>';
    return;
  }
  ensureCompanyUpgradeBaseline(company);

  const boardMembers = Object.entries(company.investors ?? {})
    .filter(([, shares]) => Number.isFinite(shares) && shares > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([investorId, shares], index) => ({
      rank: index + 1,
      investorId,
      name: formatPersonNameByInvestorId(investorId),
      shares,
      ownership: ((shares / Math.max(1, company.totalShares || 1)) * 100),
    }));

  const executiveRows = [
    { role: 'CEO', name: formatPersonNameByInvestorId(company.ceoId) },
    { role: 'COO', name: formatPersonNameByInvestorId(company.executives?.coo?.occupantId ?? null) },
    { role: 'CMO', name: formatPersonNameByInvestorId(company.executives?.cmo?.occupantId ?? null) },
    { role: 'CTO', name: formatPersonNameByInvestorId(company.executives?.cto?.occupantId ?? null) },
    { role: 'CFO', name: formatPersonNameByInvestorId(company.executives?.cfo?.occupantId ?? null) },
  ];

  const upgrades = company.upgrades ?? {};
  const cpuScore =
    (Number(upgrades.architecture?.value ?? 0) * 120)
    + (Number(upgrades.clockSpeed?.value ?? 0) * 90)
    + (Number(upgrades.coreDesign?.value ?? 0) * 88)
    + ((Number(upgrades.cacheStack?.value ?? 0) / 1024) * 60)
    + ((220 / Math.max(1, Number(upgrades.lithography?.value ?? 1))) * 82)
    + ((110 / Math.max(1, Number(upgrades.powerEfficiency?.value ?? 1))) * 75);

  const technologyRows = Object.entries(upgrades)
    .map(([upgradeKey, upgrade]) => {
      const value = Number(upgrade?.value ?? 0);
      const { tier, nextTierCost } = estimateUpgradeTierAndCost(company.key, upgradeKey, upgrade);
      return {
        name: toTitleCase(upgradeKey),
        spec: getUpgradeSpecLabel(upgradeKey, value),
        stepImpact: getUpgradeStepImpactLabel(upgradeKey, upgrade?.step),
        nextTierCost,
      };
    })
    .sort((a, b) => a.nextTierCost - b.nextTierCost);

  const topProductScore = Number.isFinite(company.lastProductScore)
    ? Number(company.lastProductScore)
    : (getCompanyValuation(company) * 0.25)
      + (company.marketShare * 20)
      + (company.reputation * 8)
      + (company.releaseCount * 40)
      + (company.researchPerDay * 30);

  const technologyCapabilityScore = company.field === 'semiconductor'
    ? (cpuScore * 0.62) + (company.researchPerDay * 20) + (company.releaseCount * 34) + (company.reputation * 6)
    : company.field === 'game'
      ? topProductScore + (company.releaseCount * 14) + (company.marketShare * 4)
      : topProductScore + (company.researchPerDay * 10);

  const averageUpgradeCost = technologyRows.length
    ? technologyRows.reduce((sum, row) => sum + row.nextTierCost, 0) / technologyRows.length
    : 0;
  const upgradeCostSpread = technologyRows.length
    ? Math.sqrt(technologyRows.reduce((sum, row) => sum + Math.pow(row.nextTierCost - averageUpgradeCost, 2), 0) / technologyRows.length)
    : 0;
  const rdBalanceIndex = Math.max(0, 100 - (upgradeCostSpread / Math.max(1, averageUpgradeCost)) * 120);
  const hasNpcCeo = company.ceoId && company.ceoId !== game.player.id;
  const hasCto = Boolean(company.executives?.cto?.occupantId);
  const rdCoordinationNote = !hasCto
    ? 'CTO belum terisi, riset cenderung tidak merata.'
    : rdBalanceIndex < 70
      ? 'Distribusi riset belum rata.'
      : 'Koordinasi CEO/CTO cukup stabil untuk riset merata.';

  const buildingRows = Object.entries(company.teams ?? {})
    .map(([teamKey, team]) => ({ name: toTitleCase(teamKey), count: Number(team?.count ?? 0) }))
    .sort((a, b) => b.count - a.count);
  const rdFundRemaining = getRdFundRemaining(company, game.elapsedDays);
  const rdFund = ensureRdFund(company, game.elapsedDays);

  companyDetailTitle.textContent = `${company.name} • Subfullframe`;
  companyDetailBody.innerHTML = `
    <article class="detail-tile"><h3>Identity</h3><p>Founder: ${company.founder}</p><p>CEO: ${formatPersonNameByInvestorId(company.ceoId)}</p><p>Field: ${company.field}</p></article>
    <article class="detail-tile"><h3>Financial</h3><p>Cash: ${formatMoneyCompact(company.cash)}</p><p>Valuation: ${formatMoneyCompact(getCompanyValuation(company))}</p><p>Share: $${getSharePrice(company).toFixed(2)}</p><p>R&D Fund (Monthly Remaining): ${formatMoneyCompact(rdFundRemaining)} / ${formatMoneyCompact(rdFund.monthlyBudget)}</p></article>
    <article class="detail-tile"><h3>Operation</h3><p>Research/day: ${company.researchPerDay.toFixed(2)}</p><p>Revenue/day: ${formatMoneyCompact(company.revenuePerDay)}</p><p>Market Share: ${company.marketShare.toFixed(1)}%</p></article>
    <article class="detail-tile"><h3>Game State</h3><p>Release Count: ${company.releaseCount}</p><p>Reputation: ${company.reputation.toFixed(1)}</p><p>Established: ${company.isEstablished ? 'Yes' : 'No'}</p></article>
    <details class="detail-tile"><summary>Board of Directors</summary><div class="detail-expand-content">${boardMembers.length === 0
      ? '<p>Belum ada anggota dewan.</p>'
      : boardMembers.map((member) => `<p>#${member.rank} ${member.name} • ${member.shares.toFixed(2)} saham (${member.ownership.toFixed(2)}%)</p>`).join('')}</div></details>
    <details class="detail-tile"><summary>Executives</summary><div class="detail-expand-content">${executiveRows.map((entry) => `<p>${entry.role}: ${entry.name}</p>`).join('')}</div></details>
    <details class="detail-tile"><summary>Assets</summary><div class="detail-expand-content">
      <details><summary>Technology</summary><div>
        <p>CPU Performance Score: ${cpuScore.toFixed(2)}</p>
        <p>Technology Capability Score: ${technologyCapabilityScore.toFixed(2)}</p>
        <p>Top Product Score (Ranking): ${topProductScore.toFixed(2)}</p>
        <p>R&D Balance Index: ${rdBalanceIndex.toFixed(1)}%</p>
        <p>${hasNpcCeo ? 'CEO dipimpin AI. ' : 'CEO dipimpin player. '}${rdCoordinationNote}</p>
        ${technologyRows.map((entry) => `<p>${entry.name}: ${entry.spec} • ${entry.stepImpact} • Next Upgrade ${formatMoneyCompact(entry.nextTierCost)}</p>`).join('')}
      </div></details>
      <details><summary>Buildings</summary><div>${buildingRows.map((entry) => `<p>${entry.name}: ${entry.count}</p>`).join('')}</div></details>
    </div></details>
  `;
}

function runTick(n = 1) {
  try {
    const next = runTicksBatched(game, n, simulateTick);
    const withNpcGovernance = applyNpcExecutiveGovernanceCycle(next);
    const withNpcResearch = applyNpcResearchCycle(withNpcGovernance);
    const withNpcMarketInteraction = applyNpcMarketInteractionCycle(withNpcResearch);
    const withSpecializedMarket = applySpecializedReleaseLogic(withNpcMarketInteraction);
    if (!isValidGameState(withSpecializedMarket)) {
      debugReport('invalid-state', 'Tick produced invalid game state', { elapsedDays: game.elapsedDays, tickCount: game.tickCount });
      setStatus('Tick warning: invalid state detected, previous safe state retained.', true);
      return;
    }
    game = withSpecializedMarket;
    render();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    debugReport('tick-error', reason, { stack: error instanceof Error ? error.stack : null });
    stopAutoIfRunning();
    setStatus(`Tick failed due to engine error: ${reason}`, true);
  }
}

function handleTrade(mode) {
  const key = selectedCompanyKey();
  const company = game.companies[key];
  if (!company) {
    setStatus('Company not found.', true);
    return;
  }
  const context = getPlayerContext(company);
  const amount = getRequestedTradeValue(mode, context);

  const preview = getTradePreview(
    game,
    company,
    game.player.id,
    context.investorCash,
    context.currentShares,
    mode,
    amount,
    'auto'
  );
  if (preview.grossTradeValue <= 0) {
    setStatus('Trade failed: insufficient liquidity or funds.', true);
    return;
  }
  const changed = applyActionSafely(
    (state) => transactShares(state, state.player.id, key, mode, amount, 'auto').next,
    {
      successMessage: `${mode === 'buy' ? 'Buy' : 'Sell'} ${key} completed. Gross ${formatMoneyCompact(preview.grossTradeValue)}.`,
      noopMessage: 'Trade tidak dieksekusi: likuiditas, kepemilikan, atau dana tidak memenuhi.',
      errorMessage: 'Trade processing failed',
    }
  );
  if (changed) render();
}

function handleInvestCompanyPlan() {
  const key = selectedCompanyKey();
  const company = game.companies[key];
  if (!company) {
    setStatus('Company not found.', true);
    return;
  }
  const plan = game.plans[key];
  if (!plan) {
    setStatus(`Establishment plan for ${key} is not available.`, true);
    return;
  }
  if (plan.isEstablished) {
    setStatus(`Plan ${key} is already completed (company already established).`, true);
    return;
  }
  const context = getPlayerContext(company);
  const amount = Math.max(1, getRequestedTradeValue('buy', context));
  if (amount > context.investorCash) {
    setStatus('Invest plan failed: player cash is insufficient.', true);
    return;
  }
  const changed = applyActionSafely(
    (state) => investInCompanyPlan(state, state.player.id, key, amount),
    {
      successMessage: `Company plan ${key} invested successfully: ${formatMoneyCompact(amount)}.`,
      noopMessage: 'Invest plan failed: minimum amount or plan validation was not satisfied.',
      errorMessage: 'Invest plan error',
    }
  );
  if (changed) render();
}

function handleLicenseRequest() {
  const companies = Object.values(game.companies);
  const gameCompany = companies.find((company) => company.isEstablished && company.field === 'game');
  const appStoreCompany = companies.find((company) => company.isEstablished && company.field === 'software' && company.softwareSpecialization === 'app-store');
  if (!gameCompany || !appStoreCompany) {
    setStatus('No valid game + app-store company pair is available yet.', true);
    return;
  }
  const changed = applyActionSafely(
    (state) => requestAppStoreLicense(
      state,
      state.player.id,
      gameCompany.key,
      appStoreCompany.key,
      'license request from standalone dreambusiness'
    ),
    {
      successMessage: `Request AppStore license: ${gameCompany.name} -> ${appStoreCompany.name}.`,
      noopMessage: 'License request was rejected by engine rules.',
      errorMessage: 'License request error',
    }
  );
  if (changed) render();
}

function handleCommunityPlanSeed() {
  const key = selectedCompanyKey();
  const company = game.companies[key];
  if (!company) return;
  const context = getPlayerContext(company);
  const amount = Math.max(6, getRequestedTradeValue('buy', context));
  const planName = `${company.name} Labs`;
  const planCreated = applyActionSafely(
    (state) => createCommunityCompanyPlan(
      state,
      state.player.id,
      planName,
      amount,
      company.field,
      company.softwareSpecialization ?? undefined
    ),
    {
      successMessage: null,
      noopMessage: 'Failed to create community plan (check funds/name/active slots).',
      errorMessage: 'Community plan error',
    }
  );
  if (!planCreated) {
    return;
  }
  const plan = game.communityPlans.find((entry) => entry.companyName === planName && entry.status === 'funding');
  if (!plan) {
    setStatus('Community plan was created, but no plan was found for follow-up investment.', true);
    render();
    return;
  }
  const seeded = applyActionSafely(
    (state) => investInCommunityPlan(state, state.player.id, plan.id, Math.max(1, amount / 2)),
    {
      successMessage: `Community plan ${planName} created and funded.`,
      noopMessage: `Community plan ${planName} was created, but top-up investment was not processed.`,
      errorMessage: `Top-up community plan ${planName} error`,
    }
  );
  if (!seeded) {
    setStatus(`Community plan ${planName} was created, but top-up investment failed.`, true);
  }
  render();
}

on(buyBtn, 'click', () => handleTrade('buy'));
on(sellBtn, 'click', () => handleTrade('sell'));
on(investPlanBtn, 'click', handleInvestCompanyPlan);
on(licenseBtn, 'click', handleLicenseRequest);
on(communityBtn, 'click', handleCommunityPlanSeed);
on(sliderModeInvestBtn, 'click', () => {
  sliderMode = 'invest';
  updateSliderPreview();
});
on(sliderModeSellBtn, 'click', () => {
  sliderMode = 'sell';
  updateSliderPreview();
});
on(investSlider, 'input', () => {
  const raw = Number(investSlider.value);
  sliderPercentByMode[sliderMode] = Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 0;
  updateSliderPreview();
});
on(companySelect, 'change', updateSliderPreview);
on(toFullframeBtn, 'click', () => { frame = 'full'; renderCompanyFrames(); renderFrameVisibility(); });
on(toInvestmentBtn, 'click', () => { frame = 'investment'; updateSliderPreview(); updateInvestmentActionState(); renderFrameVisibility(); });
on(toRankingBtn, 'click', () => { frame = 'ranking'; renderRankingFrame(); renderFrameVisibility(); });
on(toNewsBtn, 'click', () => { frame = 'news'; renderNewsFrame(); renderFrameVisibility(); });
on(toProfileBtn, 'click', () => { frame = 'profile'; renderProfileFrame(); renderFrameVisibility(); });
on(toMarketsBtn, 'click', () => { frame = 'markets'; renderMarketsFrame(); renderFrameVisibility(); });
on(toMyCompanyBtn, 'click', () => { frame = 'myCompany'; renderMyCompanyFrame(); renderFrameVisibility(); });
on(backFromFullBtn, 'click', () => { frame = 'main'; renderFrameVisibility(); });
on(backFromRankingBtn, 'click', () => { frame = 'main'; renderFrameVisibility(); });
on(backFromInvestmentBtn, 'click', () => { frame = 'main'; renderFrameVisibility(); });
on(backFromNewsBtn, 'click', () => { frame = 'main'; renderFrameVisibility(); });
on(backFromSubBtn, 'click', () => { frame = 'full'; renderFrameVisibility(); });
on(backFromProfileBtn, 'click', () => { frame = 'main'; renderFrameVisibility(); });
on(backFromMarketsBtn, 'click', () => { frame = 'main'; renderFrameVisibility(); });
on(backFromMyCompanyBtn, 'click', () => { frame = 'main'; renderFrameVisibility(); });
on(rankingTopCompaniesBtn, 'click', () => { rankingMode = 'companies'; renderRankingFrame(); });
on(rankingRichestBtn, 'click', () => { rankingMode = 'richest'; renderRankingFrame(); });
on(rankingCpuBtn, 'click', () => { rankingMode = 'cpu'; renderRankingFrame(); });
on(rankingGameBtn, 'click', () => { rankingMode = 'game'; renderRankingFrame(); });
on(rankingComputerBtn, 'click', () => { rankingMode = 'computer'; renderRankingFrame(); });
on(rankingPhoneBtn, 'click', () => { rankingMode = 'phone'; renderRankingFrame(); });
on(companyFrameList, 'click', (event) => {
  const target = event.target.closest('[data-company-card]');
  if (!target) return;
  selectedCompanyForDetail = target.getAttribute('data-company-card');
  frame = 'sub';
  renderCompanyDetail();
  renderFrameVisibility();
});
on(myCompanyTabs, 'click', (event) => {
  const target = event.target.closest('[data-my-company]');
  if (!target) return;
  selectedMyCompanyKey = target.getAttribute('data-my-company');
  renderMyCompanyFrame();
});
on(foundCompanyBtn, 'click', () => {
  const candidate = Object.values(game.plans ?? {}).find((plan) => !plan.isEstablished);
  if (!candidate) {
    setStatus('No available company plan to found.', true);
    return;
  }
  const amount = Math.max(10, game.player.cash * 0.35);
  const changed = applyActionSafely(
    (state) => investInCompanyPlan(state, state.player.id, candidate.companyKey, amount),
    { successMessage: `Founding flow started for ${candidate.companyName}.`, errorMessage: 'Found company failed' }
  );
  if (changed) {
    frame = 'myCompany';
    render();
  }
});

on(myCompanyBody, 'click', (event) => {
  const trigger = event.target.closest('[data-mgmt-action]');
  if (!trigger || !selectedMyCompanyKey) return;
  const action = trigger.getAttribute('data-mgmt-action');
  const company = game.companies[selectedMyCompanyKey];
  if (!company) return;
  const statusEl = document.getElementById('myCompanyMgmtStatus');
  const setMgmtStatus = (text, isError = false) => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.style.color = isError ? '#b91c1c' : '#166534';
  };

  const selectEl = document.getElementById('myCompanyUpgradeSelect');
  const upgradeKey = selectEl?.value;
  const changed = applyActionSafely((state) => {
    const target = state.companies[selectedMyCompanyKey];
    if (!target) return state;
    if (action === 'upgrade-tech') {
      if (!upgradeKey || !target.upgrades?.[upgradeKey]) return state;
      const current = target.upgrades[upgradeKey];
      const nextValue = upgradeKey === 'lithography' || upgradeKey === 'powerEfficiency'
        ? Math.max(upgradeKey === 'lithography' ? 5 : 20, current.value + current.step)
        : current.value + current.step;
      const cost = Math.max(10, Number(current.baseCost ?? 1000) * 0.1);
      if (target.research < cost) return state;
      return {
        ...state,
        companies: {
          ...state.companies,
          [selectedMyCompanyKey]: {
            ...target,
            research: Math.max(0, target.research - cost),
            upgrades: { ...target.upgrades, [upgradeKey]: { ...current, value: nextValue } },
            lastRelease: `${target.lastRelease || target.name} • tech tuned`,
          }
        }
      };
    }
    if (action === 'ops-push') {
      return { ...state, companies: { ...state.companies, [selectedMyCompanyKey]: { ...target, boardMood: Math.min(1.5, target.boardMood + 0.05), reputation: Math.min(100, target.reputation + 0.4) } } };
    }
    if (action === 'finance-tune') {
      return { ...state, companies: { ...state.companies, [selectedMyCompanyKey]: { ...target, cash: target.cash + Math.max(5, target.revenuePerDay * 0.2), boardMood: Math.min(1.4, target.boardMood + 0.02) } } };
    }
    if (action === 'brand-push') {
      return { ...state, companies: { ...state.companies, [selectedMyCompanyKey]: { ...target, reputation: Math.min(100, target.reputation + 1.1), marketShare: Math.min(100, target.marketShare + 0.2) } } };
    }
    if (action === 'shareholder-pressure') {
      return { ...state, companies: { ...state.companies, [selectedMyCompanyKey]: { ...target, boardMood: Math.max(0.4, target.boardMood - 0.06), reputation: Math.max(1, target.reputation - 0.15) } } };
    }
    return state;
  }, { errorMessage: 'Management action failed' });

  if (changed) {
    setMgmtStatus('Management action executed.');
    renderMyCompanyFrame();
  } else {
    setMgmtStatus('Action blocked by role, budget, or company state.', true);
  }
});
on(document.getElementById('reset'), 'click', () => {
  game = createInitialGameState(DEFAULT_PROFILE_DRAFT);
  auto = false;
  autoBtn.textContent = 'Start';
  autoBtn.setAttribute('aria-pressed', 'false');
  if (timer) clearInterval(timer);
  timer = null;
  companySelect.innerHTML = '';
  previousSharePrices = {};
  previousPlayerCash = game.player.cash;
  Object.keys(upgradeBaselineByCompany).forEach((key) => delete upgradeBaselineByCompany[key]);
  Object.keys(rdFundByCompany).forEach((key) => delete rdFundByCompany[key]);
  Object.keys(companyReleaseState).forEach((key) => delete companyReleaseState[key]);
  releaseRegistry.splice(0, releaseRegistry.length);
  rankingCache.tick = -1;
  rankingCache.companies = null;
  rankingCache.richest = null;
  rankingCache.products = null;
  sliderMode = 'invest';
  sliderPercentByMode.invest = 25;
  sliderPercentByMode.sell = 25;
  debugReport('reset', 'Game reset by user');
  setStatus('Game has been reset.');
  frame = 'main';
  selectedCompanyForDetail = null;
  render();
});

on(autoBtn, 'click', () => {
  auto = !auto;
  autoBtn.textContent = auto ? 'Pause' : 'Start';
  autoBtn.setAttribute('aria-pressed', auto ? 'true' : 'false');
  if (auto) {
    timer = setInterval(() => runTick(1), 200);
  } else if (timer) {
    clearInterval(timer);
    timer = null;
  }
});

render();
