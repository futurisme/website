const safeParse = (raw) => {
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
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

  const hitArea = document.createElement('a');
  hitArea.className = 'streak-item__hit';
  hitArea.href = item.href;
  hitArea.target = '_blank';
  hitArea.rel = 'noreferrer noopener';
  hitArea.setAttribute('aria-label', `Buka ${item.label}`);

  checkbox.addEventListener('change', () => {
    const next = readState(storageKey);
    next[item.id] = checkbox.checked;
    writeState(storageKey, next);
    row.classList.toggle('is-checked', checkbox.checked);
  });

  row.classList.toggle('is-checked', checkbox.checked);
  row.append(checkbox, label, hint, hitArea);
  return row;
};

export const mountDailyStreakChecklist = ({ container, storageKey, items }) => {
  if (!container) throw new Error('Daily streak container is required.');
  const state = readState(storageKey);

  const list = document.createElement('div');
  list.className = 'daily-streak__list';
  const left = document.createElement('div');
  left.className = 'daily-streak__column';
  const divider = document.createElement('div');
  divider.className = 'daily-streak__divider';
  const right = document.createElement('div');
  right.className = 'daily-streak__column';

  const mid = Math.ceil(items.length / 2);
  items.slice(0, mid).forEach((item) => left.append(createRow({ item, current: state, storageKey })));
  items.slice(mid).forEach((item) => right.append(createRow({ item, current: state, storageKey })));

  list.append(left, divider, right);
  container.replaceChildren(list);
};
