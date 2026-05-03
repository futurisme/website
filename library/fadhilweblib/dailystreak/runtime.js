const safeParse = (raw) => {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const readState = (storageKey) => safeParse(localStorage.getItem(storageKey));
const writeState = (storageKey, value) => localStorage.setItem(storageKey, JSON.stringify(value));

const createRow = ({ item, current, storageKey }) => {
  const row = document.createElement('article');
  row.className = 'streak-item';

  const checkbox = document.createElement('input');
  checkbox.className = 'streak-item__checkbox';
  checkbox.type = 'checkbox';
  checkbox.checked = Boolean(current[item.id]);
  checkbox.setAttribute('aria-label', `Tandai ${item.label}`);

  const label = document.createElement('a');
  label.className = 'streak-item__label';
  label.href = item.href;
  label.target = '_blank';
  label.rel = 'noreferrer noopener';
  label.textContent = item.label;

  const hint = document.createElement('span');
  hint.className = 'streak-item__hint';
  hint.textContent = 'Buka';

  checkbox.addEventListener('change', () => {
    const next = readState(storageKey);
    next[item.id] = checkbox.checked;
    writeState(storageKey, next);
    row.classList.toggle('is-checked', checkbox.checked);
  });

  row.classList.toggle('is-checked', checkbox.checked);
  row.append(checkbox, label, hint);
  return row;
};

export const mountDailyStreakChecklist = ({
  container,
  storageKey,
  items,
  columns = 2
}) => {
  if (!container) throw new Error('Daily streak container is required.');
  if (!Array.isArray(items)) throw new Error('Daily streak items must be an array.');

  const state = readState(storageKey);
  const fragment = document.createDocumentFragment();

  const grid = document.createElement('div');
  grid.className = 'daily-streak__grid';
  grid.style.setProperty('--daily-streak-columns', String(Math.max(1, columns)));
  grid.style.setProperty('--daily-streak-mobile-breakpoint', `${Math.max(320, mobileBreakpoint)}px`);

  items.forEach((item) => {
    grid.append(createRow({ item, current: state, storageKey }));
  });

  fragment.append(grid);
  container.replaceChildren(fragment);
};
