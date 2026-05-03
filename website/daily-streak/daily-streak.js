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

const STORAGE_KEY = 'fadhil-daily-streak-v1';

const container = document.getElementById('daily-streak-list');

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function makeItem(item, checked, state) {
  const row = document.createElement('article');
  row.className = `streak-item${checked ? ' is-checked' : ''}`;

  const checkbox = document.createElement('input');
  checkbox.className = 'streak-item__checkbox';
  checkbox.type = 'checkbox';
  checkbox.checked = checked;
  checkbox.setAttribute('aria-label', `Tandai ${item.label}`);

  const link = document.createElement('a');
  link.className = 'streak-item__label';
  link.href = item.href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = item.label;

  const hint = document.createElement('span');
  hint.className = 'streak-item__hint';
  hint.textContent = 'Buka';

  checkbox.addEventListener('change', () => {
    state[item.id] = checkbox.checked;
    row.classList.toggle('is-checked', checkbox.checked);
    writeState(state);
  });

  row.append(checkbox, link, hint);
  return row;
}

function render() {
  if (!container) return;
  const state = readState();
  const fragment = document.createDocumentFragment();

  DAILY_STREAK_ITEMS.forEach((item) => {
    fragment.append(makeItem(item, Boolean(state[item.id]), state));
  });

  container.replaceChildren(fragment);
}

render();
