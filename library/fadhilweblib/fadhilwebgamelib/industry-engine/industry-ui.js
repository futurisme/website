function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getNpcRoleLabel(role) {
  const normalized = String(role || '').toLowerCase();
  if (normalized === 'ceo-studio' || normalized === 'ceo studio') return 'CEO';
  if (normalized === 'mangaka') return 'Mangaka (Manga)';
  if (normalized === 'novelis' || normalized === 'novelist') return 'Novelis (Novel)';
  if (normalized === 'investor') return 'Investor';
  if (normalized === 'animator') return 'Animator';
  return role || 'NPC';
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
    fullFoundStudio: root.querySelector('#frameFullFoundStudio'),
    fullRanking: root.querySelector('#frameFullRanking'),
    fullManagement: root.querySelector('#frameFullManagement'),
    fullSettings: root.querySelector('#frameFullSettings'),
    fullFeed: root.querySelector('#frameFullFeed'),
    subProject: root.querySelector('#frameSubProject'),
  };

  const statsEl = root.querySelector('#industryStats');
  const profileEl = root.querySelector('#industryProfile');
  const projectsEl = root.querySelector('#industryProjects');
  const studiosEl = root.querySelector('#industryStudios');
  const inboxEl = root.querySelector('#industryInbox');
  const rankingEl = root.querySelector('#rankingBoard');
  const managementEl = root.querySelector('#managementBoard');
  const committeeBodyEl = root.querySelector('#committeeBody');
  const feedEl = root.querySelector('#industryFeed');
  const releasesEl = root.querySelector('#industryReleases');
  const ceoStatusEl = root.querySelector('#ceoStatus');
  const topDateEl = root.querySelector('#topDate');
  const subTitleEl = root.querySelector('#subProjectTitle');
  const subBodyEl = root.querySelector('#subProjectBody');
  const studioNameInput = root.querySelector('#studioNameInput');
  const savePayloadInput = root.querySelector('#savePayloadInput');
  const registerSaveInput = root.querySelector('#registerSaveInput');

  let selectedProjectId = null;
  let currentSnapshot = null;
  let selectedOwnership = 'personal';
  let selectedRanking = 'studio';
  let popupTimer = null;

  function showPopup(message, tone = 'error') {
    let popup = root.querySelector('#industryInlinePopup');
    if (!popup) {
      popup = document.createElement('div');
      popup.id = 'industryInlinePopup';
      popup.className = 'industry-popup';
      root.appendChild(popup);
    }
    popup.textContent = message;
    popup.setAttribute('data-tone', tone);
    popup.classList.add('popup-show');
    if (popupTimer) clearTimeout(popupTimer);
    popupTimer = setTimeout(() => popup.classList.remove('popup-show'), 2200);
  }

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
  root.querySelector('[data-action="to-full-found-studio"]').addEventListener('click', () => openFrame('fullFoundStudio'));
  root.querySelector('[data-action="to-full-ranking"]').addEventListener('click', () => openFrame('fullRanking'));
  root.querySelector('[data-action="to-full-management"]').addEventListener('click', () => openFrame('fullManagement'));
  root.querySelector('[data-action="to-full-feed"]').addEventListener('click', () => openFrame('fullFeed'));
  document.querySelector('[data-action="to-full-settings"]')?.addEventListener('click', () => openFrame('fullSettings'));
  root.querySelectorAll('[data-action="back-main"]').forEach((button) => button.addEventListener('click', () => openFrame('main')));
  root.querySelectorAll('[data-action="back-projects"]').forEach((button) => button.addEventListener('click', () => openFrame('fullProjects')));

  root.querySelector('[data-action="seek-funding"]')?.addEventListener('click', () => {
    const ok = handlers.onSeekFunding();
    if (!ok) showPopup('Gagal melakukan pendanaan.', 'error');
  });
  root.querySelector('[data-action="improve-admin"]')?.addEventListener('click', handlers.onImproveAdmin);
  root.querySelector('[data-action="open-studio-planning"]')?.addEventListener('click', () => {
    const ok = handlers.onOpenStudioPlanning();
    if (!ok) showPopup('Gagal membuka perencanaan studio.', 'error');
  });
  root.querySelector('[data-action="found-studio"]')?.addEventListener('click', () => {
    const ok = handlers.onFoundStudio(studioNameInput.value);
    if (ok) {
      showPopup('Studio berhasil didirikan.', 'success');
      openFrame('main');
    } else {
      showPopup('Gagal mendirikan studio.', 'error');
    }
  });
  root.querySelector('[data-action="committee-discuss"]').addEventListener('click', () => {
    if (selectedProjectId) handlers.onCommitteeDiscuss(selectedProjectId);
  });
  root.querySelector('[data-action="committee-confirm"]').addEventListener('click', () => {
    if (selectedProjectId) handlers.onCommittee(selectedProjectId);
  });
  root.querySelector('[data-action="management-merger"]')?.addEventListener('click', () => {
    const ok = handlers.onManagementMerger();
    if (ok) {
      showPopup('Merger berhasil disetujui.', 'success');
      openFrame('main');
    } else {
      showPopup('Gagal: proposal merger ditolak.', 'error');
    }
  });
  root.querySelector('[data-action="management-cofund"]')?.addEventListener('click', () => {
    const ok = handlers.onManagementCoFund();
    if (ok) {
      showPopup('Co-funding studio baru berhasil.', 'success');
      openFrame('main');
    } else {
      showPopup('Gagal: co-funding belum memenuhi syarat.', 'error');
    }
  });
  root.querySelector('[data-action="export-save"]')?.addEventListener('click', () => {
    const payload = handlers.onExportSave?.() ?? '';
    if (savePayloadInput) savePayloadInput.value = payload;
    showPopup('Save berhasil digenerate.', 'success');
  });
  root.querySelector('[data-action="download-save"]')?.addEventListener('click', () => {
    const payload = savePayloadInput?.value?.trim();
    if (!payload) {
      showPopup('Generate save dulu sebelum download.', 'error');
      return;
    }
    const blob = new Blob([payload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `animeindustry-save-day-${currentSnapshot?.day ?? 0}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showPopup('Save berhasil diunduh.', 'success');
  });
  root.querySelector('[data-action="load-save"]')?.addEventListener('click', () => {
    const payload = savePayloadInput?.value ?? '';
    const ok = handlers.onImportSave?.(payload);
    if (ok) {
      showPopup('Save berhasil di-load.', 'success');
      openFrame('main');
    } else {
      showPopup('Gagal load save. Periksa format AI26.', 'error');
    }
  });
  root.querySelector('[data-action="load-save-register"]')?.addEventListener('click', () => {
    const payload = registerSaveInput?.value ?? '';
    const ok = handlers.onImportSave?.(payload);
    if (ok) {
      showPopup('Save berhasil di-load dari register.', 'success');
      openFrame('main');
    } else {
      showPopup('Gagal load save dari register.', 'error');
    }
  });

  projectsEl.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.matches('[data-ownership-switch]')) {
      selectedOwnership = target.getAttribute('data-ownership-switch') === 'studio' ? 'studio' : 'personal';
      if (currentSnapshot) {
        renderProjectsBoard(currentSnapshot);
      }
      return;
    }
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

  rankingEl.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const switchButton = target.closest('[data-ranking-switch]');
    if (!(switchButton instanceof HTMLElement)) return;
    const nextRanking = switchButton.getAttribute('data-ranking-switch');
    if (!nextRanking || nextRanking === selectedRanking) return;
    selectedRanking = nextRanking;
    if (currentSnapshot) renderRankingBoard(currentSnapshot);
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

      renderProjectsBoard(snapshot);

      studiosEl.innerHTML = snapshot.studios.map((studio) => `
        <article class="industry-project">
          <h3>${esc(studio.name)}</h3>
          <p>CEO: ${esc(studio.ceoName)} · Craft ${studio.craft.toFixed(0)} · Speed ${studio.speed.toFixed(0)} · Network ${studio.network.toFixed(0)} · Equity P/I: ${(studio.equity?.player ?? 0)}%/${(studio.equity?.investor ?? 0)}%</p>
        </article>
      `).join('') + `
        <article class="industry-project">
          <h3>NPC Roster</h3>
          <p>${snapshot.npcs.map((npc) => `${esc(npc.name)} (${esc(getNpcRoleLabel(npc.role))})`).join(' · ')}</p>
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

      renderRankingBoard(snapshot);

      managementEl.innerHTML = snapshot.management?.isCeo
        ? `
          <article class="industry-project">
            <h3>Kontrol Studio CEO</h3>
            <p>Studio: ${esc(snapshot.management.studio?.name ?? '-')}</p>
            <p>Craft/Speed/Network: ${snapshot.management.studio?.craft ?? 0}/${snapshot.management.studio?.speed ?? 0}/${snapshot.management.studio?.network ?? 0}</p>
            <p>Gunakan proposal merger (sangat jarang lolos) atau co-funding studio baru.</p>
          </article>
        `
        : '<p>Management hanya tersedia untuk pemain yang sudah menjadi CEO studio.</p>';

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
        if (target === 'fullManagement') button.style.display = snapshot.management?.isCeo ? '' : 'none';
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

  function renderProjectsBoard(snapshot) {
    const projectStageWeight = {
      ideation: 12,
      manga_serialization: 26,
      studio_interest: 46,
      committee_setup: 58,
      preproduction: 70,
      production: 84,
      postproduction: 95,
      release: 100,
    };
    const isStudioOwned = (project) => ['production', 'postproduction', 'release'].includes(project.stage) || (project.studioId && project.committeeApproved);
    const scopedProjects = snapshot.projects.filter((project) => (selectedOwnership === 'studio' ? isStudioOwned(project) : !isStudioOwned(project)));

    const mangaNovelProjects = scopedProjects.filter((project) => ['manga', 'novel'].includes(project.medium));
    const animeProjects = scopedProjects.filter((project) => project.chapters >= 2 || !['ideation'].includes(project.stage));

    const mangaNovelCards = mangaNovelProjects.map((project) => {
      const complexity = Math.min(100, Math.round(project.scriptQuality * 0.52 + project.chapters * 2.3 + project.popularity * 0.36));
      const illustrationLoad = Math.min(100, Math.round(project.chapters * 4.2 + project.delayRisk * 100 * 0.4 + (project.medium === 'novel' ? 24 : 36)));
      const progress = Math.min(100, projectStageWeight[project.stage] ?? 0);
      return `
        <article class="industry-project industry-project-rich" data-project-id="${esc(project.id)}">
          <h3>${esc(project.title)}</h3>
          <p>${esc(project.medium)} · stage: ${esc(project.stage)} · chapter: ${project.chapters}</p>
          <div class="industry-progress">
            <small>Complexity ${complexity}%</small>
            <progress max="100" value="${complexity}"></progress>
            <small>Illustration Workload ${illustrationLoad}%</small>
            <progress max="100" value="${illustrationLoad}"></progress>
            <small>Pipeline Progress ${progress}%</small>
            <progress max="100" value="${progress}"></progress>
          </div>
          <div class="actions">
            <button data-action="open-sub">Detail</button>
            <button data-action="serialize" ${project.canSerialize ? '' : 'disabled'}>Write</button>
            <button data-action="pitch" ${project.canPitch ? '' : 'disabled'}>Pitch</button>
            <button data-action="committee" ${project.canCommittee ? '' : 'disabled'}>Committee</button>
            <button data-action="production" ${project.canProduction ? '' : 'disabled'}>Production</button>
            <button data-action="launch" ${project.canLaunch ? '' : 'disabled'}>Launch</button>
          </div>
        </article>
      `;
    }).join('');

    const animeCards = animeProjects.map((project) => {
      const scriptReadiness = Math.min(100, Math.round(project.scriptQuality * 0.68 + project.chapters * 2.1));
      const visualReadiness = Math.min(100, Math.round(project.popularity * 0.44 + (project.productionProgress ?? 0) * 0.56));
      const handoffReady = project.stage === 'committee_setup' || project.canProduction || ['production', 'postproduction', 'release'].includes(project.stage);
      const studioLabel = project.studioName && project.studioName !== '-' ? project.studioName : 'Belum ada studio';
      return `
        <article class="industry-project industry-project-rich" data-project-id="${esc(project.id)}">
          <h3>${esc(project.title)}</h3>
          <p>Anime Track · ${handoffReady ? `handoff ke studio: ${esc(studioLabel)}` : 'masih personal (scripts/naskah/gambaran)'}</p>
          <div class="industry-progress">
            <small>Script/Naskah Readiness ${scriptReadiness}%</small>
            <progress max="100" value="${scriptReadiness}"></progress>
            <small>Visual Direction ${visualReadiness}%</small>
            <progress max="100" value="${visualReadiness}"></progress>
          </div>
          <div class="actions">
            <button data-action="open-sub">Detail</button>
            <button data-action="committee" ${project.canCommittee ? '' : 'disabled'}>Committee</button>
            <button data-action="production" ${project.canProduction ? '' : 'disabled'}>Production</button>
            <button data-action="launch" ${project.canLaunch ? '' : 'disabled'}>Launch</button>
          </div>
        </article>
      `;
    }).join('');

    const empty = '<p class="empty">Belum ada project di kategori ini.</p>';
    projectsEl.innerHTML = `
      <section class="industry-ownership-switch">
        <button type="button" data-ownership-switch="personal" ${selectedOwnership === 'personal' ? 'data-active="true"' : ''}>Personal</button>
        <button type="button" data-ownership-switch="studio" ${selectedOwnership === 'studio' ? 'data-active="true"' : ''}>Studio</button>
      </section>
      <details class="industry-expandable" open>
        <summary>Manga/Novel (${mangaNovelProjects.length})</summary>
        <div class="industry-expandable-body">${mangaNovelCards || empty}</div>
      </details>
      <details class="industry-expandable" open>
        <summary>Anime (${animeProjects.length})</summary>
        <div class="industry-expandable-body">${animeCards || empty}</div>
      </details>
    `;
  }

  function renderRankingBoard(snapshot) {
    const rankingTabs = [
      { id: 'studio', label: 'Studio' },
      { id: 'anime', label: 'Anime' },
      { id: 'manga', label: 'Manga/Novel' },
      { id: 'individual', label: 'Kekayaan Individu' },
    ];

    if (!rankingTabs.some((entry) => entry.id === selectedRanking)) {
      selectedRanking = 'studio';
    }

    const rankingConfigs = {
      manga: {
        title: 'Ranking Manga/Novel',
        empty: 'Belum ada data.',
        list: snapshot.rankings.manga ?? [],
        renderLine: (entry) => `${esc(entry.title)} <strong>${entry.score.toFixed(1)}</strong>`,
      },
      anime: {
        title: 'Ranking Anime',
        empty: 'Belum ada rilis.',
        list: snapshot.rankings.anime ?? [],
        renderLine: (entry) => `${esc(entry.title)} <strong>${entry.score.toFixed(1)}</strong>`,
      },
      studio: {
        title: 'Ranking Studio',
        empty: 'Belum ada data studio.',
        list: snapshot.rankings.studio ?? [],
        renderLine: (entry) => `${esc(entry.name)} <strong>${entry.score.toFixed(1)}</strong>`,
      },
      individual: {
        title: 'Ranking Kekayaan Individu',
        empty: 'Belum ada data individu.',
        list: snapshot.rankings.individual ?? [],
        renderLine: (entry) => `${esc(entry.name)} <small>(${esc(getNpcRoleLabel(entry.role))})</small> <strong>${Number(entry.score || 0).toLocaleString()}</strong>`,
      },
    };

    const activeConfig = rankingConfigs[selectedRanking] ?? rankingConfigs.studio;

    rankingEl.innerHTML = `
      <section class="industry-tab-switch" aria-label="Switch ranking">
        ${rankingTabs.map((tab) => `
          <button type="button" data-ranking-switch="${tab.id}" ${selectedRanking === tab.id ? 'data-active="true"' : ''}>${tab.label}</button>
        `).join('')}
      </section>
      <article class="industry-project">
        <h3>${activeConfig.title}</h3>
        <ol class="industry-ranking-list">${activeConfig.list.length
          ? activeConfig.list.map((entry) => `<li>${activeConfig.renderLine(entry)}</li>`).join('')
          : `<li>${activeConfig.empty}</li>`}
        </ol>
      </article>
    `;
  }
}
