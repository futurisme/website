import '/games/animeindustry/animeindustry-debugger.js';
import { createAnimeIndustryRuntime } from '/games/animeindustry/industry-runtime.js';
import { createIndustryUiController } from '/library/fadhilweblib/fadhilwebgamelib/industry-engine/industry-ui.js';

function report(kind, detail) {
  window.fadhilAnimeDebugger?.report?.(kind, detail);
}

const appRoot = document.getElementById('animeIndustryApp');

if (!appRoot) {
  report('bootstrap-error', { message: 'animeIndustryApp root not found at boot' });
} else {
  const runtime = createAnimeIndustryRuntime();
  const ui = createIndustryUiController({
    root: appRoot,
    handlers: {
      onRegister: (name, profession) => {
        const ok = runtime.registerPlayer(name, profession);
        if (!ok) report('mechanism-warning', { message: 'Register failed', name, profession });
        ui.render(runtime.snapshot());
        if (ok) ui.openMain();
      },
      onTick: (days) => { runtime.tick(days); ui.render(runtime.snapshot()); },
      onBrainstorm: () => { runtime.brainstormProject(); ui.render(runtime.snapshot()); },
      onAutoToggle: () => {
        const active = runtime.toggleAuto((snapshot) => ui.render(snapshot));
        ui.setAutoState(active);
      },
      onSeekFunding: () => { const ok = runtime.seekFunding(); ui.render(runtime.snapshot()); return ok; },
      onImproveAdmin: () => { const ok = runtime.improveAdministration(); ui.render(runtime.snapshot()); return ok; },
      onOpenStudioPlanning: () => { const ok = runtime.openStudioPlanning(); ui.render(runtime.snapshot()); return ok; },
      onFoundStudio: (studioName) => {
        const ok = runtime.foundStudioAsCeo(studioName);
        ui.render(runtime.snapshot());
        return ok;
      },
      onOpenProject: () => {},
      onSerialize: (projectId) => { runtime.serializeChapter(projectId); ui.render(runtime.snapshot()); },
      onPitch: (projectId) => { runtime.pitchToStudio(projectId); ui.render(runtime.snapshot()); },
      onCommittee: (projectId) => { runtime.formCommittee(projectId); ui.render(runtime.snapshot()); },
      onCommitteeDiscuss: (projectId) => { runtime.discussCommitteeContract(projectId); ui.render(runtime.snapshot()); },
      onSelectStudio: (projectId, studioId) => { runtime.chooseAdaptationStudio(projectId, studioId); ui.render(runtime.snapshot()); },
      onReadEmail: (emailId) => { const ok = runtime.markEmailRead(emailId); ui.render(runtime.snapshot()); return ok; },
      onManagementMerger: () => { const ok = runtime.proposeMergerStudio(); ui.render(runtime.snapshot()); return ok; },
      onManagementCoFund: () => { const ok = runtime.proposeCoFundedStudio(); ui.render(runtime.snapshot()); return ok; },
      onExportSave: () => runtime.exportCompactSave(),
      onImportSave: (payload) => { const ok = runtime.importCompactSave(payload); ui.render(runtime.snapshot()); return ok; },
      onProduction: (projectId) => { runtime.startProduction(projectId); ui.render(runtime.snapshot()); },
      onLaunch: (projectId) => { runtime.launchAnime(projectId); ui.render(runtime.snapshot()); },
      onReset: () => { runtime.reset(); ui.setAutoState(false); ui.render(runtime.snapshot()); },
    },
  });

  ui.render(runtime.snapshot());
}
