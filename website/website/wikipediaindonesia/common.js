(function () {
  const PROFILE_TITLE = 'Fadhil Akbar Cariearsa';
  const ENABLED = () => mw.config.get('wgNamespaceNumber') === 2 && mw.config.get('wgTitle') === PROFILE_TITLE;
  const DAY0_UTC = Date.UTC(2026, 4, 15);

  const pad = (n) => String(n).padStart(2, '0');
  const nowWIB = () => {
    const d = new Date();
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    return new Date(utc + 7 * 3600000);
  };

  const renderRuntime = () => {
    const runtime = document.getElementById('fadhil-runtime');
    if (!runtime) return;
    const days = Math.max(0, Math.floor((Date.now() - DAY0_UTC) / 86400000));
    runtime.textContent = `${days} hari`;
  };

  const startClock = () => {
    const clock = document.getElementById('fadhil-clock');
    if (!clock) return;
    const tick = () => {
      const d = nowWIB();
      clock.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} WIB`;
    };
    tick();
    setInterval(tick, 1000);
  };

  const init = () => { renderRuntime(); startClock(); };
  const hasMw = !!(window.mw && window.$);
  if (hasMw && ENABLED()) $(init);
  if (!hasMw) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
    window.addEventListener('fadhil-profile-ready', init);
  }
})();
