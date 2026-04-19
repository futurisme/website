import '/games/animeindustry/animeindustry-debugger.js';
import { createAnimeIndustryRuntime } from '/games/animeindustry/industry-runtime.js';
import { createIndustryUiController } from '/library/fadhilweblib/fadhilwebgamelib/industry-engine/industry-ui.js';

function report(kind, detail) {
  if (window.fadhilAnimeDebugger?.report) window.fadhilAnimeDebugger.report(kind, detail);
}

const appRoot = document.getElementById('animeIndustryApp');

if (!appRoot) {
  report('bootstrap-error', { message: 'animeIndustryApp root not found at boot' });
} else {
  let runtime = null;
  try {
    runtime = createAnimeIndustryRuntime();
  } catch (error) {
    report('lib-load-failure', {
      stage: 'createAnimeIndustryRuntime',
      message: error instanceof Error ? error.message : String(error),
    });
  }

  if (!runtime) {
    report('mechanism-warning', { message: 'Runtime unavailable, UI cannot initialize.' });
  } else {
    let ui = null;

    const refresh = () => {
      const snapshot = runtime.snapshot();
      if (!snapshot || !Array.isArray(snapshot.projects) || !Array.isArray(snapshot.feed)) {
        report('mechanism-warning', { message: 'Snapshot invalid structure.', snapshotType: typeof snapshot });
        return;
      }
      ui.render(snapshot);

      if (!appRoot.querySelector('#industryStats') || !appRoot.querySelector('#industryProjects')) {
        report('bootstrap-error', { message: 'Critical UI containers missing after render.' });
      }
      if (snapshot.projects.length === 0 && snapshot.releases.length === 0) {
        report('mechanism-warning', { message: 'No active projects and no releases; gameplay may be stalled.' });
      }
    };

    try {
      ui = createIndustryUiController({
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
          onCareer: (career) => {
            runtime.chooseCareer(career);
            refresh();
          },
          onMedium: (medium) => {
            runtime.chooseWritingMedium(medium);
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
    } catch (error) {
      report('lib-load-failure', {
        stage: 'createIndustryUiController',
        message: error instanceof Error ? error.message : String(error),
      });
    }

    if (ui) refresh();
  }
}
