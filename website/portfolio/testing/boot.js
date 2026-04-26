const optimizeImage = (img) => {
  if (!(img instanceof HTMLImageElement)) return;

  if (!img.hasAttribute('decoding')) {
    img.decoding = 'async';
  }

  const isHero = img.alt === 'Fadhil Akbar portfolio banner' || img.closest('#about-testing') !== null;

  if (!img.hasAttribute('loading')) {
    img.loading = isHero ? 'eager' : 'lazy';
  }

  if (!img.hasAttribute('fetchpriority')) {
    img.fetchPriority = isHero ? 'high' : 'low';
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
  loadPortfolioApp();
};

if (document.readyState === 'loading') {
  scheduleHydration();
} else {
  scheduleHydration();
}
