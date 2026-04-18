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
  simulateTick,
  transactShares,
} from '/dreambusiness/dream-engine.bundle.js';

const statsEl = document.getElementById('stats');
const companiesEl = document.getElementById('companies');
const feedEl = document.getElementById('feed');
const autoBtn = document.getElementById('auto');
const companySelect = document.getElementById('companySelect');
const tradeAmountInput = document.getElementById('tradeAmount');
const actionStatus = document.getElementById('actionStatus');

let game = createInitialGameState(DEFAULT_PROFILE_DRAFT);
let auto = false;
let timer = null;

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
  return Object.values(state.companies)
    .map((company) => ({
      key: company.key,
      name: company.name,
      valuation: getCompanyValuation(company),
      sharePrice: getSharePrice(company),
      marketShare: company.marketShare,
    }))
    .sort((a, b) => b.valuation - a.valuation)
    .slice(0, 6);
}

function render() {
  if (!companySelect.options.length) {
    companySelect.innerHTML = COMPANY_KEYS
      .filter((key) => game.companies[key])
      .map((key) => `<option value="${key}">${game.companies[key].name} (${key})</option>`)
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
}

function runTick(n = 1) {
  for (let i = 0; i < n; i += 1) game = simulateTick(game);
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
  game = transactShares(game, game.player.id, key, mode, amount, 'auto');
  setStatus(`${mode === 'buy' ? 'Buy' : 'Sell'} ${key} berhasil. Gross ${formatMoneyCompact(preview.grossValue)}.`);
  render();
}

function handleInvestCompanyPlan() {
  const key = selectedCompanyKey();
  const amount = Math.max(1, selectedTradeAmount());
  game = investInCompanyPlan(game, game.player.id, key, amount);
  setStatus(`Invest company plan ${key} sebesar ${formatMoneyCompact(amount)}.`);
  render();
}

function handleLicenseRequest() {
  const companies = Object.values(game.companies);
  const gameCompany = companies.find((company) => company.isEstablished && company.field === 'game');
  const appStoreCompany = companies.find((company) => company.isEstablished && company.field === 'software' && company.softwareSpecialization === 'app-store');
  if (!gameCompany || !appStoreCompany) {
    setStatus('Belum ada pasangan company game + app-store yang valid.', true);
    return;
  }
  game = requestAppStoreLicense(
    game,
    game.player.id,
    gameCompany.key,
    appStoreCompany.key,
    'license request from standalone dreambusiness'
  );
  setStatus(`Request AppStore license: ${gameCompany.name} -> ${appStoreCompany.name}.`);
  render();
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
document.getElementById('reset').addEventListener('click', () => {
  game = createInitialGameState(DEFAULT_PROFILE_DRAFT);
  auto = false;
  autoBtn.textContent = 'Start Auto';
  if (timer) clearInterval(timer);
  timer = null;
  companySelect.innerHTML = '';
  setStatus('Game di-reset.');
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
