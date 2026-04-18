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
const newsTimeline = document.getElementById('newsTimeline');
const companyFrameList = document.getElementById('companyFrameList');
const companyDetailTitle = document.getElementById('companyDetailTitle');
const companyDetailBody = document.getElementById('companyDetailBody');
const toFullframeBtn = document.getElementById('toFullframe');
const toInvestmentBtn = document.getElementById('toInvestment');
const toRankingBtn = document.getElementById('toRanking');
const toNewsBtn = document.getElementById('toNews');
const backFromFullBtn = document.getElementById('backFromFull');
const backFromRankingBtn = document.getElementById('backFromRanking');
const backFromInvestmentBtn = document.getElementById('backFromInvestment');
const backFromNewsBtn = document.getElementById('backFromNews');
const backFromSubBtn = document.getElementById('backFromSub');
const rankingList = document.getElementById('rankingList');
const rankingTopCompaniesBtn = document.getElementById('rankingTopCompanies');
const rankingRichestBtn = document.getElementById('rankingRichest');
const rankingProductsBtn = document.getElementById('rankingProducts');
const buyBtn = document.getElementById('buyBtn');
const sellBtn = document.getElementById('sellBtn');
const investPlanBtn = document.getElementById('investPlanBtn');
const licenseBtn = document.getElementById('licenseBtn');
const communityBtn = document.getElementById('communityBtn');

let game = createInitialGameState(DEFAULT_PROFILE_DRAFT);
let auto = false;
let timer = null;
let frame = 'main';
let selectedCompanyForDetail = null;
let rankingMode = 'companies';
let previousSharePrices = {};
let sliderMode = 'invest';
const sliderPercentByMode = { invest: 25, sell: 25 };

function isPlanOpenFunding(plan) {
  if (!plan || plan.isEstablished) return false;
  const planStatus = String(plan.status ?? '').toLowerCase();
  return planStatus === '' || planStatus === 'funding' || planStatus === 'open' || planStatus === 'active';
}

function isCompanyVisibleInUi(companyKey) {
  const company = game.companies[companyKey];
  if (!company) return false;
  if (company.isEstablished) return true;
  return isPlanOpenFunding(game.plans[companyKey]);
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
  autoBtn.textContent = 'Start Auto';
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
  const investorWeekly = getInvestorWeeklyIncomeEstimate(game, game.player.id);
  statsEl.innerHTML = `
    <article><h2>Simulation Day</h2><strong>${game.elapsedDays}</strong><small>${formatDateFromDays(game.elapsedDays)}</small></article>
    <article><h2>Cash Player</h2><strong>${formatMoneyCompact(game.player.cash)}</strong><small>${game.player.name}</small></article>
    <article><h2>Total Holdings</h2><strong>${formatMoneyCompact(investorWorth)}</strong><small>ownership value</small></article>
    <article><h2>Weekly Income</h2><strong>${formatMoneyCompact(investorWeekly)}</strong><small>weekly estimate</small></article>
  `;

  updateSliderPreview();
  renderCompanyFrames();
  renderRankingFrame();
  renderNewsFrame();
  updateInvestmentActionState();
  renderFrameVisibility();
}

function renderFrameVisibility() {
  frameMain.classList.toggle('frame-active', frame === 'main');
  frameFull.classList.toggle('frame-active', frame === 'full');
  frameRanking.classList.toggle('frame-active', frame === 'ranking');
  frameInvestment.classList.toggle('frame-active', frame === 'investment');
  frameNews.classList.toggle('frame-active', frame === 'news');
  frameSub.classList.toggle('frame-active', frame === 'sub');
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
    const rows = buildTopCompanyRankingRows(game, getCompanyValuation, getSharePrice, 24)
      .filter((row) => isCompanyVisibleInUi(row.key))
      .slice(0, 12)
      .map((row, index) => ({ ...row, rank: index + 1 }));
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
    (row) => `Product Score ${row.score.toFixed(1)} • Company ${escapeHtml(row.companyName ?? '-')} • Release ${row.releaseCount} • Reputation ${row.reputation.toFixed(1)}`
  );
}

function renderCompanyDetail() {
  const key = selectedCompanyForDetail;
  const company = key ? game.companies[key] : null;
  if (!company) {
    companyDetailTitle.textContent = 'Company Subfullframe';
    companyDetailBody.innerHTML = '<p>Company not found.</p>';
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
      setStatus('Tick failed: simulation produced an invalid game state.', true);
      return;
    }
    game = next;
    render();
  } catch (error) {
    stopAutoIfRunning();
    const reason = error instanceof Error ? error.message : String(error);
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

document.getElementById('tick1').addEventListener('click', () => runTick(1));
document.getElementById('tick25').addEventListener('click', () => runTick(25));
buyBtn.addEventListener('click', () => handleTrade('buy'));
sellBtn.addEventListener('click', () => handleTrade('sell'));
investPlanBtn.addEventListener('click', handleInvestCompanyPlan);
licenseBtn.addEventListener('click', handleLicenseRequest);
communityBtn.addEventListener('click', handleCommunityPlanSeed);
sliderModeInvestBtn.addEventListener('click', () => {
  sliderMode = 'invest';
  updateSliderPreview();
});
sliderModeSellBtn.addEventListener('click', () => {
  sliderMode = 'sell';
  updateSliderPreview();
});
investSlider.addEventListener('input', () => {
  const raw = Number(investSlider.value);
  sliderPercentByMode[sliderMode] = Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 0;
  updateSliderPreview();
});
companySelect.addEventListener('change', updateSliderPreview);
toFullframeBtn.addEventListener('click', () => { frame = 'full'; renderFrameVisibility(); });
toInvestmentBtn.addEventListener('click', () => { frame = 'investment'; renderFrameVisibility(); });
toRankingBtn.addEventListener('click', () => { frame = 'ranking'; renderFrameVisibility(); });
toNewsBtn.addEventListener('click', () => { frame = 'news'; renderFrameVisibility(); });
backFromFullBtn.addEventListener('click', () => { frame = 'main'; renderFrameVisibility(); });
backFromRankingBtn.addEventListener('click', () => { frame = 'main'; renderFrameVisibility(); });
backFromInvestmentBtn.addEventListener('click', () => { frame = 'main'; renderFrameVisibility(); });
backFromNewsBtn.addEventListener('click', () => { frame = 'main'; renderFrameVisibility(); });
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
  previousSharePrices = {};
  sliderMode = 'invest';
  sliderPercentByMode.invest = 25;
  sliderPercentByMode.sell = 25;
  setStatus('Game has been reset.');
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
