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
const companiesEl = document.getElementById('companies');
const feedEl = document.getElementById('feed');
const autoBtn = document.getElementById('auto');
const companySelect = document.getElementById('companySelect');
const tradeAmountInput = document.getElementById('tradeAmount');
const actionStatus = document.getElementById('actionStatus');
const frameMain = document.getElementById('frameMain');
const frameFull = document.getElementById('frameFull');
const frameSub = document.getElementById('frameSub');
const companyFrameList = document.getElementById('companyFrameList');
const companyDetailTitle = document.getElementById('companyDetailTitle');
const companyDetailBody = document.getElementById('companyDetailBody');
const toFullframeBtn = document.getElementById('toFullframe');
const backFromFullBtn = document.getElementById('backFromFull');
const backFromSubBtn = document.getElementById('backFromSub');

let game = createInitialGameState(DEFAULT_PROFILE_DRAFT);
let auto = false;
let timer = null;
let frame = 'main';
let selectedCompanyForDetail = null;

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

function summarizeTopCompanies(state) {
  return getTopCompaniesSnapshot(state, getCompanyValuation, getSharePrice, 6);
}

function render() {
  if (!companySelect.options.length) {
    companySelect.innerHTML = getCompanySelectOptions(game)
      .filter((item) => COMPANY_KEYS.includes(item.key))
      .map((item) => `<option value="${item.key}">${item.label}</option>`)
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

  const top = summarizeTopCompanies(game);
  companiesEl.innerHTML = top
    .map((c) => `<li><strong>${c.name}</strong> (${c.key}) · Valuation ${formatMoneyCompact(c.valuation)} · Share $${c.sharePrice.toFixed(2)} · MS ${c.marketShare.toFixed(1)}%</li>`)
    .join('');

  const feed = game.activityFeed.slice(-8).reverse();
  feedEl.innerHTML = (feed.length ? feed : ['Belum ada activity.']).map((item) => `<li>${item}</li>`).join('');

  renderCompanyFrames();
  renderFrameVisibility();
}

function renderFrameVisibility() {
  frameMain.classList.toggle('frame-active', frame === 'main');
  frameFull.classList.toggle('frame-active', frame === 'full');
  frameSub.classList.toggle('frame-active', frame === 'sub');
}

function renderCompanyFrames() {
  const snapshots = getTopCompaniesSnapshot(game, getCompanyValuation, getSharePrice, 20);
  companyFrameList.innerHTML = snapshots
    .map((company) => `
      <button class="company-card-btn" data-company-card="${company.key}">
        <strong>${company.name}</strong><br />
        <small>${company.key}</small><br />
        <span>Valuation ${formatMoneyCompact(company.valuation)}</span><br />
        <span>Share $${company.sharePrice.toFixed(2)} | MS ${company.marketShare.toFixed(1)}%</span>
      </button>
    `)
    .join('');

  companyFrameList.querySelectorAll('[data-company-card]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedCompanyForDetail = button.getAttribute('data-company-card');
      frame = 'sub';
      renderCompanyDetail();
      renderFrameVisibility();
    });
  });
}

function renderCompanyDetail() {
  const key = selectedCompanyForDetail;
  const company = key ? game.companies[key] : null;
  if (!company) {
    companyDetailTitle.textContent = 'Company Subfullframe';
    companyDetailBody.innerHTML = '<p>Company tidak ditemukan.</p>';
    return;
  }
  companyDetailTitle.textContent = `${company.name} • Subfullframe`;
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
backFromFullBtn.addEventListener('click', () => { frame = 'main'; renderFrameVisibility(); });
backFromSubBtn.addEventListener('click', () => { frame = 'full'; renderFrameVisibility(); });
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
