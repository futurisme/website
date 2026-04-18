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
  runTicksBatched,
  simulateTick,
  transactShares,
  withGameAction,
  getCompanySelectOptions,
  getTopCompaniesSnapshot,
} from '/dreambusiness/dream-engine.bundle.js';

const statsEl = document.getElementById('stats');
const feedEl = document.getElementById('feed');
const autoBtn = document.getElementById('auto');
const companySelect = document.getElementById('companySelect');
const tradeAmountInput = document.getElementById('tradeAmount');
const actionStatus = document.getElementById('actionStatus');
const frameMain = document.getElementById('frameMain');
const frameFull = document.getElementById('frameFull');
const frameRanking = document.getElementById('frameRanking');
const frameInvestment = document.getElementById('frameInvestment');
const frameSub = document.getElementById('frameSub');
const companyFrameList = document.getElementById('companyFrameList');
const companyDetailTitle = document.getElementById('companyDetailTitle');
const companyDetailBody = document.getElementById('companyDetailBody');
const toFullframeBtn = document.getElementById('toFullframe');
const toInvestmentBtn = document.getElementById('toInvestment');
const toRankingBtn = document.getElementById('toRanking');
const backFromFullBtn = document.getElementById('backFromFull');
const backFromRankingBtn = document.getElementById('backFromRanking');
const backFromInvestmentBtn = document.getElementById('backFromInvestment');
const backFromSubBtn = document.getElementById('backFromSub');
const rankingList = document.getElementById('rankingList');
const rankingTopCompaniesBtn = document.getElementById('rankingTopCompanies');
const rankingRichestBtn = document.getElementById('rankingRichest');
const rankingProductsBtn = document.getElementById('rankingProducts');

let game = createInitialGameState(DEFAULT_PROFILE_DRAFT);
let auto = false;
let timer = null;
let frame = 'main';
let selectedCompanyForDetail = null;
let rankingMode = 'companies';

function getDisplayCompanies(state) {
  return getCompanySelectOptions(state)
    .slice(0, 10)
    .map((item, index) => ({
      key: item.key,
      slotId: String(index + 1),
      name: state.companies[item.key].name,
      company: state.companies[item.key],
    }));
}

function selectedCompanyKey() {
  return companySelect.value || COMPANY_KEYS[0];
}

function selectedTradeAmount() {
  const raw = Number(tradeAmountInput.value);
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
}

function setStatus(message, isError = false) {
  actionStatus.textContent = message;
  actionStatus.style.color = isError ? '#f1a0a0' : '#9ad7a8';
}

function render() {
  const displayCompanies = getDisplayCompanies(game);
  if (!companySelect.options.length || companySelect.options.length !== displayCompanies.length) {
    companySelect.innerHTML = displayCompanies
      .map((item) => `<option value="${item.key}">ID ${item.slotId} • ${item.name}</option>`)
      .join('');
  }

  const investorWorth = getInvestorHoldingsValue(game, game.player.id);
  const investorWeekly = getInvestorWeeklyIncomeEstimate(game, game.player.id);
  statsEl.innerHTML = `
    <article><h2>Hari Simulasi</h2><strong>${game.elapsedDays}</strong><small>${formatDateFromDays(game.elapsedDays)}</small></article>
    <article><h2>Cash Player</h2><strong>${formatMoneyCompact(game.player.cash)}</strong><small>${game.player.name}</small></article>
    <article><h2>Total Holdings</h2><strong>${formatMoneyCompact(investorWorth)}</strong><small>nilai kepemilikan</small></article>
    <article><h2>Weekly Income</h2><strong>${formatMoneyCompact(investorWeekly)}</strong><small>estimasi mingguan</small></article>
  `;

  const feed = game.activityFeed.slice(-8).reverse();
  feedEl.innerHTML = (feed.length ? feed : ['Belum ada activity.']).map((item) => `<li>${item}</li>`).join('');

  renderCompanyFrames();
  renderRankingFrame();
  renderFrameVisibility();
}

function renderFrameVisibility() {
  frameMain.classList.toggle('frame-active', frame === 'main');
  frameFull.classList.toggle('frame-active', frame === 'full');
  frameRanking.classList.toggle('frame-active', frame === 'ranking');
  frameInvestment.classList.toggle('frame-active', frame === 'investment');
  frameSub.classList.toggle('frame-active', frame === 'sub');
}

function renderCompanyFrames() {
  const snapshots = getTopCompaniesSnapshot(game, getCompanyValuation, getSharePrice, 10);
  const slots = getDisplayCompanies(game);
  const slotMap = new Map(slots.map((item) => [item.key, item.slotId]));
  companyFrameList.innerHTML = snapshots
    .map((company) => `
      <button class="company-card-btn" data-company-card="${company.key}">
        <small>ID ${slotMap.get(company.key) ?? '-'}</small><br />
        <strong>${company.name}</strong><br />
        <span>Valuation ${formatMoneyCompact(company.valuation)}</span><br />
        <span>Share $${company.sharePrice.toFixed(2)} | MS ${company.marketShare.toFixed(1)}%</span>
      </button>
    `)
    .join('');

}

