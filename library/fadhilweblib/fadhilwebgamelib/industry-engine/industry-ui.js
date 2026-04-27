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

function formatCompactValuation(value) {
  const units = [
    { unit: 'QA', div: 1e15 },
    { unit: 'T', div: 1e12 },
    { unit: 'B', div: 1e9 },
    { unit: 'M', div: 1e6 },
    { unit: 'K', div: 1e3 },
  ];
  const amount = Number(value) || 0;
  const abs = Math.abs(amount);
  for (const { unit, div } of units) {
    if (abs >= div) return `${(amount / div).toFixed(2)}${unit}`;
  }
  return amount.toFixed(2);
}

const PROJECT_PROFILE_TAXONOMY = {
  manga: {
    genres: {
      action: ['redemption', 'rivalry', 'survival'],
      fantasy: ['world-building', 'destiny', 'found-family'],
      romance: ['slow-burn', 'second-chance', 'forbidden-love'],
      thriller: ['conspiracy', 'mind-games', 'moral-dilemma'],
      slice_of_life: ['self-growth', 'community', 'work-life'],
    },
    audiences: ['kids', 'teens', 'young_adults', 'general'],
  },
  novel: {
    genres: {
      drama: ['family-conflict', 'class-struggle', 'identity'],
      mystery: ['whodunit', 'cold-case', 'betrayal'],
      romance: ['emotional-healing', 'first-love', 'distance-relationship'],
      fantasy: ['magic-politics', 'hero-journey', 'ancient-legacy'],
      sci_fi: ['post-human', 'space-colony', 'ai-ethics'],
    },
    audiences: ['teens', 'young_adults', 'adults'],
  },
  anime: {
    genres: {
      action: ['tournament', 'revenge', 'elite-training'],
      comedy: ['workplace-chaos', 'parody', 'culture-clash'],
      sports: ['underdog', 'team-bonding', 'comeback'],
      fantasy: ['isekai-politics', 'mythic-war', 'legacy-clans'],
      sci_fi: ['mecha-conflict', 'time-loop', 'cyber-crime'],
    },
    audiences: ['kids', 'teens', 'young_adults', 'general'],
  },
  movie: {
    genres: {
      drama: ['tragedy', 'biographical', 'social-issue'],
      thriller: ['heist', 'psychological', 'cat-and-mouse'],
      fantasy: ['epic-quest', 'mythic-fall', 'legend-reborn'],
      sci_fi: ['first-contact', 'dystopia', 'terraforming'],
      family: ['friendship', 'coming-of-age', 'hope'],
    },
    audiences: ['family', 'teens', 'young_adults', 'adults'],
  },
};

function titleToken(token) {
  return String(token || '')
    .split('_')
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ');
}

