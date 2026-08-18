const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeNewsDate,
  toggleSavedNewsIds,
} = require('../utils/newsSaveHelpers');

test('normalizeNewsDate keeps a valid date value', () => {
  assert.equal(normalizeNewsDate('2026-08-18'), '2026-08-18');
  assert.equal(normalizeNewsDate(''), '');
  assert.equal(normalizeNewsDate(null), '');
});

test('toggleSavedNewsIds adds and removes ids without duplicates', () => {
  assert.deepEqual(toggleSavedNewsIds(['a', 'b'], 'c'), ['a', 'b', 'c']);
  assert.deepEqual(toggleSavedNewsIds(['a', 'b'], 'a'), ['b']);
  assert.deepEqual(toggleSavedNewsIds(['a', 'a', 'b'], 'a'), ['b']);
});
