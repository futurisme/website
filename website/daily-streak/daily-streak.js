const DAILY_STREAK_ITEMS = [
  { id: 'duolingo', label: 'Duolingo', href: 'https://www.duolingo.com/profile/MTsN3Malang' },
  { id: 'mimo', label: 'Mimo', href: 'https://mimo.org/' },
  { id: 'dailydev', label: 'Daily.dev', href: 'https://app.daily.dev/fadhilakbar' },
  { id: 'tryhackme', label: 'TryHackMe', href: 'https://tryhackme.com/p/fadhilakbar' },
  { id: 'leetcode', label: 'Leetcode', href: 'https://leetcode.com/u/FadhilAkbarCariearsa' },
  { id: 'kaggle', label: 'Kaggle', href: 'https://www.kaggle.com/fadhilakbarcariearsa' },
  { id: 'huggingface', label: 'HuggingFace', href: 'https://huggingface.co/fadhilakbar' },
  { id: 'monkeytype', label: 'Monkeytype', href: 'https://monkeytype.com/profile/fadhilakbar' },
  { id: 'github', label: 'GitHub', href: 'https://github.com/fadhilakbarcariearsaindonesia' },
  { id: 'khanacademy', label: 'Khan Academy', href: 'https://id.khanacademy.org/profile/fadhilakbar' }
];

const applyHints = (container) => {
  const rows = container.querySelectorAll('.streak-item');
  rows.forEach((row) => {
    if (row.querySelector('.streak-item__hint')) return;
    const hint = document.createElement('span');
    hint.className = 'streak-item__hint';
    hint.textContent = 'Buka';
    row.append(hint);
  });
};

const renderFallbackChecklist = ({ container, storageKey, items }) => {
  const safeParse = (raw) => {
    try {
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const readState = () => safeParse(localStorage.getItem(storageKey));
  const writeState = (value) => localStorage.setItem(storageKey, JSON.stringify(value));
  const current = readState();

  const fragment = document.createDocumentFragment();
  items.forEach((item) => {
    const row = document.createElement('article');
    row.className = 'streak-item';

    const checkbox = document.createElement('input');
    checkbox.className = 'streak-item__checkbox';
    checkbox.type = 'checkbox';
    checkbox.checked = Boolean(current[item.id]);
    checkbox.setAttribute('aria-label', `Tandai ${item.label}`);

    checkbox.addEventListener('change', () => {
      const nextState = readState();
      nextState[item.id] = checkbox.checked;
      writeState(nextState);
      row.classList.toggle('is-checked', checkbox.checked);
    });

    const link = document.createElement('a');
    link.className = 'streak-item__label';
    link.href = item.href;
    link.target = '_blank';
    link.rel = 'noreferrer noopener';
    link.textContent = item.label;

    row.classList.toggle('is-checked', checkbox.checked);
    row.append(checkbox, link);
    fragment.append(row);
  });

  container.append(fragment);
  applyHints(container);
};

const mountChecklist = async () => {
  const container = document.getElementById('daily-streak-list');
  if (!container) return;

  const config = { container, storageKey: 'fadhil-daily-streak-v1', items: DAILY_STREAK_ITEMS };

  try {
    const runtime = await import('/library/fadhilweblib/dailystreak/runtime.js');
    if (runtime && typeof runtime.mountDailyStreakChecklist === 'function') {
      runtime.mountDailyStreakChecklist(config);
      applyHints(container);
      return;
    }
  } catch {}

  renderFallbackChecklist(config);
};

void mountChecklist();
