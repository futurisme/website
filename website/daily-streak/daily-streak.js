import { mountDailyStreakChecklist } from '/library/fadhilweblib/dailystreak/runtime.js';

mountDailyStreakChecklist({
  container: document.getElementById('daily-streak-list'),
  storageKey: 'fadhil-daily-streak-v1',
  items: [
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
  ]
});
