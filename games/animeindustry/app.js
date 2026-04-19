import {
  DEFAULT_PROFILE_DRAFT,
  createInitialGameState,
  formatDateFromDays,
  formatMoneyCompact,
  runTicksBatched,
  simulateTick,
  buildTopCompanyRankingRows,
} from '/games/animeindustry/anime-engine.bundle.js';

const statsEl = document.getElementById('stats');
const topCompaniesEl = document.getElementById('topCompanies');
const feedEl = document.getElementById('feed');
const autoBtn = document.getElementById('auto');

let game = createInitialGameState({
  ...DEFAULT_PROFILE_DRAFT,
  name: 'Anime Industry Founder',
  background: 'Membangun studio anime lintas genre dan ekosistem distribusi global.',
});
let timer = null;

function render() {
  statsEl.innerHTML = [
    ['Hari', formatDateFromDays(game.elapsedDays)],
    ['Kas Pemain', formatMoneyCompact(game.player.cash)],
    ['Total Tick', game.tickCount],
    ['Event Log', game.activityFeed.length],
  ]
    .map(([label, value]) => `<article class="card"><strong>${label}</strong><div>${value}</div></article>`)
    .join('');

  const ranking = buildTopCompanyRankingRows(game).slice(0, 6);
  topCompaniesEl.innerHTML = ranking
    .map((row) => `<li><strong>${row.rank}. ${row.name}</strong> — ${row.value}</li>`)
    .join('');

  feedEl.innerHTML = [...game.activityFeed].slice(-7).reverse().map((entry) => `<li>${entry}</li>`).join('');
}

function doTick(count) {
  game = count === 1 ? simulateTick(game) : runTicksBatched(game, count);
  render();
}

document.getElementById('tick1').addEventListener('click', () => doTick(1));
document.getElementById('tick25').addEventListener('click', () => doTick(25));
document.getElementById('reset').addEventListener('click', () => {
  game = createInitialGameState(DEFAULT_PROFILE_DRAFT);
  render();
});

autoBtn.addEventListener('click', () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
    autoBtn.textContent = 'Auto';
    return;
  }
  timer = setInterval(() => doTick(1), 360);
  autoBtn.textContent = 'Stop Auto';
});

render();
