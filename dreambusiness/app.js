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
} from '/dreambusiness/dream-engine.bundle.js';

const statsEl = document.getElementById('stats');
const feedEl = document.getElementById('feed');
const autoBtn = document.getElementById('auto');
const companySelect = document.getElementById('companySelect');
const investSlider = document.getElementById('investSlider');
const sliderValueLabel = document.getElementById('sliderValueLabel');
const sharePercentPreview = document.getElementById('sharePercentPreview');
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
    noopMessage = 'Aksi tidak mengubah state game.',
    errorMessage = 'Terjadi error saat memproses aksi.',
  } = options;
  try {
    const next = action(game);
    if (next === game) {
      setStatus(noopMessage, true);
      return false;
    }
    if (!isValidGameState(next)) {
      setStatus(`${errorMessage} (state tidak valid)`, true);
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
  autoBtn.textContent = 'Start Auto';
  if (timer) clearInterval(timer);
  timer = null;
}

function selectedCompanyKey() {
  return companySelect.value || COMPANY_KEYS[0];
}

function selectedTradeAmount() {
  const raw = Number(investSlider.value);
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
  const sliderPercent = selectedTradeAmount() / 100;
  if (mode === 'buy') return context.investorCash * sliderPercent;
  return context.holdingValue * sliderPercent;
}

function updateSliderPreview() {
  const key = selectedCompanyKey();
  const company = game.companies[key];
  if (!company) return;
  const context = getPlayerContext(company);
  const sliderPercent = selectedTradeAmount();
  const requestedValue = getRequestedTradeValue('buy', context);
  const preview = getTradePreview(
    game,
    company,
    game.player.id,
    context.investorCash,
    context.currentShares,
    'buy',
    requestedValue,
    'auto'
  );
  sliderValueLabel.textContent = `Invest ${sliderPercent.toFixed(0)}% cash = ${formatMoneyCompact(requestedValue, 2)}`;
  sharePercentPreview.textContent = `Estimasi kepemilikan setelah buy: ${preview.futureOwnership.toFixed(2)}% (fee ${formatMoneyCompact(preview.feeValue, 2)})`;
}

function render() {
  const displayCompanies = getDisplayCompanies(game);
  if (!companySelect.options.length || companySelect.options.length !== displayCompanies.length) {
    companySelect.innerHTML = displayCompanies
      .map((item) => `<option value="${item.key}">${item.name}</option>`)
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

  updateSliderPreview();
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
  companyFrameList.innerHTML = snapshots
    .map((company) => `
      <button class="company-card-btn" data-company-card="${company.key}">
        <strong>${company.name}</strong><br />
        <span>Valuation ${formatMoneyCompact(company.valuation)}</span><br />
        <span>Share $${company.sharePrice.toFixed(2)} | MS ${company.marketShare.toFixed(1)}%</span>
      </button>
    `)
    .join('');

}

function renderRankingFrame() {
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
    const rows = buildTopCompanyRankingRows(game, getCompanyValuation, getSharePrice, 10);
    renderRankingCards(
      rows,
      (row) => `Valuation ${formatMoneyCompact(row.valuation)} • Share $${row.sharePrice.toFixed(2)} • MS ${row.marketShare.toFixed(1)}%`
    );
    return;
  }

  if (rankingMode === 'richest') {
    const investors = buildRichestPeopleRows(game, getInvestorHoldingsValue, 10);
    renderRankingCards(
      investors,
      (row) => `Net Worth ${formatMoneyCompact(row.total)} • Cash ${formatMoneyCompact(row.cash)} • Holdings ${formatMoneyCompact(row.holdings)}`
    );
    return;
  }

  const productRows = buildProductRankingRows(game, getCompanyValuation, 10);
  renderRankingCards(
    productRows,
    (row) => `Skor Produk ${row.score.toFixed(1)} • Perusahaan ${escapeHtml(row.companyName ?? '-')} • Release ${row.releaseCount} • Reputation ${row.reputation.toFixed(1)}`
  );
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
    <article class="detail-tile"><h3>Identity</h3><p>Founder: ${company.founder}</p><p>Field: ${company.field}</p></article>
    <article class="detail-tile"><h3>Financial</h3><p>Cash: ${formatMoneyCompact(company.cash)}</p><p>Valuation: ${formatMoneyCompact(getCompanyValuation(company))}</p><p>Share: $${getSharePrice(company).toFixed(2)}</p></article>
    <article class="detail-tile"><h3>Operation</h3><p>Research/day: ${company.researchPerDay.toFixed(2)}</p><p>Revenue/day: ${formatMoneyCompact(company.revenuePerDay)}</p><p>Market Share: ${company.marketShare.toFixed(1)}%</p></article>
    <article class="detail-tile"><h3>Game State</h3><p>Release Count: ${company.releaseCount}</p><p>Reputation: ${company.reputation.toFixed(1)}</p><p>Established: ${company.isEstablished ? 'Yes' : 'No'}</p></article>
  `;
}

function runTick(n = 1) {
  try {
    const next = runTicksBatched(game, n, simulateTick);
    if (!isValidGameState(next)) {
      stopAutoIfRunning();
      setStatus('Tick gagal: state game tidak valid setelah simulasi.', true);
      return;
    }
    game = next;
    render();
  } catch (error) {
    stopAutoIfRunning();
    const reason = error instanceof Error ? error.message : String(error);
    setStatus(`Tick gagal karena error engine: ${reason}`, true);
  }
}

function handleTrade(mode) {
  const key = selectedCompanyKey();
  const company = game.companies[key];
  if (!company) {
    setStatus('Company tidak ditemukan.', true);
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
    setStatus('Trade gagal: likuiditas atau dana tidak cukup.', true);
    return;
  }
  const changed = applyActionSafely(
    (state) => transactShares(state, state.player.id, key, mode, amount, 'auto'),
    {
      successMessage: `${mode === 'buy' ? 'Buy' : 'Sell'} ${key} berhasil. Gross ${formatMoneyCompact(preview.grossTradeValue)}.`,
      noopMessage: 'Trade tidak diproses: dana/likuiditas/aturan belum memenuhi.',
      errorMessage: 'Trade gagal diproses',
    }
  );
  if (changed) render();
}

function handleInvestCompanyPlan() {
  const key = selectedCompanyKey();
  const company = game.companies[key];
  if (!company) {
    setStatus('Company tidak ditemukan.', true);
    return;
  }
  const plan = game.plans[key];
  if (!plan) {
    setStatus(`Plan pendirian ${key} tidak tersedia.`, true);
    return;
  }
  if (plan.isEstablished) {
    setStatus(`Plan ${key} sudah selesai (company sudah established).`, true);
    return;
  }
  const context = getPlayerContext(company);
  const amount = Math.max(1, getRequestedTradeValue('buy', context));
  if (amount > context.investorCash) {
    setStatus('Invest plan gagal: kas player tidak cukup.', true);
    return;
  }
  const changed = applyActionSafely(
    (state) => investInCompanyPlan(state, state.player.id, key, amount),
    {
      successMessage: `Invest company plan ${key} sukses sebesar ${formatMoneyCompact(amount)}.`,
      noopMessage: 'Invest plan gagal: dana minimum/validasi plan tidak terpenuhi.',
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
    setStatus('Belum ada pasangan company game + app-store yang valid.', true);
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
      noopMessage: 'License request ditolak oleh rule engine.',
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
      noopMessage: 'Gagal membuat community plan (cek dana/nama/slot aktif).',
      errorMessage: 'Community plan error',
    }
  );
  if (!planCreated) {
    return;
  }
  const plan = game.communityPlans.find((entry) => entry.companyName === planName && entry.status === 'funding');
  if (!plan) {
    setStatus('Community plan berhasil dibuat, tetapi plan tidak ditemukan untuk investasi lanjutan.', true);
    render();
    return;
  }
  const seeded = applyActionSafely(
    (state) => investInCommunityPlan(state, state.player.id, plan.id, Math.max(1, amount / 2)),
    {
      successMessage: `Community plan ${planName} dibuat dan didanai.`,
      noopMessage: `Community plan ${planName} dibuat, namun top-up investasi tidak diproses.`,
      errorMessage: `Top-up community plan ${planName} error`,
    }
  );
  if (!seeded) {
    setStatus(`Community plan ${planName} dibuat, namun top-up investasi gagal.`, true);
  }
  render();
}

document.getElementById('tick1').addEventListener('click', () => runTick(1));
document.getElementById('tick25').addEventListener('click', () => runTick(25));
document.getElementById('buyBtn').addEventListener('click', () => handleTrade('buy'));
document.getElementById('sellBtn').addEventListener('click', () => handleTrade('sell'));
document.getElementById('investPlanBtn').addEventListener('click', handleInvestCompanyPlan);
document.getElementById('licenseBtn').addEventListener('click', handleLicenseRequest);
document.getElementById('communityBtn').addEventListener('click', handleCommunityPlanSeed);
investSlider.addEventListener('input', updateSliderPreview);
companySelect.addEventListener('change', updateSliderPreview);
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
