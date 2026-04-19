function metricCard(label, value) {
  return `<article class="industry-metric"><small>${label}</small><strong>${value}</strong></article>`;
}

export function createIndustryUiController({ root, onTick, onReset, onAutoToggle }) {
  const statsEl = root.querySelector('#industryStats');
  const topCompaniesEl = root.querySelector('#industryTopCompanies');
  const feedEl = root.querySelector('#industryFeed');
  const autoButton = root.querySelector('[data-action="auto"]');

  root.querySelector('[data-action="tick-1"]').addEventListener('click', () => onTick(1));
  root.querySelector('[data-action="tick-25"]').addEventListener('click', () => onTick(25));
  root.querySelector('[data-action="reset"]').addEventListener('click', onReset);
  autoButton.addEventListener('click', onAutoToggle);

  let lastRenderKey = '';

  return {
    render(snapshot) {
      const nextKey = `${snapshot.dayLabel}|${snapshot.tickCount}|${snapshot.playerCashLabel}|${snapshot.feed[0] ?? ''}`;
      if (nextKey === lastRenderKey) return;
      lastRenderKey = nextKey;

      statsEl.innerHTML = [
        metricCard('Hari', snapshot.dayLabel),
        metricCard('Kas Pemain', snapshot.playerCashLabel),
        metricCard('Total Tick', snapshot.tickCount),
        metricCard('Industry Pulse', snapshot.industryPulse.toFixed(2)),
      ].join('');

      topCompaniesEl.innerHTML = snapshot.topCompanies
        .map((row) => `<li><strong>${row.rank}. ${row.name}</strong><span>${row.value}</span></li>`)
        .join('');

      feedEl.innerHTML = snapshot.feed
        .map((entry) => `<li>${entry}</li>`)
        .join('');
    },
    setAutoState(active) {
      autoButton.textContent = active ? 'Stop Auto' : 'Auto';
    },
  };
}
