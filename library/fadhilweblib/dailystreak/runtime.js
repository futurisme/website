const safeParse = (raw) => {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const readState = (storageKey) => safeParse(localStorage.getItem(storageKey));

const writeState = (storageKey, value) => {
  localStorage.setItem(storageKey, JSON.stringify(value));
};

export const mountDailyStreakChecklist = ({ container, storageKey, items }) => {
  if (!container) {
    throw new Error('Daily streak container is required.');
  }

  const current = readState(storageKey);

  items.forEach((item) => {
    const row = document.createElement('article');
    row.className = 'streak-item';

    const checkbox = document.createElement('input');
    checkbox.className = 'streak-item__checkbox';
    checkbox.type = 'checkbox';
    checkbox.checked = Boolean(current[item.id]);
    checkbox.setAttribute('aria-label', `Tandai ${item.label}`);
    checkbox.addEventListener('change', () => {
      const nextState = readState(storageKey);
      nextState[item.id] = checkbox.checked;
      writeState(storageKey, nextState);
    });

    const link = document.createElement('a');
    link.className = 'streak-item__label';
    link.href = item.href;
    link.target = '_blank';
    link.rel = 'noreferrer noopener';
    link.textContent = item.label;

    row.append(checkbox, link);
    container.append(row);
  });
};
