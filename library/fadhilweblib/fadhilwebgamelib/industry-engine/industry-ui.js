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
    fullProfile: root.querySelector('#frameFullProfile'),
    fullProjects: root.querySelector('#frameFullProjects'),
    fullStudios: root.querySelector('#frameFullStudios'),
    fullEmail: root.querySelector('#frameFullEmail'),
    fullCommittee: root.querySelector('#frameFullCommittee'),
    fullAdmin: root.querySelector('#frameFullAdmin'),
    fullFeed: root.querySelector('#frameFullFeed'),
    subProject: root.querySelector('#frameSubProject'),
  };

  const statsEl = root.querySelector('#industryStats');
  const profileEl = root.querySelector('#industryProfile');
  const projectsEl = root.querySelector('#industryProjects');
  const studiosEl = root.querySelector('#industryStudios');
  const inboxEl = root.querySelector('#industryInbox');
  const committeeBodyEl = root.querySelector('#committeeBody');
  const feedEl = root.querySelector('#industryFeed');
  const releasesEl = root.querySelector('#industryReleases');
  const ceoStatusEl = root.querySelector('#ceoStatus');
  const topDateEl = root.querySelector('#topDate');
  const subTitleEl = root.querySelector('#subProjectTitle');
  const subBodyEl = root.querySelector('#subProjectBody');
  const studioNameInput = root.querySelector('#studioNameInput');

  let selectedProjectId = null;
  let currentSnapshot = null;

  function canOpenFrame(frameKey) {
    if (!currentSnapshot?.visualAccess) return true;
    return currentSnapshot.visualAccess[frameKey] !== false;
  }

  function openFrame(key) {
    if (!canOpenFrame(key)) return;
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

  root.querySelector('[data-action="to-full-profile"]').addEventListener('click', () => openFrame('fullProfile'));
  root.querySelector('[data-action="to-full-projects"]').addEventListener('click', () => openFrame('fullProjects'));
  root.querySelector('[data-action="to-full-studios"]').addEventListener('click', () => openFrame('fullStudios'));
  root.querySelector('[data-action="to-full-email"]').addEventListener('click', () => openFrame('fullEmail'));
  root.querySelector('[data-action="to-full-admin"]').addEventListener('click', () => openFrame('fullAdmin'));
  root.querySelector('[data-action="to-full-feed"]').addEventListener('click', () => openFrame('fullFeed'));
  root.querySelectorAll('[data-action="back-main"]').forEach((button) => button.addEventListener('click', () => openFrame('main')));
  root.querySelectorAll('[data-action="back-projects"]').forEach((button) => button.addEventListener('click', () => openFrame('fullProjects')));

  root.querySelector('[data-action="seek-funding"]').addEventListener('click', handlers.onSeekFunding);
  root.querySelector('[data-action="improve-admin"]').addEventListener('click', handlers.onImproveAdmin);
  root.querySelector('[data-action="open-studio-planning"]').addEventListener('click', handlers.onOpenStudioPlanning);
  root.querySelector('[data-action="found-studio"]').addEventListener('click', () => handlers.onFoundStudio(studioNameInput.value));
  root.querySelector('[data-action="committee-discuss"]').addEventListener('click', () => {
    if (selectedProjectId) handlers.onCommitteeDiscuss(selectedProjectId);
  });
  root.querySelector('[data-action="committee-confirm"]').addEventListener('click', () => {
    if (selectedProjectId) handlers.onCommittee(selectedProjectId);
  });

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
    if (action === 'committee') {
      openFrame('fullCommittee');
      return;
    }
    if (action === 'production') handlers.onProduction(projectId);
    if (action === 'launch') handlers.onLaunch(projectId);
  });

  committeeBodyEl.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.getAttribute('data-action');
    if (action !== 'select-studio') return;
    const studioId = target.getAttribute('data-studio-id');
    if (!selectedProjectId || !studioId) return;
    handlers.onSelectStudio(selectedProjectId, studioId);
  });

  inboxEl.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.getAttribute('data-action');
    if (action !== 'read-email') return;
    const emailId = target.getAttribute('data-email-id');
    if (!emailId) return;
    handlers.onReadEmail(emailId);
  });

  return {
    render(snapshot) {
      currentSnapshot = snapshot;

      if (!snapshot.registered) {
        openFrame('register');
        return;
      }

      topDateEl.textContent = snapshot.dayLabel;
      statsEl.innerHTML = `
        <article class="industry-metric"><small>Cash</small><strong>${esc(snapshot.cashLabel)}</strong></article>
        <article class="industry-metric"><small>Funding Pool</small><strong>${snapshot.player.fundingPool.toLocaleString()}</strong></article>
        <article class="industry-metric"><small>Admin Score</small><strong>${snapshot.player.adminScore}</strong></article>
        <article class="industry-metric"><small>Market Trend</small><strong>${snapshot.trend.toFixed(2)}</strong></article>
      `;

      profileEl.innerHTML = `
        <article class="industry-metric"><small>Nama</small><strong>${esc(snapshot.player.name)}</strong></article>
        <article class="industry-metric"><small>Profesi saat ini</small><strong>${esc(snapshot.player.currentProfession)}</strong></article>
        <article class="industry-metric"><small>Reputasi</small><strong>${snapshot.reputation}</strong></article>
        <article class="industry-metric"><small>Studio Aktif</small><strong>${esc(snapshot.player.studioName)}</strong></article>
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

      studiosEl.innerHTML = snapshot.studios.map((studio) => `
        <article class="industry-project">
          <h3>${esc(studio.name)}</h3>
          <p>CEO: ${esc(studio.ceoName)} · Craft ${studio.craft.toFixed(0)} · Speed ${studio.speed.toFixed(0)} · Network ${studio.network.toFixed(0)} · Equity P/I: ${(studio.equity?.player ?? 0)}%/${(studio.equity?.investor ?? 0)}%</p>
        </article>
      `).join('') + `
        <article class="industry-project">
          <h3>NPC Roster</h3>
          <p>${snapshot.npcs.map((npc) => `${esc(npc.name)} (${esc(npc.role)})`).join(' · ')}</p>
        </article>
        <article class="industry-project">
          <h3>NPC Adaptation Pipeline</h3>
          <p>${snapshot.npcProjects?.length
            ? snapshot.npcProjects.map((entry) => `${esc(entry.title)} [${esc(entry.stage)}]`).join(' · ')
            : 'Belum ada project NPC aktif.'}</p>
        </article>
      `;

      inboxEl.innerHTML = snapshot.unreadEmails?.length
        ? snapshot.unreadEmails.map((email) => `
          <article class="industry-project">
            <h3>${esc(email.subject)}</h3>
            <p>${esc(email.body)}</p>
            <button data-action="read-email" data-email-id="${esc(email.id)}">Tandai Read</button>
          </article>
        `).join('')
        : '<p class="empty">Tidak ada email unread.</p>';

      const committeeProject = snapshot.projects.find((entry) => entry.id === selectedProjectId);
      if (committeeProject) {
        committeeBodyEl.innerHTML = `
          <article class="industry-project">
            <h3>${esc(committeeProject.title)}</h3>
            <p>Studio dipilih: ${esc(committeeProject.studioName)}</p>
            <p>Draft Bagi Hasil (Creator/Studio/Investor): ${committeeProject.contractDraft.creatorShare}% / ${committeeProject.contractDraft.studioShare}% / ${committeeProject.contractDraft.investorShare}%</p>
            <p>Komite approval: ${committeeProject.committeeApproved ? '✅ Ready' : '⏳ Diskusi berjalan'}</p>
            <div class="actions">
              ${(committeeProject.interestedStudios || []).map((studio) => `<button data-action="select-studio" data-studio-id="${esc(studio.id)}">Pilih ${esc(studio.name)}</button>`).join('')}
            </div>
            <ul class="industry-feed">${(committeeProject.committeeNegotiationLog || []).map((line) => `<li>${esc(line)}</li>`).join('')}</ul>
          </article>
        `;
      } else {
        committeeBodyEl.innerHTML = '<p>Pilih project dari frame Projects lalu masuk ke Production Committee.</p>';
      }

      ceoStatusEl.innerHTML = `
        <p>Syarat CEO Studio:</p>
        <ul>
          <li>Kekayaan ≥ ${snapshot.ceoRequirements.wealthNeed.toLocaleString()} (${snapshot.ceoRequirements.wealthOk ? '✅' : '❌'})</li>
          <li>Pendanaan ≥ ${snapshot.ceoRequirements.fundingNeed.toLocaleString()} (${snapshot.ceoRequirements.fundingOk ? '✅' : '❌'})</li>
          <li>Administrasi ≥ ${snapshot.ceoRequirements.adminNeed} (${snapshot.ceoRequirements.adminOk ? '✅' : '❌'})</li>
          <li>Perencanaan Studio Dibuka: ${snapshot.player.studioPlanningOpen ? '✅' : '❌'}</li>
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

      root.querySelectorAll('[data-frame-target]').forEach((button) => {
        const target = button.getAttribute('data-frame-target');
        if (!target) return;
        button.disabled = !canOpenFrame(target);
      });

      if (!Object.values(frames).some((frame) => frame?.classList.contains('frame-active'))) openFrame('main');
    },
    setAutoState(active) {
      root.querySelector('[data-action="toggle-auto"]').textContent = active ? 'Stop Auto' : 'Auto';
    },
    openMain() {
      openFrame('main');
    },
  };
}
