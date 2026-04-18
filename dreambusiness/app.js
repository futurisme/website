import {
  DEFAULT_PROFILE_DRAFT,
  createInitialGameState,
  formatDateFromDays,
  formatMoneyCompact,
  getCompanyValuation,
  getSharePrice,
  simulateTick,
} from '/dreambusiness/dream-engine.bundle.js';

const statsEl = document.getElementById('stats');
const companiesEl = document.getElementById('companies');
const feedEl = document.getElementById('feed');
const autoBtn = document.getElementById('auto');

let game = createInitialGameState(DEFAULT_PROFILE_DRAFT);
let auto = false;
let timer = null;

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
  statsEl.innerHTML = `
    <article><h2>Hari Simulasi</h2><strong>${game.elapsedDays}</strong><small>${formatDateFromDays(game.elapsedDays)}</small></article>
    <article><h2>Cash Player</h2><strong>${formatMoneyCompact(game.player.cash)}</strong><small>${game.player.name}</small></article>
    <article><h2>Jumlah NPC</h2><strong>${game.npcs.length}</strong><small>investor aktif</small></article>
    <article><h2>Lisensi App</h2><strong>${game.appStoreLicenseRequests.length}</strong><small>request total</small></article>
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

document.getElementById('tick1').addEventListener('click', () => runTick(1));
document.getElementById('tick25').addEventListener('click', () => runTick(25));
document.getElementById('reset').addEventListener('click', () => {
  game = createInitialGameState(DEFAULT_PROFILE_DRAFT);
  auto = false;
  autoBtn.textContent = 'Start Auto';
  if (timer) clearInterval(timer);
  timer = null;
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
