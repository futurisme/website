import '/games/animeindustry/animeindustry-debugger.js';
import { createAnimeIndustryRuntime } from '/games/animeindustry/industry-runtime.js';
import { createIndustryUiController } from '/library/fadhilweblib/fadhilwebgamelib/industry-engine/industry-ui.js';

const AUTO_SAVE_KEY = 'animeindustry-autosave-v1';

function report(kind, detail) {
  window.fadhilAnimeDebugger?.report?.(kind, detail);
}

const appRoot = document.getElementById('animeIndustryApp');

if (!appRoot) {
  report('bootstrap-error', { message: 'animeIndustryApp root not found at boot' });
} else {
  const runtime = createAnimeIndustryRuntime();
  let renderRafId = 0;
  let pendingSnapshot = null;
  let persistTimer = null;

  const persistAutoSave = () => {
    try {
      const payload = runtime.exportCompactSave();
      if (payload) window.localStorage?.setItem?.(AUTO_SAVE_KEY, payload);
    } catch {
      // no-op: avoid breaking gameplay due to storage/browser constraints
    }
  };

  const queuePersist = () => {
    if (persistTimer) return;
    persistTimer = window.setTimeout(() => {
      persistTimer = null;
      persistAutoSave();
    }, 420);
  };

  const flushRender = () => {
    renderRafId = 0;
    const snapshot = pendingSnapshot || runtime.snapshot();
    pendingSnapshot = null;
    ui.render(snapshot);
    queuePersist();
  };

  const renderAndPersist = (snapshot = null) => {
    pendingSnapshot = snapshot || runtime.snapshot();
    if (renderRafId) return;
    renderRafId = window.requestAnimationFrame(flushRender);
  };

  const ui = createIndustryUiController({
    root: appRoot,
    handlers: {
      onRegister: (name, profession) => {
        const ok = runtime.registerPlayer(name, profession);
        if (!ok) report('mechanism-warning', { message: 'Register failed', name, profession });
        renderAndPersist();
        if (ok) ui.openMain();
      },
      onTick: (days) => { runtime.tick(days); renderAndPersist(); },
      onCreateProject: (draft) => { const ok = runtime.createProjectFromDraft(draft); renderAndPersist(); return ok; },
      onAutoToggle: () => {
        const active = runtime.toggleAuto((snapshot) => {
          renderAndPersist(snapshot);
        });
        ui.setAutoState(active);
      },
      onSeekFunding: () => { const ok = runtime.seekFunding(); renderAndPersist(); return ok; },
      onImproveAdmin: () => { const ok = runtime.improveAdministration(); renderAndPersist(); return ok; },
      onOpenStudioPlanning: () => { const ok = runtime.openStudioPlanning(); renderAndPersist(); return ok; },
      onFoundStudio: (studioName) => {
        const ok = runtime.foundStudioAsCeo(studioName);
        renderAndPersist();
        return ok;
      },
      onOpenProject: () => {},
      onSerialize: (projectId) => { runtime.serializeChapter(projectId); renderAndPersist(); },
      onPitch: (projectId) => { runtime.pitchToStudio(projectId); renderAndPersist(); },
      onCommittee: (projectId) => { runtime.formCommittee(projectId); renderAndPersist(); },
      onCommitteeDiscuss: (projectId) => { runtime.discussCommitteeContract(projectId); renderAndPersist(); },
      onSelectStudio: (projectId, studioId) => { runtime.chooseAdaptationStudio(projectId, studioId); renderAndPersist(); },
      onReadEmail: (emailId) => { const ok = runtime.markEmailRead(emailId); renderAndPersist(); return ok; },
      onManagementMerger: () => { const ok = runtime.proposeMergerStudio(); renderAndPersist(); return ok; },
      onManagementCoFund: () => { const ok = runtime.proposeCoFundedStudio(); renderAndPersist(); return ok; },
      onExportSave: () => runtime.exportCompactSave(),
      onImportSave: (payload) => { const ok = runtime.importCompactSave(payload); renderAndPersist(); return ok; },
      onProduction: (projectId) => { runtime.startProduction(projectId); renderAndPersist(); },
      onLaunch: (projectId) => { runtime.launchAnime(projectId); renderAndPersist(); },
      onReset: () => {
        runtime.reset();
        ui.setAutoState(false);
        try { window.localStorage?.removeItem?.(AUTO_SAVE_KEY); } catch {}
        renderAndPersist();
      },
    },
  });

  try {
    const autosave = window.localStorage?.getItem?.(AUTO_SAVE_KEY);
    if (autosave) runtime.importCompactSave(autosave);
  } catch {
    // ignore localStorage loading errors
  }

  renderAndPersist();
}