function renderRankingFrame() {
  const slots = getDisplayCompanies(game);
  const slotMap = new Map(slots.map((item) => [item.key, item.slotId]));

  if (rankingMode === 'companies') {
    const rows = getTopCompaniesSnapshot(game, getCompanyValuation, getSharePrice, 10);
    rankingList.innerHTML = rows
      .map((row, index) => `<li>#${index + 1} • ID ${slotMap.get(row.key) ?? '-'} • ${row.name} — Valuation ${formatMoneyCompact(row.valuation)} | Share $${row.sharePrice.toFixed(2)} | MS ${row.marketShare.toFixed(1)}%</li>`)
      .join('');
    return;
  }

  if (rankingMode === 'richest') {
    const investors = [
      { id: game.player.id, name: game.player.name },
      ...game.npcs.map((npc) => ({ id: npc.id, name: npc.name })),
    ]
      .map((investor) => {
        const holdings = getInvestorHoldingsValue(game, investor.id);
        const cash = investor.id === game.player.id ? game.player.cash : (game.npcs.find((npc) => npc.id === investor.id)?.cash ?? 0);
        return {
          ...investor,
          holdings,
          cash,
          total: holdings + cash,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
    rankingList.innerHTML = investors
      .map((row, index) => `<li>#${index + 1} • ${row.name} — Net Worth ${formatMoneyCompact(row.total)} (Cash ${formatMoneyCompact(row.cash)}, Holdings ${formatMoneyCompact(row.holdings)})</li>`)
      .join('');
    return;
  }

  const productRows = slots
    .map((slot) => {
      const company = slot.company;
      const score = (
        getCompanyValuation(company) * 0.25
        + company.marketShare * 20
        + company.reputation * 8
        + company.releaseCount * 40
        + company.researchPerDay * 30
      );
      return {
        slotId: slot.slotId,
        name: company.name,
        score,
        releaseCount: company.releaseCount,
        reputation: company.reputation,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  rankingList.innerHTML = productRows
    .map((row, index) => `<li>#${index + 1} • ID ${row.slotId} • ${row.name} — Product Score ${row.score.toFixed(1)} (release ${row.releaseCount}, reputation ${row.reputation.toFixed(1)})</li>`)
    .join('');
}

function renderCompanyDetail() {
  const key = selectedCompanyForDetail;
  const company = key ? game.companies[key] : null;
  const slot = getDisplayCompanies(game).find((item) => item.key === key);
  if (!company) {
    companyDetailTitle.textContent = 'Company Subfullframe';
    companyDetailBody.innerHTML = '<p>Company tidak ditemukan.</p>';
    return;
  }
  companyDetailTitle.textContent = `ID ${slot?.slotId ?? '-'} • ${company.name} • Subfullframe`;
  companyDetailBody.innerHTML = `
    <article class="detail-tile"><h3>Identity</h3><p>Key: ${company.key}</p><p>Founder: ${company.founder}</p><p>Field: ${company.field}</p></article>
    <article class="detail-tile"><h3>Financial</h3><p>Cash: ${formatMoneyCompact(company.cash)}</p><p>Valuation: ${formatMoneyCompact(getCompanyValuation(company))}</p><p>Share: $${getSharePrice(company).toFixed(2)}</p></article>
    <article class="detail-tile"><h3>Operation</h3><p>Research/day: ${company.researchPerDay.toFixed(2)}</p><p>Revenue/day: ${formatMoneyCompact(company.revenuePerDay)}</p><p>Market Share: ${company.marketShare.toFixed(1)}%</p></article>
    <article class="detail-tile"><h3>Game State</h3><p>Release Count: ${company.releaseCount}</p><p>Reputation: ${company.reputation.toFixed(1)}</p><p>Established: ${company.isEstablished ? 'Yes' : 'No'}</p></article>
  `;
}

function runTick(n = 1) {
  game = runTicksBatched(game, n, simulateTick);
  render();
}

function handleTrade(mode) {
  const key = selectedCompanyKey();
  const amount = selectedTradeAmount();
  const company = game.companies[key];
  if (!company) {
    setStatus('Company tidak ditemukan.', true);
    return;
  }

  const preview = getTradePreview(game, company, game.player.id, mode, amount, 'auto');
  if (!preview.canTransact) {
    setStatus(`Trade gagal: ${preview.reason ?? 'unknown'}`, true);
    return;
  }
  withGameAction(
    game,
    (state) => transactShares(state, state.player.id, key, mode, amount, 'auto'),
    (next) => {
      game = next;
      setStatus(`${mode === 'buy' ? 'Buy' : 'Sell'} ${key} berhasil. Gross ${formatMoneyCompact(preview.grossValue)}.`);
      render();
    },
    () => setStatus('Trade tidak mengubah state game.', true)
  );
}

function handleInvestCompanyPlan() {
  const key = selectedCompanyKey();
  const amount = Math.max(1, selectedTradeAmount());
  withGameAction(
    game,
    (state) => investInCompanyPlan(state, state.player.id, key, amount),
    (next) => {
      game = next;
      setStatus(`Invest company plan ${key} sebesar ${formatMoneyCompact(amount)}.`);
      render();
    },
    () => setStatus('Invest plan gagal (dana/validasi tidak memenuhi).', true)
  );
}

function handleLicenseRequest() {
  const companies = Object.values(game.companies);
  const gameCompany = companies.find((company) => company.isEstablished && company.field === 'game');
  const appStoreCompany = companies.find((company) => company.isEstablished && company.field === 'software' && company.softwareSpecialization === 'app-store');
  if (!gameCompany || !appStoreCompany) {
    setStatus('Belum ada pasangan company game + app-store yang valid.', true);
    return;
  }
  withGameAction(
    game,
    (state) => requestAppStoreLicense(
      state,
      state.player.id,
      gameCompany.key,
      appStoreCompany.key,
      'license request from standalone dreambusiness'
    ),
    (next) => {
      game = next;
      setStatus(`Request AppStore license: ${gameCompany.name} -> ${appStoreCompany.name}.`);
      render();
    },
    () => setStatus('License request ditolak oleh rule engine.', true)
  );
}

function handleCommunityPlanSeed() {
  const key = selectedCompanyKey();
  const amount = Math.max(6, selectedTradeAmount());
  const company = game.companies[key];
  if (!company) return;
  const planName = `${company.name} Labs`;
  const next = createCommunityCompanyPlan(game, game.player.id, planName, amount, company.field, company.softwareSpecialization ?? undefined);
  if (next === game) {
    setStatus('Gagal membuat community plan (cek dana/nama/slot aktif).', true);
    return;
  }
  game = next;
  const plan = game.communityPlans.find((entry) => entry.companyName === planName && entry.status === 'funding');
  if (plan) {
    game = investInCommunityPlan(game, game.player.id, plan.id, Math.max(1, amount / 2));
  }
  setStatus(`Community plan ${planName} dibuat dan didanai.`);
  render();
}

document.getElementById('tick1').addEventListener('click', () => runTick(1));
document.getElementById('tick25').addEventListener('click', () => runTick(25));
document.getElementById('buyBtn').addEventListener('click', () => handleTrade('buy'));
document.getElementById('sellBtn').addEventListener('click', () => handleTrade('sell'));
document.getElementById('investPlanBtn').addEventListener('click', handleInvestCompanyPlan);
document.getElementById('licenseBtn').addEventListener('click', handleLicenseRequest);
document.getElementById('communityBtn').addEventListener('click', handleCommunityPlanSeed);
toFullframeBtn.addEventListener('click', () => { frame = 'full'; renderFrameVisibility(); });
toInvestmentBtn.addEventListener('click', () => { frame = 'investment'; renderFrameVisibility(); });
toRankingBtn.addEventListener('click', () => { frame = 'ranking'; renderFrameVisibility(); });
backFromFullBtn.addEventListener('click', () => { frame = 'main'; renderFrameVisibility(); });
backFromRankingBtn.addEventListener('click', () => { frame = 'main'; renderFrameVisibility(); });
backFromInvestmentBtn.addEventListener('click', () => { frame = 'main'; renderFrameVisibility(); });
backFromSubBtn.addEventListener('click', () => { frame = 'full'; renderFrameVisibility(); });
rankingTopCompaniesBtn.addEventListener('click', () => { rankingMode = 'companies'; renderRankingFrame(); });
rankingRichestBtn.addEventListener('click', () => { rankingMode = 'richest'; renderRankingFrame(); });
rankingProductsBtn.addEventListener('click', () => { rankingMode = 'products'; renderRankingFrame(); });
companyFrameList.addEventListener('click', (event) => {
  const target = event.target.closest('[data-company-card]');
  if (!target) return;
  selectedCompanyForDetail = target.getAttribute('data-company-card');
  frame = 'sub';
  renderCompanyDetail();
  renderFrameVisibility();
});
document.getElementById('reset').addEventListener('click', () => {
  game = createInitialGameState(DEFAULT_PROFILE_DRAFT);
  auto = false;
  autoBtn.textContent = 'Start Auto';
  if (timer) clearInterval(timer);
  timer = null;
  companySelect.innerHTML = '';
  setStatus('Game di-reset.');
  frame = 'main';
  selectedCompanyForDetail = null;
  render();
});

autoBtn.addEventListener('click', () => {
  auto = !auto;
  autoBtn.textContent = auto ? 'Stop Auto' : 'Start Auto';
  if (auto) {
    timer = setInterval(() => runTick(1), 200);
  } else if (timer) {
    clearInterval(timer);
    timer = null;
  }
});

render();