export function createIndustryUiController({ root, handlers }) {
  const report = (kind, detail) => {
    window.fadhilAnimeDebugger?.report?.(kind, detail);
  };

  function reportUiContractIssue(selector, message, severity = 'high') {
    report('ui-contract-issue', {
      message,
      selector,
      action: 'watchdog-ui-contract',
      severity,
      href: window.location?.href ?? '',
      day: currentSnapshot?.day ?? 0,
    });
  }

  function bindAction(action, handler, options = {}) {
    const scope = options.scope ?? root;
    const selector = `[data-action="${action}"]`;
    const element = scope.querySelector(selector);
    if (!element) {
      reportUiContractIssue(selector, 'Required UI selector missing');
      return null;
    }
    element.addEventListener('click', handler);
    return element;
  }

  function ensureActionSentinel(action) {
    const selector = `[data-action="${action}"]`;
    if (root.querySelector(selector)) return;
    const sentinel = document.createElement('button');
    sentinel.type = 'button';
    sentinel.hidden = true;
    sentinel.tabIndex = -1;
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.setAttribute('data-ui-contract-sentinel', action);
    sentinel.setAttribute('data-action', action);
    root.appendChild(sentinel);
    reportUiContractIssue(selector, 'UI contract sentinel auto-created', 'medium');
  }

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
    fullCommunities: root.querySelector('#frameFullCommunities'),
    subProject: root.querySelector('#frameSubProject'),
    subProjectCreate: root.querySelector('#frameSubProjectCreate'),
    subStudio: root.querySelector('#frameSubStudio'),
  };

  const statsEl = root.querySelector('#industryStats');
  const profileEl = root.querySelector('#industryProfile');
  const projectsEl = root.querySelector('#industryProjects');
  const studiosEl = root.querySelector('#industryStudios');
  const inboxEl = root.querySelector('#industryInbox');
  const rankingEl = root.querySelector('#rankingBoard');
  const managementEl = root.querySelector('#managementBoard');
  const committeeBodyEl = root.querySelector('#committeeBody');
  const communitiesEl = root.querySelector('#communitiesBoard');
  const feedEl = root.querySelector('#industryFeed');
  const releasesEl = root.querySelector('#industryReleases');
  const ceoStatusEl = root.querySelector('#ceoStatus');
  const topDateEl = root.querySelector('#topDate');
  const subTitleEl = root.querySelector('#subProjectTitle');
  const subBodyEl = root.querySelector('#subProjectBody');
  const subProjectCreateTitleEl = root.querySelector('#subProjectCreateTitle');
  const subProjectCreateBodyEl = root.querySelector('#subProjectCreateBody');
  const subStudioTitleEl = root.querySelector('#subStudioTitle');
  const subStudioBodyEl = root.querySelector('#subStudioBody');
  const studioNameInput = root.querySelector('#studioNameInput');
  const savePayloadInput = root.querySelector('#savePayloadInput');
  const registerSaveInput = root.querySelector('#registerSaveInput');

  let selectedProjectId = null;
  let currentSnapshot = null;
  let selectedOwnership = 'personal';
  let selectedRanking = 'studio';
  let popupTimer = null;
  let selectedCreateMedium = null;
  let pendingCreateDraft = { title: '', genre: '', theme: '', targetAudience: '' };
  let studioReturnFrame = 'fullStudios';
  let pendingRankingSnapshot = null;
  let rankingRenderKey = '';
  let pendingCommunitiesSnapshot = null;
  let communitiesRenderKey = '';
  let lastUserScrollAt = 0;
  let scrollIdleTimer = null;
  let deferredSnapshot = null;
  let api = null;

  [
    ['#industryStats', statsEl],
    ['#industryProfile', profileEl],
    ['#industryProjects', projectsEl],
    ['#industryStudios', studiosEl],
    ['#industryInbox', inboxEl],
    ['#rankingBoard', rankingEl],
    ['#committeeBody', committeeBodyEl],
    ['#topDate', topDateEl],
  ].forEach(([selector, element]) => {
    if (!element) reportUiContractIssue(selector, 'Required root element missing');
  });

  ensureActionSentinel('open-create-project');
  root.querySelectorAll('.frame-content-scroll').forEach((scrollNode) => {
    scrollNode.addEventListener('scroll', () => {
      lastUserScrollAt = performance.now();
      if (scrollIdleTimer) clearTimeout(scrollIdleTimer);
      scrollIdleTimer = setTimeout(() => {
        if (deferredSnapshot && api) {
          const snapshotToRender = deferredSnapshot;
          deferredSnapshot = null;
          api.render(snapshotToRender, { bypassScrollGuard: true });
          return;
        }
        const activeRanking = frames.fullRanking?.classList.contains('frame-active');
        const activeCommunities = frames.fullCommunities?.classList.contains('frame-active');
        if (activeRanking && pendingRankingSnapshot) {
          renderRankingBoard(pendingRankingSnapshot, { force: true });
          pendingRankingSnapshot = null;
        }
        if (activeCommunities && pendingCommunitiesSnapshot) {
          renderCommunitiesBoard(pendingCommunitiesSnapshot, { force: true });
          pendingCommunitiesSnapshot = null;
        }
      }, 160);
    }, { passive: true });
  });

  function isUserActivelyScrolling() {
    return performance.now() - lastUserScrollAt < 180;
  }

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
    if (key === 'fullRanking' && pendingRankingSnapshot) {
      renderRankingBoard(pendingRankingSnapshot, { force: true });
      pendingRankingSnapshot = null;
    }
    if (key === 'fullCommunities' && pendingCommunitiesSnapshot) {
      renderCommunitiesBoard(pendingCommunitiesSnapshot, { force: true });
      pendingCommunitiesSnapshot = null;
    }
  }

  bindAction('register', () => {
    const name = root.querySelector('#registerName').value;
    const profession = root.querySelector('#registerProfession').value;
    handlers.onRegister(name, profession);
  });

  bindAction('tick-1', () => handlers.onTick(1));
  bindAction('tick-7', () => handlers.onTick(7));
  bindAction('toggle-auto', handlers.onAutoToggle);

  bindAction('to-full-profile', () => openFrame('fullProfile'));
  bindAction('to-full-projects', () => openFrame('fullProjects'));
  bindAction('to-full-studios', () => openFrame('fullStudios'));
  bindAction('to-full-email', () => openFrame('fullEmail'));
  bindAction('to-full-found-studio', () => openFrame('fullFoundStudio'));
  bindAction('to-full-ranking', () => openFrame('fullRanking'));
  bindAction('to-full-communities', () => openFrame('fullCommunities'));
  bindAction('to-full-management', () => openFrame('fullManagement'));
  bindAction('to-full-feed', () => openFrame('fullFeed'));
  document.querySelector('[data-action="to-full-settings"]')?.addEventListener('click', () => openFrame('fullSettings'));
  root.querySelectorAll('[data-action="back-main"]').forEach((button) => button.addEventListener('click', () => openFrame('main')));
  root.querySelectorAll('[data-action="back-projects"]').forEach((button) => button.addEventListener('click', () => openFrame('fullProjects')));
  root.querySelector('[data-action="back-studio-source"]')?.addEventListener('click', () => openFrame(studioReturnFrame));
  root.querySelector('[data-action="cancel-create-project"]')?.addEventListener('click', () => {
    selectedCreateMedium = null;
    pendingCreateDraft = { title: '', genre: '', theme: '', targetAudience: '' };
    renderProjectCreateSubframe();
    openFrame('fullProjects');
  });

  root.querySelector('[data-action="seek-funding"]')?.addEventListener('click', () => {
    const ok = handlers.onSeekFunding();
    if (!ok) showPopup('Gagal melakukan pendanaan.', 'error');
  });
  root.querySelector('[data-action="improve-admin"]')?.addEventListener('click', handlers.onImproveAdmin);
  root.querySelector('[data-action="open-studio-planning"]')?.addEventListener('click', () => {
    const ok = handlers.onOpenStudioPlanning();
    if (!ok) showPopup('Failed to open studio planning.', 'error');
  });
  root.querySelector('[data-action="found-studio"]')?.addEventListener('click', () => {
    const ok = handlers.onFoundStudio(studioNameInput.value);
    if (ok) {
      showPopup('Studio berhasil didirikan.', 'success');
      openFrame('main');
    } else {
      showPopup('Failed to found studio.', 'error');
    }
  });
  bindAction('committee-discuss', () => {
    if (selectedProjectId) handlers.onCommitteeDiscuss(selectedProjectId);
  });
  bindAction('committee-confirm', () => {
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
      showPopup('New studio co-funding succeeded.', 'success');
      openFrame('main');
    } else {
      showPopup('Failed: co-funding requirements are not met yet.', 'error');
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

  function handleProjectCreationAction(target) {
    const action = target.getAttribute('data-action');
    if (action === 'open-create-project') {
      selectedCreateMedium = null;
      pendingCreateDraft = { title: '', genre: '', theme: '', targetAudience: '' };
      renderProjectCreateSubframe();
      openFrame('subProjectCreate');
      return true;
    }
    if (action === 'select-create-medium') {
      const medium = target.getAttribute('data-medium');
      if (!medium) return true;
      selectedCreateMedium = medium;
      renderProjectCreateSubframe();
      return true;
    }
    if (action === 'cancel-create-project-inline') {
      selectedCreateMedium = null;
      pendingCreateDraft = { title: '', genre: '', theme: '', targetAudience: '' };
      renderProjectCreateSubframe();
      openFrame('fullProjects');
      return true;
    }
    if (action === 'confirm-create-project') {
      if (!selectedCreateMedium) {
        showPopup('Please select a project type first.', 'error');
        return true;
      }
      const projectTitle = root.querySelector('#createProjectTitleInput')?.value?.trim() || '';
      const projectGenre = root.querySelector('#createProjectGenreInput')?.value?.trim() || '';
      const projectTheme = root.querySelector('#createProjectThemeInput')?.value?.trim() || '';
      const projectAudience = root.querySelector('#createProjectAudienceInput')?.value?.trim() || '';
      pendingCreateDraft = { title: projectTitle, genre: projectGenre, theme: projectTheme, targetAudience: projectAudience };
      const ok = handlers.onCreateProject?.({
        medium: selectedCreateMedium,
        title: projectTitle,
        genre: projectGenre,
        theme: projectTheme,
        targetAudience: projectAudience,
      });
      if (!ok) {
        showPopup('Gagal membuat project. Pastikan semua field terisi, judul unik, dan dana cukup.', 'error');
        return true;
      }
      showPopup('Project baru berhasil ditambahkan ke pipeline.', 'success');
      selectedCreateMedium = null;
      pendingCreateDraft = { title: '', genre: '', theme: '', targetAudience: '' };
      renderProjectCreateSubframe();
      openFrame('fullProjects');
      return true;
    }
    return false;
  }

  projectsEl?.addEventListener('click', (event) => {
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
    if (handleProjectCreationAction(target)) return;
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

  subProjectCreateBodyEl?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    handleProjectCreationAction(target);
  });
  subProjectCreateBodyEl?.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.id === 'createProjectGenreInput' && selectedCreateMedium) {
      const selectedGenre = target.value;
      pendingCreateDraft.genre = selectedGenre;
      const mediumConfig = PROJECT_PROFILE_TAXONOMY[selectedCreateMedium];
      const themes = mediumConfig?.genres?.[selectedGenre] || [];
      pendingCreateDraft.theme = themes[0] || '';
      renderProjectCreateSubframe();
      return;
    }
    if (target.id === 'createProjectThemeInput') pendingCreateDraft.theme = target.value;
    if (target.id === 'createProjectAudienceInput') pendingCreateDraft.targetAudience = target.value;
  });

  committeeBodyEl?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.getAttribute('data-action');
    if (action !== 'select-studio') return;
    const studioId = target.getAttribute('data-studio-id');
    if (!selectedProjectId || !studioId) return;
    handlers.onSelectStudio(selectedProjectId, studioId);
  });

  inboxEl?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.getAttribute('data-action');
    if (action !== 'read-email') return;
    const emailId = target.getAttribute('data-email-id');
    if (!emailId) return;
    handlers.onReadEmail(emailId);
  });
  studiosEl?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const card = target.closest('[data-studio-id]');
    if (!(card instanceof HTMLElement)) return;
    const studioId = card.getAttribute('data-studio-id');
    if (!studioId || !currentSnapshot?.studioDetails?.[studioId]) return;
    studioReturnFrame = 'fullStudios';
    renderStudioDetail(currentSnapshot, studioId);
    openFrame('subStudio');
  });

  rankingEl?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const switchButton = target.closest('[data-ranking-switch]');
    if (!(switchButton instanceof HTMLElement)) return;
    const nextRanking = switchButton.getAttribute('data-ranking-switch');
    if (!nextRanking || nextRanking === selectedRanking) return;
    selectedRanking = nextRanking;
    if (currentSnapshot) renderRankingBoard(currentSnapshot);
    return;
  });
  rankingEl?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const card = target.closest('[data-studio-id]');
    if (!(card instanceof HTMLElement)) return;
    const studioId = card.getAttribute('data-studio-id');
    if (!studioId || !currentSnapshot?.studioDetails?.[studioId]) return;
    studioReturnFrame = 'fullRanking';
    renderStudioDetail(currentSnapshot, studioId);
    openFrame('subStudio');
  });

  const controller = {
    render(snapshot, options = {}) {
      currentSnapshot = snapshot;
      if (!topDateEl || !statsEl || !profileEl || !projectsEl || !studiosEl || !inboxEl || !rankingEl || !feedEl || !releasesEl || !communitiesEl) {
        reportUiContractIssue('#animeIndustryApp', 'Render skipped: critical UI nodes missing');
        return;
      }

      if (!snapshot.registered) {
        openFrame('register');
        return;
      }

      const activeFrame = Object.values(frames).find((frame) => frame?.classList.contains('frame-active'));
      const activeScrollNode = activeFrame?.querySelector?.('.frame-content-scroll');
      if (!options.bypassScrollGuard && activeScrollNode && isUserActivelyScrolling()) {
        deferredSnapshot = snapshot;
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
        <article class="industry-metric"><small>Name</small><strong>${esc(snapshot.player.name)}</strong></article>
        <article class="industry-metric"><small>Profesi saat ini</small><strong>${esc(snapshot.player.currentProfession)}</strong></article>
        <article class="industry-metric"><small>Reputasi</small><strong>${snapshot.reputation}</strong></article>
        <article class="industry-metric"><small>Studio Aktif</small><strong>${esc(snapshot.player.studioName)}</strong></article>
      `;

      renderProjectsBoard(snapshot);
      renderProjectCreateSubframe();

      studiosEl.innerHTML = snapshot.studios.map((studio) => `
        <article class="industry-project" data-studio-id="${esc(studio.id)}">
          <h3>${esc(studio.name)}</h3>
          <p>CEO: ${esc(studio.ceoName)} · Tier ${esc(studio.tier)} · Rating ${Number(studio.rating || 0).toFixed(1)} · ${esc(studio.category)} · Craft ${studio.craft.toFixed(0)} · Speed ${studio.speed.toFixed(0)} · Network ${studio.network.toFixed(0)} · Equity P/I: ${(studio.equity?.player ?? 0)}%/${(studio.equity?.investor ?? 0)}%</p>
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
            : 'No active NPC projects yet.'}</p>
        </article>
      `;

      inboxEl.innerHTML = snapshot.unreadEmails?.length
        ? snapshot.unreadEmails.map((email) => `
          <article class="industry-project">
            <h3>${esc(email.subject)}</h3>
            <p>${esc(email.body)}</p>
            <button data-action="read-email" data-email-id="${esc(email.id)}">Mark as Read</button>
          </article>
        `).join('')
        : '<p class="empty">No unread emails.</p>';

      if (frames.fullRanking?.classList.contains('frame-active') && !isUserActivelyScrolling()) {
        renderRankingBoard(snapshot);
        pendingRankingSnapshot = null;
      } else {
        pendingRankingSnapshot = snapshot;
      }
      if (frames.fullCommunities?.classList.contains('frame-active') && !isUserActivelyScrolling()) {
        renderCommunitiesBoard(snapshot);
        pendingCommunitiesSnapshot = null;
      } else {
        pendingCommunitiesSnapshot = snapshot;
      }

      managementEl.innerHTML = snapshot.management?.isCeo
        ? `
          <article class="industry-project">
            <h3>Kontrol Studio CEO</h3>
            <p>Studio: ${esc(snapshot.management.studio?.name ?? '-')}</p>
            <p>Craft/Speed/Network: ${snapshot.management.studio?.craft ?? 0}/${snapshot.management.studio?.speed ?? 0}/${snapshot.management.studio?.network ?? 0}</p>
            <p>Use merger proposals (rarely accepted) or co-fund a new studio.</p>
          </article>
        `
        : '<p>Management is only available once the player becomes a studio CEO.</p>';

      const committeeProject = snapshot.projects.find((entry) => entry.id === selectedProjectId);
      if (committeeProject) {
        const committeeFinance = committeeProject.committeeFinance || {};
        const alloc = committeeFinance.allocations || {};
        const allocSpent = committeeFinance.allocationSpent || {};
        committeeBodyEl.innerHTML = `
          <article class="industry-project">
            <h3>${esc(committeeProject.title)}</h3>
            <p>Studio dipilih: ${esc(committeeProject.studioName)}</p>
            <p>Rencana Episode: ${Math.max(1, Number(committeeProject.plannedEpisodes || 0))} episode · Budget Need ${Number(committeeProject.budgetNeed || 0).toLocaleString()} · Secured ${Number(committeeProject.securedBudget || 0).toLocaleString()}</p>
            <p>Anggaran/Episode: ${Math.round((Number(committeeFinance.committeeBudget || committeeProject.budgetNeed || 0)) / Math.max(1, Number(committeeProject.plannedEpisodes || 1))).toLocaleString()} · Spent ${Number(committeeFinance.spent || 0).toLocaleString()} · Debt Top-up ${Number(committeeFinance.debtToCommittee || 0).toLocaleString()}</p>
            <p>Alokasi (Visual/Alur/Suara/Marketing/Admin): ${(Number(alloc.visual || 0) * 100).toFixed(1)}% / ${(Number(alloc.plot || 0) * 100).toFixed(1)}% / ${(Number(alloc.audio || 0) * 100).toFixed(1)}% / ${(Number(alloc.marketing || 0) * 100).toFixed(1)}% / ${(Number(alloc.administration || 0) * 100).toFixed(1)}%</p>
            <p>Pemakaian Alokasi: V ${Math.round(Number(allocSpent.visual || 0)).toLocaleString()} · A ${Math.round(Number(allocSpent.plot || 0)).toLocaleString()} · S ${Math.round(Number(allocSpent.audio || 0)).toLocaleString()} · M ${Math.round(Number(allocSpent.marketing || 0)).toLocaleString()} · Ad ${Math.round(Number(allocSpent.administration || 0)).toLocaleString()}</p>
            <p>Draft Bagi Hasil (Creator/Studio/Investor): ${committeeProject.contractDraft.creatorShare}% / ${committeeProject.contractDraft.studioShare}% / ${committeeProject.contractDraft.investorShare}%</p>
            <p>Committee approval: ${committeeProject.committeeApproved ? '✅ Ready' : '⏳ Discussion in progress'}</p>
            <div class="actions">
              ${(committeeProject.interestedStudios || []).map((studio) => `<button data-action="select-studio" data-studio-id="${esc(studio.id)}">Select ${esc(studio.name)}</button>`).join('')}
            </div>
            <ul class="industry-feed">${(committeeProject.committeeNegotiationLog || []).map((line) => `<li>${esc(line)}</li>`).join('')}</ul>
          </article>
        `;
      } else {
        committeeBodyEl.innerHTML = '<p>Select a project from the Projects frame, then open Production Committee.</p>';
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
        : '<li>No releases yet.</li>';

      if (selectedProjectId) {
        const project = snapshot.projects.find((entry) => entry.id === selectedProjectId);
        if (project) {
          subTitleEl.textContent = project.title;
          subBodyEl.innerHTML = `
            <p>Medium: ${esc(project.medium)}</p>
            <p>Genre: ${esc(project.genre || '-')} · Theme: ${esc(project.theme || '-')} · Audience: ${esc(project.targetAudience || '-')}</p>
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
      const autoToggleButton = root.querySelector('[data-action="toggle-auto"]');
      if (autoToggleButton) autoToggleButton.textContent = active ? 'Stop Auto' : 'Auto';
    },
    openMain() {
      openFrame('main');
    },
  };
  api = controller;
  return controller;

  function renderProjectsBoard(snapshot) {
    const projectStageWeight = {
      ideation: 12,
      manga_serialization: 26,
      studio_interest: 46,
      committee_setup: 58,
      preproduction: 70,
      production: 84,
      postproduction: 95,
      committee_review: 97,
      release: 100,
    };
    const isStudioOwned = (project) => ['production', 'postproduction', 'release'].includes(project.stage) || (project.studioId && project.committeeApproved);
    const scopedProjects = snapshot.projects.filter((project) => (selectedOwnership === 'studio' ? isStudioOwned(project) : !isStudioOwned(project)));

    const mangaNovelProjects = scopedProjects.filter((project) => ['manga', 'novel'].includes(project.medium));
    const animeProjects = scopedProjects.filter((project) => ['anime', 'movie'].includes(project.medium) || project.chapters >= 2 || !['ideation'].includes(project.stage));

    const mangaNovelCards = mangaNovelProjects.map((project) => {
      const complexity = Math.min(100, Math.round(project.scriptQuality * 0.52 + project.chapters * 2.3 + project.popularity * 0.36));
      const illustrationLoad = Math.min(100, Math.round(project.chapters * 4.2 + project.delayRisk * 100 * 0.4 + (project.medium === 'novel' ? 24 : 36)));
      const progress = Math.min(100, projectStageWeight[project.stage] ?? 0);
      return `
        <article class="industry-project industry-project-rich" data-project-id="${esc(project.id)}">
          <h3>${esc(project.title)}</h3>
          <p>${esc(project.medium)} · stage: ${esc(project.stage)} · chapter: ${project.chapters}</p>
          <p>Genre: ${esc(project.genre || '-')} · Theme: ${esc(project.theme || '-')} · Audience: ${esc(project.targetAudience || '-')}</p>
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
      const studioLabel = project.studioName && project.studioName !== '-' ? project.studioName : 'No studio yet';
      const writeLabel = project.medium === 'movie' ? 'Develop Film' : 'Develop';
      return `
        <article class="industry-project industry-project-rich" data-project-id="${esc(project.id)}">
          <h3>${esc(project.title)}</h3>
          <p>${esc(project.medium === 'movie' ? 'Movie Track' : 'Anime Track')} · ${handoffReady ? `handoff to studio: ${esc(studioLabel)}` : 'still personal (scripts/drafts/visual concepts)'}</p>
          <p>Genre: ${esc(project.genre || '-')} · Theme: ${esc(project.theme || '-')} · Audience: ${esc(project.targetAudience || '-')}</p>
          <div class="industry-progress">
            <small>Script/Naskah Readiness ${scriptReadiness}%</small>
            <progress max="100" value="${scriptReadiness}"></progress>
            <small>Visual Direction ${visualReadiness}%</small>
            <progress max="100" value="${visualReadiness}"></progress>
          </div>
          <div class="actions">
            <button data-action="open-sub">Detail</button>
            <button data-action="serialize" ${project.canSerialize ? '' : 'disabled'}>${writeLabel}</button>
            <button data-action="pitch" ${project.canPitch ? '' : 'disabled'}>Pitch</button>
            <button data-action="committee" ${project.canCommittee ? '' : 'disabled'}>Committee</button>
            <button data-action="production" ${project.canProduction ? '' : 'disabled'}>Production</button>
            <button data-action="launch" ${project.canLaunch ? '' : 'disabled'}>Launch</button>
          </div>
        </article>
      `;
    }).join('');

    const empty = '<p class="empty">No projects in this category yet.</p>';
    projectsEl.innerHTML = `
      <section class="industry-ownership-switch">
        <button type="button" data-ownership-switch="personal" ${selectedOwnership === 'personal' ? 'data-active="true"' : ''}>Personal</button>
        <button type="button" data-ownership-switch="studio" ${selectedOwnership === 'studio' ? 'data-active="true"' : ''}>Studio</button>
      </section>
      <div class="industry-toolbar">
        <button type="button" data-action="open-create-project">Create a new project</button>
      </div>
      <details class="industry-expandable" open>
        <summary>Manga/Novel (${mangaNovelProjects.length})</summary>
        <div class="industry-expandable-body">${mangaNovelCards || empty}</div>
      </details>
      <details class="industry-expandable" open>
        <summary>Anime (${animeProjects.length})</summary>
        <div class="industry-expandable-body">${animeCards || empty}</div>
      </details>
    `;
    if (!projectsEl.querySelector('[data-action="open-create-project"]')) {
      reportUiContractIssue('[data-action="open-create-project"]', 'Create project trigger missing after projects render');
    }
  }

  function renderProjectCreateSubframe() {
    if (!subProjectCreateBodyEl) return;
    if (!selectedCreateMedium) {
      if (subProjectCreateTitleEl) subProjectCreateTitleEl.textContent = 'Create New Project';
      subProjectCreateBodyEl.innerHTML = `
        <p>Select the project type you want to create:</p>
        <div class="industry-toolbar">
          <button type="button" data-action="select-create-medium" data-medium="manga">Manga</button>
          <button type="button" data-action="select-create-medium" data-medium="novel">Novel</button>
          <button type="button" data-action="select-create-medium" data-medium="anime">Anime</button>
          <button type="button" data-action="select-create-medium" data-medium="movie">Movie</button>
        </div>
      `;
      return;
    }
    const mediumLabel = selectedCreateMedium[0].toUpperCase() + selectedCreateMedium.slice(1);
    const mediumConfig = PROJECT_PROFILE_TAXONOMY[selectedCreateMedium] || { genres: {}, audiences: [] };
    const genreOptions = Object.keys(mediumConfig.genres);
    const selectedGenre = pendingCreateDraft.genre && genreOptions.includes(pendingCreateDraft.genre)
      ? pendingCreateDraft.genre
      : (genreOptions[0] || '');
    const themeOptions = mediumConfig.genres[selectedGenre] || [];
    const selectedTheme = pendingCreateDraft.theme && themeOptions.includes(pendingCreateDraft.theme)
      ? pendingCreateDraft.theme
      : (themeOptions[0] || '');
    const selectedAudience = pendingCreateDraft.targetAudience && mediumConfig.audiences.includes(pendingCreateDraft.targetAudience)
      ? pendingCreateDraft.targetAudience
      : (mediumConfig.audiences[0] || '');
    pendingCreateDraft.genre = selectedGenre;
    pendingCreateDraft.theme = selectedTheme;
    pendingCreateDraft.targetAudience = selectedAudience;
    if (subProjectCreateTitleEl) subProjectCreateTitleEl.textContent = `${mediumLabel} Development Brief`;
    subProjectCreateBodyEl.innerHTML = `
      <label>Title</label>
      <input id="createProjectTitleInput" type="text" maxlength="80" placeholder="Enter project title" value="${esc(pendingCreateDraft.title)}" />
      <label>Genre</label>
      <select id="createProjectGenreInput">
        ${genreOptions.map((genre) => `<option value="${esc(genre)}" ${genre === selectedGenre ? 'selected' : ''}>${esc(titleToken(genre))}</option>`).join('')}
      </select>
      <label>Theme</label>
      <select id="createProjectThemeInput">
        ${themeOptions.map((theme) => `<option value="${esc(theme)}" ${theme === selectedTheme ? 'selected' : ''}>${esc(titleToken(theme))}</option>`).join('')}
      </select>
      <label>Target audience</label>
      <select id="createProjectAudienceInput">
        ${mediumConfig.audiences.map((audience) => `<option value="${esc(audience)}" ${audience === selectedAudience ? 'selected' : ''}>${esc(titleToken(audience))}</option>`).join('')}
      </select>
      <div class="industry-toolbar">
        <button type="button" data-action="confirm-create-project">Confirm</button>
        <button type="button" data-action="cancel-create-project-inline">Cancel</button>
      </div>
    `;
  }

  function renderStudioDetail(snapshot, studioId) {
    if (!subStudioBodyEl || !subStudioTitleEl) return;
    const detail = snapshot.studioDetails?.[studioId];
    if (!detail) {
      subStudioTitleEl.textContent = 'Studio Detail';
      subStudioBodyEl.innerHTML = '<p>Studio data was not found.</p>';
      return;
    }
    subStudioTitleEl.textContent = detail.name;
    const animeAssets = (detail.assets?.anime || []).length
      ? `<ul class="industry-feed">${detail.assets.anime.map((name) => `<li>${esc(name)}</li>`).join('')}</ul>`
      : '<p>-</p>';
    const mangaAssets = (detail.assets?.manga || []).length
      ? `<ul class="industry-feed">${detail.assets.manga.map((name) => `<li>${esc(name)}</li>`).join('')}</ul>`
      : '<p>-</p>';
    const movieAssets = (detail.assets?.movie || []).length
      ? `<ul class="industry-feed">${detail.assets.movie.map((name) => `<li>${esc(name)}</li>`).join('')}</ul>`
      : '<p>-</p>';
    subStudioBodyEl.innerHTML = `
      <article class="industry-project">
        <h3>Studio Summary</h3>
        <div class="industry-studio-kv">
          <div class="industry-studio-kv-row"><p><strong>Studio Name:</strong> ${esc(detail.name)}</p></div>
          <div class="industry-studio-kv-row"><p><strong>Studio Rating:</strong> ${Number(detail.rating?.overall || 0).toFixed(2)}</p></div>
          <div class="industry-studio-kv-row"><p><strong>Class/Tier:</strong> ${esc(detail.tier)}</p></div>
          <div class="industry-studio-kv-row"><p><strong>Category:</strong> ${esc(detail.category)}</p></div>
          <div class="industry-studio-kv-row"><p><strong>Valuation:</strong> ${Number(detail.valuation || 0).toLocaleString()}</p></div>
          <div class="industry-studio-kv-row"><p><strong>Founder:</strong> ${esc(detail.founderName)}</p></div>
          <div class="industry-studio-kv-row"><p><strong>CEO:</strong> ${esc(detail.ceoName)}</p></div>
          <div class="industry-studio-kv-row"><p><strong>Studio Funds:</strong> ${Number(detail.funds || 0).toLocaleString()}</p></div>
          ${detail.finance
            ? `<div class="industry-studio-kv-row"><p><strong>Latest Income:</strong> ${Number(detail.finance.income || 0).toLocaleString()}</p></div>
               <div class="industry-studio-kv-row"><p><strong>Latest Expense:</strong> ${Number(detail.finance.expense || 0).toLocaleString()}</p></div>
               <div class="industry-studio-kv-row"><p><strong>Latest Net:</strong> ${Number(detail.finance.net || 0).toLocaleString()}</p></div>`
            : '<div class="industry-studio-kv-row"><p><strong>Latest Income:</strong> Not available yet.</p></div><div class="industry-studio-kv-row"><p><strong>Latest Expense:</strong> Not available yet.</p></div><div class="industry-studio-kv-row"><p><strong>Latest Net:</strong> Not available yet.</p></div>'}
          <div class="industry-studio-kv-row"><p><strong>Release Score:</strong> ${Number(detail.rating?.components?.releaseQuality || 0).toFixed(1)}</p></div>
          <div class="industry-studio-kv-row"><p><strong>Production Score:</strong> ${Number(detail.rating?.components?.productionQuality || 0).toFixed(1)}</p></div>
          <div class="industry-studio-kv-row"><p><strong>Competence:</strong> ${Number(detail.rating?.components?.competence || 0).toFixed(1)}</p></div>
          <div class="industry-studio-kv-row"><p><strong>Reliability:</strong> ${Number(detail.rating?.components?.reliability || 0).toFixed(1)}</p></div>
          <div class="industry-studio-kv-row"><p><strong>Tier Score:</strong> ${Number(detail.rating?.components?.studioTier || 0).toFixed(1)}</p></div>
          <div class="industry-studio-kv-row"><p><strong>Investor Multiplier:</strong> ×${Number(detail.rating?.multipliers?.investorAttractiveness || 1).toFixed(2)}</p></div>
          <div class="industry-studio-kv-row"><p><strong>Project Momentum:</strong> ×${Number(detail.rating?.multipliers?.projectMomentum || 1).toFixed(2)}</p></div>
          <div class="industry-studio-kv-row"><p><strong>Marketing Efficiency:</strong> ×${Number(detail.rating?.multipliers?.marketingEfficiency || 1).toFixed(2)}</p></div>
        </div>
      </article>
      <article class="industry-project">
        <h3>Studio Assets</h3>
        <p><strong>Anime</strong></p>
        ${animeAssets}
        <p><strong>Manga/Novel</strong></p>
        ${mangaAssets}
        <p><strong>Movies</strong></p>
        ${movieAssets}
      </article>
      <article class="industry-project">
        <h3>Staff Studio (Animator)</h3>
        ${(detail.staff || []).length
          ? `<ul class="industry-feed">${detail.staff.map((staff) => `<li>${esc(staff.name)} · Rep ${Number(staff.reputation || 0).toFixed(1)} · Mood ${(Number(staff.mood || 0) * 100).toFixed(0)}%</li>`).join('')}</ul>`
          : '<p>No animator staff recorded.</p>'}
      </article>
      <article class="industry-project">
        <h3>Investor Ranking (Studio)</h3>
        ${(detail.investors || []).length
          ? `<ol class="industry-ranking-list">${detail.investors.map((inv, index) => `<li>#${index + 1} · ${esc(inv.name)} · Score ${(Number(inv.score) || 0).toFixed(2)} · Influence ${Math.round(Number(inv.influence) || 0)}</li>`).join('')}</ol>`
          : '<p>No active investors for this studio yet.</p>'}
      </article>
    `;
  }

  function renderRankingBoard(snapshot, options = {}) {
    const force = Boolean(options.force);

    const rankingTabs = [
      { id: 'studio', label: 'Studio' },
      { id: 'anime', label: 'Anime' },
      { id: 'manga', label: 'Manga/Novel' },
      { id: 'individual', label: 'Individual Wealth' },
    ];

    if (!rankingTabs.some((entry) => entry.id === selectedRanking)) {
      selectedRanking = 'studio';
    }

    const rankingConfigs = {
      manga: {
        title: 'Ranking Manga/Novel',
        empty: 'No data yet.',
        list: snapshot.rankings.manga ?? [],
        renderLine: (entry, rank) => `
          <div class="industry-ranking-row industry-ranking-row-double">
            <div class="industry-ranking-line">
              <span class="industry-ranking-rank">#${rank}</span>
              <span class="industry-ranking-name">${esc(entry.title)}</span>
              <span class="industry-ranking-tag">Vol ${Math.max(0, Math.floor(entry.volume ?? 0))}</span>
              <span class="industry-ranking-tag">${esc(entry.format || 'Manga/Novel')}</span>
            </div>
            <div class="industry-ranking-line industry-ranking-line-sub">
              <strong class="industry-ranking-score">${(Number(entry.score) || 0).toFixed(1)} pts</strong>
              <span class="industry-ranking-meta">Popularity ${(Number(entry.popularity) || 0).toFixed(1)}%</span>
              <span class="industry-ranking-meta">IMDb ${(Number(entry.imdb) || 0).toFixed(1)}</span>
            </div>
          </div>
        `,
      },
      anime: {
        title: 'Ranking Anime',
        empty: 'No releases yet.',
        list: snapshot.rankings.anime ?? [],
        renderLine: (entry, rank) => `
          <div class="industry-ranking-row industry-ranking-row-double">
            <div class="industry-ranking-line">
              <span class="industry-ranking-rank">#${rank}</span>
              <span class="industry-ranking-name">${esc(entry.title)}</span>
              <span class="industry-ranking-tag">${esc(entry.series || 'Series 1')}</span>
              <span class="industry-ranking-tag">${esc(entry.format || 'Anime')}</span>
            </div>
            <div class="industry-ranking-line industry-ranking-line-sub">
              <strong class="industry-ranking-score">${(Number(entry.score) || 0).toFixed(1)} pts</strong>
              <span class="industry-ranking-meta">Popularity ${(Number(entry.popularity) || 0).toFixed(1)}%</span>
              <span class="industry-ranking-meta">IMDb ${(Number(entry.imdb) || 0).toFixed(1)}</span>
            </div>
          </div>
        `,
      },
      studio: {
        title: 'Ranking Studio',
        empty: 'No studio data yet.',
        list: snapshot.rankings.studio ?? [],
        renderLine: (entry, rank) => `
          <div class="industry-ranking-row industry-ranking-row-double" data-studio-id="${esc(entry.id)}">
            <div class="industry-ranking-line">
              <span class="industry-ranking-rank">#${rank}</span>
              <span class="industry-ranking-name">${esc(entry.name)}</span>
              <span class="industry-ranking-tag">Studio</span>
              <span class="industry-ranking-tag">Rating ${(Number(entry.rating) || 0).toFixed(1)}</span>
              <span class="industry-ranking-tag">Tier ${esc(entry.tier || '-')}</span>
            </div>
            <div class="industry-ranking-line industry-ranking-line-sub">
              <strong class="industry-ranking-score">${(Number(entry.score) || 0).toFixed(1)} val</strong>
              <span class="industry-ranking-meta">Popularity ${(Number(entry.popularity) || 0).toFixed(1)}%</span>
              <span class="industry-ranking-meta">Total Anime ${Math.max(0, Math.floor(entry.totalAnime ?? 0))}</span>
            </div>
          </div>
        `,
      },
      individual: {
        title: 'Individual Wealth Ranking',
        empty: 'No individual data yet.',
        list: snapshot.rankings.individual ?? [],
        renderLine: (entry, rank) => `
          <div class="industry-ranking-row">
            <div class="industry-ranking-line">
              <span class="industry-ranking-rank">#${rank}</span>
              <span class="industry-ranking-name">${esc(entry.name)}</span>
              <span class="industry-ranking-tag">${esc(getNpcRoleLabel(entry.role))}</span>
              <strong class="industry-ranking-score">${formatCompactValuation(entry.score)}</strong>
            </div>
          </div>
        `,
      },
    };

    const activeConfig = rankingConfigs[selectedRanking] ?? rankingConfigs.studio;
    const activeList = activeConfig.list || [];
    const nextRenderKey = `${selectedRanking}|${activeList.length}|${activeList
      .slice(0, 8)
      .map((entry) => `${entry.id ?? entry.name ?? entry.title}:${Number(entry.score) || 0}:${Number(entry.popularity) || 0}`)
      .join('|')}`;
    if (!force && nextRenderKey === rankingRenderKey) return;
    rankingRenderKey = nextRenderKey;

    rankingEl.innerHTML = `
      <section class="industry-tab-switch" aria-label="Switch ranking">
        ${rankingTabs.map((tab) => `
          <button type="button" data-ranking-switch="${tab.id}" ${selectedRanking === tab.id ? 'data-active="true"' : ''}>${tab.label}</button>
        `).join('')}
      </section>
      <article class="industry-project">
        <h3>${activeConfig.title}</h3>
        <ol class="industry-ranking-list">${activeConfig.list.length
          ? activeConfig.list.map((entry, index) => `<li>${activeConfig.renderLine(entry, index + 1)}</li>`).join('')
          : `<li class="industry-ranking-empty">${activeConfig.empty}</li>`}
        </ol>
      </article>
    `;

  }

  function renderCommunitiesBoard(snapshot, options = {}) {
    if (!communitiesEl) return;
    const force = Boolean(options.force);
    const communities = snapshot.communities || {};
    const regions = Array.isArray(communities.regions) ? communities.regions : [];
    const ages = Array.isArray(communities.ages) ? communities.ages : [];
    const mediums = Array.isArray(communities.mediums) ? communities.mediums : [];
    const trends = Array.isArray(communities.trends) ? communities.trends : [];

    const normalizeRows = (rows) => {
      const source = rows.length ? rows : [{ key: 'N/A', value: 1 }];
      const prepared = source.map((row) => ({
        key: row.key,
        value: Math.max(0, Number(row.value) || 0),
      }));
      const total = prepared.reduce((sum, row) => sum + row.value, 0) || 1;
      return prepared.map((row) => ({ key: row.key, value: row.value / total }));
    };

    const renderPie = (rows, palette) => {
      const normalized = normalizeRows(rows);
      let cursor = 0;
      const gradientStops = normalized.map((row, index) => {
        const start = cursor * 100;
        cursor += row.value;
        const end = cursor * 100;
        const color = palette[index % palette.length];
        return `${color} ${start.toFixed(3)}% ${end.toFixed(3)}%`;
      }).join(', ');
      return `<div class="industry-community-pie" style="background:conic-gradient(${gradientStops})" aria-hidden="true"></div>`;
    };

    const renderLegend = (rows, palette) => normalizeRows(rows).map((row, index) => `
      <li><span class="industry-community-dot" style="background:${palette[index % palette.length]}"></span>${esc(row.key)}: ${(Math.max(0, Number(row.value) || 0) * 100).toFixed(2)}%</li>
    `).join('');

    const nextRenderKey = [
      regions.map((row) => `${row.key}:${Number(row.value) || 0}`).join('|'),
      ages.map((row) => `${row.key}:${Number(row.value) || 0}`).join('|'),
      mediums.map((row) => `${row.key}:${Number(row.value) || 0}`).join('|'),
      trends.slice(0, 8).map((row) => `${row.genre}:${Number(row.momentum) || 0}:${Number(row.count) || 0}`).join('|'),
    ].join('::');
    if (!force && nextRenderKey === communitiesRenderKey) return;
    communitiesRenderKey = nextRenderKey;

    const regionPalette = ['#7dd3fc', '#a78bfa', '#34d399', '#fbbf24', '#fb7185'];
    const agePalette = ['#60a5fa', '#22d3ee', '#4ade80', '#f97316', '#f472b6'];
    const mediumPalette = ['#818cf8', '#2dd4bf', '#f59e0b', '#ef4444'];

    communitiesEl.innerHTML = `
      <article class="industry-project">
        <h3>Global Fanbase Regions</h3>
        <div class="industry-community-chart">${renderPie(regions, regionPalette)}</div>
        <ul class="industry-community-legend">${renderLegend(regions, regionPalette)}</ul>
      </article>
      <article class="industry-project">
        <h3>Audience Age Structure</h3>
        <div class="industry-community-chart">${renderPie(ages, agePalette)}</div>
        <ul class="industry-community-legend">${renderLegend(ages, agePalette)}</ul>
      </article>
      <article class="industry-project">
        <h3>Platform Medium Trends</h3>
        <div class="industry-community-chart">${renderPie(mediums, mediumPalette)}</div>
        <ul class="industry-community-legend">${renderLegend(mediums, mediumPalette)}</ul>
      </article>
      <article class="industry-project">
        <h3>Genre Momentum & Pioneer Wave</h3>
        ${(trends.length
          ? `<ol class="industry-ranking-list">${trends.map((entry, index) => `<li>#${index + 1} · ${esc(entry.genre)} · Momentum ${(Number(entry.momentum) || 0).toFixed(2)} · Active Titles ${Math.max(1, Math.round(Number(entry.count) || 0))}</li>`).join('')}</ol>`
          : '<p>No strong genre wave detected yet.</p>')}
      </article>
    `;
  }
}
