import assert from 'node:assert/strict';
import test from 'node:test';
import { FadhilEBookLite } from './index';

test('fadhilebooklib keeps navigation bounded and lightweight defaults', () => {
  const engine = new FadhilEBookLite({
    title: 'Demo',
    pages: [
      { id: 'front', type: 'front-cover', title: 'Front', content: 'A' },
      { id: 'middle', type: 'page', title: 'Middle', content: 'B' },
      { id: 'back', type: 'back-cover', title: 'Back', content: 'C' },
    ],
  });

  assert.equal(engine.pageCount, 3);
  assert.equal(engine.currentIndex, 0);
  assert.equal(engine.currentPage.type, 'front-cover');

  engine.prev();
  assert.equal(engine.currentIndex, 0, 'prev should stay at first page');

  engine.next();
  engine.next();
  engine.next();
  assert.equal(engine.currentIndex, 2, 'next should stay at last page');
  assert.equal(engine.currentPage.type, 'back-cover');
  assert.ok(engine.getDuration() >= 100);
});
