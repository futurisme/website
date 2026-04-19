function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function createIndustryUiController({ root, handlers }) {
  const frames = {
    register: root.querySelector('#frameRegister'),
    main: root.querySelector('#frameMain'),
    fullProjects: root.querySelector('#frameFullProjects'),
    fullAdmin: root.querySelector('#frameFullAdmin'),
    fullFeed: root.querySelector('#frameFullFeed'),
    subProject: root.querySelector('#frameSubProject'),
  };

  const statsEl = root.querySelector('#industryStats');
  const projectsEl = root.querySelector('#industryProjects');
  const feedEl = root.querySelector('#industryFeed');
  const releasesEl = root.querySelector('#industryReleases');
  const ceoStatusEl = root.querySelector('#ceoStatus');
  const topDateEl = root.querySelector('#topDate');
  const subTitleEl = root.querySelector('#subProjectTitle');
  const subBodyEl = root.querySelector('#subProjectBody');
  const studioNameInput = root.querySelector('#studioNameInput');

  let selectedProjectId = null;

  function openFrame(key) {
    Object.values(frames).forEach((frame) => frame?.classList.remove('frame-active'));
    frames[key]?.classList.add('frame-active');
  }

  root.querySelector('[data-action="register"]').addEventListener('click', () => {
    const name = root.querySelector('#registerName').value;
    const profession = root.querySelector('#registerProfession').value;
    handlers.onRegister(name, profession);
  });

  root.querySelector('[data-action="tick-1"]').addEventListener('click', () => handlers.onTick(1));
  root.querySelector('[data-action="tick-7"]').addEventListener('click', () => handlers.onTick(7));
  root.querySelector('[data-action="brainstorm"]').addEventListener('click', handlers.onBrainstorm);
  root.querySelector('[data-action="toggle-auto"]').addEventListener('click', handlers.onAutoToggle);

  root.querySelector('[data-action="to-full-projects"]').addEventListener('click', () => openFrame('fullProjects'));
  root.querySelector('[data-action="to-full-admin"]').addEventListener('click', () => openFrame('fullAdmin'));
  root.querySelector('[data-action="to-full-feed"]').addEventListener('click', () => openFrame('fullFeed'));
  root.querySelectorAll('[data-action="back-main"]').forEach((button) => button.addEventListener('click', () => openFrame('main')));
  root.querySelector('[data-action="back-projects"]').addEventListener('click', () => openFrame('fullProjects'));

  root.querySelector('[data-action="seek-funding"]').addEventListener('click', handlers.onSeekFunding);
  root.querySelector('[data-action="improve-admin"]').addEventListener('click', handlers.onImproveAdmin);
  root.querySelector('[data-action="found-studio"]').addEventListener('click', () => handlers.onFoundStudio(studioNameInput.value));

  projectsEl.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.getAttribute('data-action');
    const card = target.closest('[data-project-id]');
    if (!(card instanceof HTMLElement)) return;
    const projectId = card.getAttribute('data-project-id');
    if (!projectId) return;

    selectedProjectId = projectId;
    if (action === 'open-sub') {
      handlers.onOpenProject(projectId);
      openFrame('subProject');
      return;
    }
    if (action === 'serialize') handlers.onSerialize(projectId);
    if (action === 'pitch') handlers.onPitch(projectId);
    if (action === 'committee') handlers.onCommittee(projectId);
    if (action === 'production') handlers.onProduction(projectId);
    if (action === 'launch') handlers.onLaunch(projectId);
  });

  return {
    render(snapshot) {
      if (!snapshot.registered) {
        openFrame('register');
        return;
      }

      topDateEl.textContent = snapshot.dayLabel;
      statsEl.innerHTML = `
        <article class="industry-metric"><small>Nama</small><strong>${esc(snapshot.player.name)}</strong></article>
        <article class="industry-metric"><small>Profesi awal</small><strong>${esc(snapshot.player.initialProfession)}</strong></article>
        <article class="industry-metric"><small>Career sekarang</small><strong>${esc(snapshot.player.career)}</strong></article>
        <article class="industry-metric"><small>Cash</small><strong>${esc(snapshot.cashLabel)}</strong></article>
        <article class="industry-metric"><small>Funding Pool</small><strong>${snapshot.player.fundingPool.toLocaleString()}</strong></article>
        <article class="industry-metric"><small>Admin Score</small><strong>${snapshot.player.adminScore}</strong></article>
      `;

      projectsEl.innerHTML = snapshot.projects.length
        ? snapshot.projects.map((project) => `
          <article class="industry-project" data-project-id="${esc(project.id)}">
            <h3>${esc(project.title)}</h3>
            <p>${esc(project.medium)} · stage: ${esc(project.stage)} · chapters: ${project.chapters}</p>
            <div class="actions">
              <button data-action="open-sub">Detail</button>
              <button data-action="serialize" ${project.canSerialize ? '' : 'disabled'}>Write</button>
              <button data-action="pitch" ${project.canPitch ? '' : 'disabled'}>Pitch</button>
              <button data-action="committee" ${project.canCommittee ? '' : 'disabled'}>Committee</button>
              <button data-action="production" ${project.canProduction ? '' : 'disabled'}>Production</button>
              <button data-action="launch" ${project.canLaunch ? '' : 'disabled'}>Launch</button>
            </div>
          </article>
        `).join('')
        : '<p class="empty">Tidak ada project aktif.</p>';

      ceoStatusEl.innerHTML = `
        <p>Syarat CEO Studio:</p>
        <ul>
          <li>Kekayaan ≥ ${snapshot.ceoRequirements.wealthNeed.toLocaleString()} (${snapshot.ceoRequirements.wealthOk ? '✅' : '❌'})</li>
          <li>Pendanaan ≥ ${snapshot.ceoRequirements.fundingNeed.toLocaleString()} (${snapshot.ceoRequirements.fundingOk ? '✅' : '❌'})</li>
          <li>Administrasi ≥ ${snapshot.ceoRequirements.adminNeed} (${snapshot.ceoRequirements.adminOk ? '✅' : '❌'})</li>
        </ul>
      `;

      feedEl.innerHTML = snapshot.feed.map((entry) => `<li>${esc(entry)}</li>`).join('');
      releasesEl.innerHTML = snapshot.releases.length
        ? snapshot.releases.map((item) => `<li>${esc(item.title)} · score ${item.score.toFixed(1)} · ${item.revenue.toLocaleString()}</li>`).join('')
        : '<li>Belum ada release.</li>';

      if (selectedProjectId) {
        const project = snapshot.projects.find((entry) => entry.id === selectedProjectId);
        if (project) {
          subTitleEl.textContent = project.title;
          subBodyEl.innerHTML = `
            <p>Medium: ${esc(project.medium)}</p>
            <p>Stage: ${esc(project.stage)}</p>
            <p>Popularity: ${project.popularity.toFixed(1)}</p>
            <p>Script Quality: ${project.scriptQuality.toFixed(1)}</p>
            <p>Budget: ${project.securedBudget.toLocaleString()} / ${project.budgetNeed.toLocaleString()}</p>
          `;
        }
      }

      if (!Object.values(frames).some((frame) => frame?.classList.contains('frame-active'))) {
        openFrame('main');
      }
    },
    setAutoState(active) {
      root.querySelector('[data-action="toggle-auto"]').textContent = active ? 'Stop Auto' : 'Auto';
    },
    openMain() {
      openFrame('main');
    },
  };
}
