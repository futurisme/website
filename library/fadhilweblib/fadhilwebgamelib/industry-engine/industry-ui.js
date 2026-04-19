function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function projectCard(project) {
  return `
    <article class="industry-project" data-project-id="${esc(project.id)}">
      <header>
        <h3>${esc(project.title)}</h3>
        <span class="stage">${esc(project.stage)}</span>
      </header>
      <p>${esc(project.genre)} · Manga chapter ${project.chapters} · Studio ${esc(project.studioName)}</p>
      <div class="meta-grid">
        <small>Popularity: ${project.popularity.toFixed(1)}</small>
        <small>Script: ${project.scriptQuality.toFixed(1)}</small>
        <small>Committee: ${project.committeeIds.length}</small>
        <small>Budget: ${project.securedBudget.toLocaleString()} / ${project.budgetNeed.toLocaleString()}</small>
        <small>Progress: ${project.productionProgress.toFixed(1)}%</small>
      </div>
      <div class="actions">
        <button data-action="serialize" ${project.canSerialize ? '' : 'disabled'}>Serialize Chapter</button>
        <button data-action="pitch" ${project.canPitch ? '' : 'disabled'}>Pitch ke Studio</button>
        <button data-action="committee" ${project.canCommittee ? '' : 'disabled'}>Buat Komite</button>
        <button data-action="production" ${project.canProduction ? '' : 'disabled'}>Start Production</button>
        <button data-action="launch" ${project.canLaunch ? '' : 'disabled'}>Launch Anime</button>
      </div>
    </article>
  `;
}

export function createIndustryUiController({ root, handlers }) {
  const statsEl = root.querySelector('#industryStats');
  const projectsEl = root.querySelector('#industryProjects');
  const feedEl = root.querySelector('#industryFeed');
  const releasesEl = root.querySelector('#industryReleases');
  const autoBtn = root.querySelector('[data-action="toggle-auto"]');

  root.querySelector('[data-action="tick-1"]').addEventListener('click', () => handlers.onTick(1));
  root.querySelector('[data-action="tick-7"]').addEventListener('click', () => handlers.onTick(7));
  root.querySelector('[data-action="reset"]').addEventListener('click', handlers.onReset);
  root.querySelector('[data-action="brainstorm"]').addEventListener('click', handlers.onBrainstorm);
  autoBtn.addEventListener('click', handlers.onAutoToggle);

  projectsEl.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.getAttribute('data-action');
    if (!action) return;
    const projectCardEl = target.closest('[data-project-id]');
    if (!(projectCardEl instanceof HTMLElement)) return;
    const projectId = projectCardEl.getAttribute('data-project-id');
    if (!projectId) return;

    if (action === 'serialize') handlers.onSerialize(projectId);
    if (action === 'pitch') handlers.onPitch(projectId);
    if (action === 'committee') handlers.onCommittee(projectId);
    if (action === 'production') handlers.onProduction(projectId);
    if (action === 'launch') handlers.onLaunch(projectId);
  });

  let renderKey = '';

  return {
    render(snapshot) {
      const nextKey = `${snapshot.day}|${snapshot.cashLabel}|${snapshot.projects.length}|${snapshot.releases.length}|${snapshot.feed[0] ?? ''}`;
      if (nextKey === renderKey) return;
      renderKey = nextKey;

      statsEl.innerHTML = `
        <article class="industry-metric"><small>Hari</small><strong>${esc(snapshot.dayLabel)}</strong></article>
        <article class="industry-metric"><small>Cash</small><strong>${esc(snapshot.cashLabel)}</strong></article>
        <article class="industry-metric"><small>Reputation</small><strong>${snapshot.reputation}</strong></article>
        <article class="industry-metric"><small>Market Trend</small><strong>${snapshot.trend.toFixed(2)}</strong></article>
        <article class="industry-metric"><small>Audience Fatigue</small><strong>${snapshot.fatigue.toFixed(3)}</strong></article>
        <article class="industry-metric"><small>Last Action</small><strong>${esc(snapshot.debug.lastAction)}</strong></article>
      `;

      projectsEl.innerHTML = snapshot.projects.length
        ? snapshot.projects.map(projectCard).join('')
        : '<p class="empty">Belum ada project aktif. Tekan Brainstorm Project.</p>';

      releasesEl.innerHTML = snapshot.releases.length
        ? snapshot.releases.map((item) => `<li><strong>${esc(item.title)}</strong> · score ${item.score.toFixed(1)} · revenue ${item.revenue.toLocaleString()} · ${esc(item.studio)}</li>`).join('')
        : '<li>Belum ada anime yang tayang.</li>';

      feedEl.innerHTML = snapshot.feed.map((entry) => `<li>${esc(entry)}</li>`).join('');
    },
    setAutoState(isActive) {
      autoBtn.textContent = isActive ? 'Stop Auto' : 'Auto Simulate';
    },
  };
}
