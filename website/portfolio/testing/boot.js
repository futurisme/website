const optimizeImage = (img) => {
  if (!(img instanceof HTMLImageElement)) return;

  if (!img.hasAttribute('decoding')) {
    img.decoding = 'async';
  }

  if (!img.hasAttribute('loading')) {
    img.loading = 'lazy';
  }

  if (!img.hasAttribute('fetchpriority')) {
    img.fetchPriority = 'low';
  }
};

const optimizeExistingImages = () => {
  document.querySelectorAll('img').forEach(optimizeImage);
};

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node instanceof HTMLImageElement) {
        optimizeImage(node);
      } else if (node instanceof Element) {
        node.querySelectorAll?.('img').forEach(optimizeImage);
      }
    }
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

const loadPortfolioApp = async () => {
  try {
    await import('/portfolio/testing/testing.js');
    optimizeExistingImages();
  } catch (error) {
    console.error('[portfolio] Failed to bootstrap app:', error);
  }
};

const scheduleHydration = () => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(loadPortfolioApp, { timeout: 1200 });
    return;
  }

  window.setTimeout(loadPortfolioApp, 250);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scheduleHydration, { once: true });
} else {
  scheduleHydration();
}
