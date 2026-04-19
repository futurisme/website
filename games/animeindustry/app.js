import '/games/animeindustry/animeindustry-debugger.js';
import { createAnimeIndustryRuntime } from '/games/animeindustry/industry-runtime.js';
import { createIndustryUiController } from '/library/fadhilweblib/fadhilwebgamelib/industry-engine/industry-ui.js';

const runtime = createAnimeIndustryRuntime();
const appRoot = document.getElementById('animeIndustryApp');

if (!appRoot) {
  window.fadhilAnimeDebugger?.report('bootstrap-error', { message: 'animeIndustryApp root not found' });
} else {
  const refresh = () => ui.render(runtime.snapshot());

  const ui = createIndustryUiController({
    root: appRoot,
    handlers: {
      onTick: (days) => {
        runtime.tick(days);
        refresh();
      },
      onReset: () => {
        runtime.reset();
        ui.setAutoState(false);
        refresh();
      },
      onAutoToggle: () => {
        const active = runtime.toggleAuto((snapshot) => ui.render(snapshot));
        ui.setAutoState(active);
      },
      onBrainstorm: () => {
        runtime.brainstormProject();
        refresh();
      },
      onSerialize: (projectId) => {
        runtime.serializeChapter(projectId);
        refresh();
      },
      onPitch: (projectId) => {
        runtime.pitchToStudio(projectId);
        refresh();
      },
      onCommittee: (projectId) => {
        runtime.formCommittee(projectId);
        refresh();
      },
      onProduction: (projectId) => {
        runtime.startProduction(projectId);
        refresh();
      },
      onLaunch: (projectId) => {
        runtime.launchAnime(projectId);
        refresh();
      },
    },
  });

  refresh();
}
