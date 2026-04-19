import { createAnimeIndustryRuntime } from '/games/animeindustry/industry-runtime.js';
import { createIndustryUiController } from '/library/fadhilweblib/fadhilwebgamelib/industry-engine/industry-ui.js';

const runtime = createAnimeIndustryRuntime();
const appRoot = document.getElementById('animeIndustryApp');

const ui = createIndustryUiController({
  root: appRoot,
  onTick: (count) => {
    runtime.tick(count);
    ui.render(runtime.snapshot());
  },
  onReset: () => {
    runtime.reset();
    ui.render(runtime.snapshot());
  },
  onAutoToggle: () => {
    const isAuto = runtime.toggleAuto((snapshot) => ui.render(snapshot));
    ui.setAutoState(isAuto);
  },
});

ui.render(runtime.snapshot());
