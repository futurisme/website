import { loadBook, saveBook } from '/books/lib/fadhilebooklib-browser.js';

const titleInput = document.getElementById('book-title');
const pagesInput = document.getElementById('book-pages');
const saveButton = document.getElementById('save-book');
const formatButton = document.getElementById('format-json');

const state = loadBook();
titleInput.value = state.title || '';
pagesInput.value = JSON.stringify(state.pages, null, 2);

const normalizePage = (page, i, total) => ({
  id: String(page.id || `page-${i + 1}`),
  type: i === 0 ? 'front-cover' : i === total - 1 ? 'back-cover' : 'page',
  title: String(page.title || `Halaman ${i + 1}`),
  content: String(page.content || '')
});

const parsePages = () => {
  const parsed = JSON.parse(pagesInput.value);
  if (!Array.isArray(parsed) || parsed.length < 2) throw new Error('Minimal 2 halaman.');
  return parsed.map((page, i) => normalizePage(page || {}, i, parsed.length));
};

formatButton.addEventListener('click', () => {
  try {
    const pages = parsePages();
    pagesInput.value = JSON.stringify(pages, null, 2);
  } catch (error) {
    alert(`Gagal memformat JSON: ${error.message}`);
  }
});

saveButton.addEventListener('click', () => {
  try {
    const pages = parsePages();
    saveBook({ title: titleInput.value.trim() || 'Untitled Book', pages });
    window.location.href = '/books';
  } catch (error) {
    alert(`Gagal menyimpan buku: ${error.message}`);
  }
});
