const STORAGE_KEY = 'fadhil-academia-progress-v1';

const modules = Object.freeze([
  {
    id: 'focus',
    title: 'Focus Lab',
    summary: 'Bangun sesi belajar 12 menit yang realistis untuk otak remaja.',
    cards: [
      {
        type: 'Lesson',
        time: '90 detik',
        title: 'Belajar pendek, tapi aktif',
        body: 'Untuk usia 13–16, sesi pendek membantu menjaga energi. Targetkan 1 ide inti, 1 contoh, lalu 1 aksi kecil.\n\nQuest: baca kartu, jawab quiz, dan geser kanan ketika kamu siap lanjut.'
      },
      {
        type: 'Quiz',
        time: '45 detik',
        title: 'Apa format sesi terbaik?',
        body: 'Pilih struktur belajar mikro yang paling kuat untuk memahami konsep baru.',
        question: 'Urutan mana yang paling membantu?',
        options: ['Ide inti → contoh → latihan kecil', 'Baca panjang tanpa jeda', 'Hafalkan semua istilah dulu'],
        answer: 0,
        explain: 'Benar. Konsep yang dipakai segera lebih mudah diingat daripada hanya dibaca.'
      },
      {
        type: 'Reflection',
        time: '2 menit',
        title: 'Rancang sprint 12 menit',
        body: 'Tulis topik yang ingin kamu pahami hari ini dan satu bukti kecil bahwa kamu sudah paham.',
        prompt: 'Contoh: “Aku paham fotosintesis jika bisa menjelaskan input, proses, dan outputnya.”'
      }
    ]
  },
  {
    id: 'research',
    title: 'Research Radar',
    summary: 'Latih cara mengecek klaim, sumber, dan bukti sebelum percaya.',
    cards: [
      {
        type: 'Lesson',
        time: '2 menit',
        title: 'Sumber bukan sekadar link',
        body: 'Sumber kuat biasanya jelas pembuatnya, tanggalnya, tujuan publikasinya, dan bukti yang dipakai. Untuk tugas sekolah, prioritaskan lembaga pendidikan, jurnal, data pemerintah, atau organisasi resmi.'
      },
      {
        type: 'Quiz',
        time: '45 detik',
        title: 'Cek klaim viral',
        body: 'Kamu melihat klaim sains viral tanpa penulis dan tanpa tanggal. Apa tindakan pertama?',
        question: 'Pilih langkah paling akademis.',
        options: ['Cari sumber primer atau lembaga resmi pembanding', 'Langsung bagikan karena viral', 'Percaya jika desainnya bagus'],
        answer: 0,
        explain: 'Tepat. Validasi klaim dimulai dari bukti dan kredibilitas, bukan popularitas.'
      },
      {
        type: 'Reflection',
        time: '2 menit',
        title: 'Buat radar 3 pertanyaan',
        body: 'Sebelum memakai sebuah sumber, ajukan 3 pertanyaan: siapa pembuatnya, bukti apa yang dipakai, dan apakah ada sumber pembanding?',
        prompt: 'Tulis satu sumber belajar yang sering kamu pakai dan cara mengeceknya.'
      }
    ]
  },
  {
    id: 'ai-media',
    title: 'AI & Media Literacy',
    summary: 'Gunakan alat digital dengan kritis, aman, dan tetap orisinal.',
    cards: [
      {
        type: 'Lesson',
        time: '2 menit',
        title: 'AI sebagai partner berpikir',
        body: 'AI bisa membantu brainstorming, membuat contoh, atau memeriksa struktur. Namun jawaban akhirnya tetap harus kamu pahami, cek, dan tulis dengan suara sendiri.'
      },
      {
        type: 'Quiz',
        time: '45 detik',
        title: 'Integritas akademik',
        body: 'Kamu memakai AI untuk membuat rangkuman. Apa langkah paling bertanggung jawab?',
        question: 'Pilih praktik terbaik.',
        options: ['Cek fakta, ubah dengan pemahaman sendiri, dan ikuti aturan guru', 'Salin semua tanpa membaca', 'Hapus sumber agar terlihat orisinal'],
        answer: 0,
        explain: 'Benar. Literasi AI berarti transparan, kritis, dan tetap memahami materi.'
      },
      {
        type: 'Reflection',
        time: '2 menit',
        title: 'Prompt aman',
        body: 'Prompt yang baik meminta penjelasan, contoh, dan batasan. Hindari memasukkan data pribadi atau tugas yang harus kamu kerjakan sendiri.',
        prompt: 'Tulis prompt belajar yang meminta penjelasan, bukan jawaban instan.'
      }
    ]
  },
  {
    id: 'wellbeing',
    title: 'Scholar Wellbeing',
    summary: 'Jaga tidur, emosi, dan energi supaya belajar tetap berkelanjutan.',
    cards: [
      {
        type: 'Lesson',
        time: '90 detik',
        title: 'Belajar butuh pemulihan',
        body: 'Remaja sedang berkembang secara sosial, emosional, dan kognitif. Belajar yang baik tidak hanya mengejar skor, tetapi juga tidur cukup, jeda gerak, dan dukungan orang dewasa tepercaya.'
      },
      {
        type: 'Quiz',
        time: '45 detik',
        title: 'Saat stuck',
        body: 'Kamu buntu mengerjakan soal selama 20 menit. Apa respons paling sehat?',
        question: 'Pilih strategi yang masuk akal.',
        options: ['Ambil jeda singkat, tulis bagian yang membingungkan, lalu minta petunjuk', 'Memaksa terus tanpa jeda sampai lelah', 'Menyerah permanen'],
        answer: 0,
        explain: 'Ya. Jeda dan bantuan tepat waktu membuat proses belajar lebih aman dan efektif.'
      },
      {
        type: 'Reflection',
        time: '2 menit',
        title: 'Kontrak energi',
        body: 'Tentukan satu kebiasaan kecil untuk menjaga energi belajar minggu ini.',
        prompt: 'Contoh: “Setelah 25 menit belajar, aku berdiri dan minum air.”'
      }
    ]
  }
]);

const cards = modules.flatMap((module, moduleIndex) => module.cards.map((card, cardIndex) => ({ ...card, module, moduleIndex, cardIndex })));
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

const state = loadState();
let dragStart = null;
let selectedOption = null;

const elements = {
  app: $('#academiaApp'),
  level: $('#levelLabel'),
  streak: $('#streakLabel'),
  xp: $('#xpValue'),
  accuracy: $('#accuracyValue'),
  cardValue: $('#cardValue'),
  module: $('#moduleLabel'),
  title: $('#cardTitle'),
  progress: $('#progressValue'),
  ring: $('.progress-ring'),
  card: $('#learnCard'),
  type: $('#cardType'),
  time: $('#cardTime'),
  body: $('#cardBody'),
  quiz: $('#quizPanel'),
  reflection: $('#reflectionPanel'),
  reflectionInput: $('#reflectionInput'),
  feedback: $('#feedback'),
  pathway: $('#pathway')
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      index: Number.isInteger(saved.index) ? Math.min(Math.max(saved.index, 0), cards.length - 1) : 0,
      xp: Number.isFinite(saved.xp) ? saved.xp : 0,
      done: Array.isArray(saved.done) ? saved.done.filter(Number.isInteger) : [],
      correct: Number.isFinite(saved.correct) ? saved.correct : 0,
      attempts: Number.isFinite(saved.attempts) ? saved.attempts : 0,
      reflections: saved.reflections && typeof saved.reflections === 'object' ? saved.reflections : {}
    };
  } catch {
    return { index: 0, xp: 0, done: [], correct: 0, attempts: 0, reflections: {} };
  }
}

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function esc(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function levelName(xp) {
  if (xp >= 340) return 'Master Scholar';
  if (xp >= 220) return 'Research Ranger';
  if (xp >= 120) return 'Focus Builder';
  return 'Rookie Scholar';
}

function currentCard() {
  return cards[state.index] || cards[0];
}

function markDone(points = 20) {
  if (!state.done.includes(state.index)) {
    state.done.push(state.index);
    state.xp += points;
  }
}

function renderStats() {
  const progress = Math.round((state.done.length / cards.length) * 100);
  const accuracy = state.attempts ? Math.round((state.correct / state.attempts) * 100) : 0;
  elements.level.textContent = levelName(state.xp);
  elements.streak.textContent = `${state.xp} XP · ${state.done.length} kartu selesai`;
  elements.xp.textContent = state.xp;
  elements.accuracy.textContent = `${accuracy}%`;
  elements.cardValue.textContent = `${state.done.length}/${cards.length}`;
  elements.progress.textContent = `${progress}%`;
  elements.ring.style.setProperty('--progress', `${progress}%`);
}

function renderPathway() {
  elements.pathway.innerHTML = modules.map((module, index) => {
    const total = module.cards.length;
    const done = module.cards.filter((_, cardIndex) => state.done.includes(cards.findIndex((card) => card.module.id === module.id && card.cardIndex === cardIndex))).length;
    return `<article class="path-node" data-active="${currentCard().module.id === module.id}">
      <p class="eyebrow">Stage ${index + 1}</p>
      <h3>${esc(module.title)}</h3>
      <p>${esc(module.summary)}</p>
      <p>${done}/${total} selesai</p>
    </article>`;
  }).join('');
}

function renderCard() {
  const card = currentCard();
  selectedOption = null;
  elements.card.removeAttribute('data-exit');
  elements.card.style.removeProperty('--drag-x');
  elements.card.style.removeProperty('--drag-rotate');
  elements.module.textContent = `${card.module.title} · kartu ${card.cardIndex + 1}/${card.module.cards.length}`;
  elements.title.textContent = card.title;
  elements.type.textContent = card.type;
  elements.time.textContent = card.time;
  elements.body.textContent = card.body;
  elements.feedback.textContent = state.done.includes(state.index) ? 'Selesai. Kamu bisa lanjut atau ulangi kartu ini.' : '';
  elements.quiz.hidden = card.type !== 'Quiz';
  elements.reflection.hidden = card.type !== 'Reflection';
  elements.reflectionInput.value = state.reflections[state.index] || '';

  if (card.type === 'Quiz') {
    elements.quiz.innerHTML = `<p>${esc(card.question)}</p>${card.options.map((option, index) => `<button class="quiz-option" type="button" aria-pressed="false" data-option="${index}">${esc(option)}</button>`).join('')}`;
  } else {
    elements.quiz.innerHTML = '';
  }

  if (card.type === 'Reflection') elements.reflectionInput.placeholder = card.prompt || 'Tulis jawaban singkatmu…';
  renderStats();
  renderPathway();
  saveState();
}

function move(delta) {
  const direction = delta > 0 ? 'right' : 'left';
  elements.card.dataset.exit = direction;
  window.setTimeout(() => {
    state.index = (state.index + delta + cards.length) % cards.length;
    renderCard();
  }, 160);
}

function checkCard() {
  const card = currentCard();
  if (card.type === 'Lesson') {
    markDone(16);
    elements.feedback.textContent = 'Lesson disimpan. Geser kanan untuk lanjut.';
  } else if (card.type === 'Reflection') {
    const value = elements.reflectionInput.value.trim();
    if (value.length < 12) {
      elements.feedback.textContent = 'Tulis minimal satu kalimat refleksi dulu.';
      return;
    }
    state.reflections[state.index] = value;
    markDone(26);
    elements.feedback.textContent = 'Refleksi terkunci. Bagus—kamu membuat bukti belajar sendiri.';
  } else if (card.type === 'Quiz') {
    if (selectedOption === null) {
      elements.feedback.textContent = 'Pilih satu jawaban dulu.';
      return;
    }
    state.attempts += 1;
    const correct = selectedOption === card.answer;
    if (correct) {
      state.correct += 1;
      markDone(34);
    }
    $$('.quiz-option', elements.quiz).forEach((button) => {
      const index = Number(button.dataset.option);
      button.dataset.state = index === card.answer ? 'correct' : (index === selectedOption ? 'wrong' : 'idle');
      button.disabled = true;
    });
    elements.feedback.textContent = correct ? card.explain : `Belum tepat. ${card.explain}`;
  }
  renderStats();
  renderPathway();
  saveState();
}

function resetProgress() {
  localStorage.removeItem(STORAGE_KEY);
  Object.assign(state, { index: 0, xp: 0, done: [], correct: 0, attempts: 0, reflections: {} });
  renderCard();
  elements.feedback.textContent = 'Progres direset. Mulai lagi dari Focus Lab.';
}

function onPointerMove(event) {
  if (!dragStart) return;
  const dx = event.clientX - dragStart.x;
  elements.card.style.setProperty('--drag-x', `${dx}px`);
  elements.card.style.setProperty('--drag-rotate', `${Math.max(-8, Math.min(8, dx / 22))}deg`);
}

function onPointerEnd(event) {
  if (!dragStart) return;
  const dx = event.clientX - dragStart.x;
  dragStart = null;
  elements.card.releasePointerCapture?.(event.pointerId);
  if (Math.abs(dx) > 90) move(dx > 0 ? 1 : -1);
  else {
    elements.card.style.removeProperty('--drag-x');
    elements.card.style.removeProperty('--drag-rotate');
  }
}

elements.app.addEventListener('click', (event) => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'start') elements.card.focus({ preventScroll: false });
  if (action === 'reset') resetProgress();
  if (action === 'prev') move(-1);
  if (action === 'next') move(1);
  if (action === 'check') checkCard();

  const option = event.target.closest('[data-option]');
  if (option) {
    selectedOption = Number(option.dataset.option);
    $$('.quiz-option', elements.quiz).forEach((button) => button.setAttribute('aria-pressed', String(button === option)));
    elements.feedback.textContent = 'Jawaban dipilih. Tekan Cek.';
  }
});

elements.reflectionInput.addEventListener('input', () => {
  state.reflections[state.index] = elements.reflectionInput.value;
  saveState();
});

elements.card.addEventListener('pointerdown', (event) => {
  if (event.target.closest('button, textarea, a')) return;
  dragStart = { x: event.clientX };
  elements.card.setPointerCapture?.(event.pointerId);
});
elements.card.addEventListener('pointermove', onPointerMove);
elements.card.addEventListener('pointerup', onPointerEnd);
elements.card.addEventListener('pointercancel', onPointerEnd);
elements.card.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') move(1);
  if (event.key === 'ArrowLeft') move(-1);
  if (event.key === 'Enter') checkCard();
});

renderCard();
