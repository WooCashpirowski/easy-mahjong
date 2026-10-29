import test from 'node:test';
import assert from 'node:assert/strict';
import { BestTimesRepository, BEST_TIMES_KEY } from '../src/storage/best-times.js';

function memoryStorage() {
  const items = new Map();
  return { getItem: key => items.get(key) ?? null, setItem: (key, value) => items.set(key, value) };
}

test('zachowuje 10 najszybszych czasów rosnąco i odczytuje je w nowej instancji', () => {
  const storage = memoryStorage();
  const repository = new BestTimesRepository(storage);
  for (const time of [120, 80, 100, 55, 95, 90, 180, 150, 140, 70, 60, 110]) {
    assert.ok(repository.add(time * 1000).saved);
  }
  assert.deepEqual(new BestTimesRepository(storage).read().map(s => s.elapsedMs), [55, 60, 70, 80, 90, 95, 100, 110, 120, 140].map(t => t * 1000));
  assert.equal(JSON.parse(storage.getItem(BEST_TIMES_KEY)).length, 10);
});

test('identyczne wyniki są dozwolone i zachowują kolejność dat', () => {
  const repository = new BestTimesRepository(memoryStorage());
  repository.add(1000, '2026-10-29T12:00:00Z');
  repository.add(1000, '2026-10-28T12:00:00Z');
  assert.deepEqual(repository.read().map(s => s.completedAt), ['2026-10-28T12:00:00Z', '2026-10-29T12:00:00Z']);
});

test('uszkodzony JSON i dane o niepoprawnym kształcie nie blokują gry', () => {
  const storage = memoryStorage();
  const repository = new BestTimesRepository(storage);
  for (const value of ['bad JSON', 'null', '{}', '42']) {
    storage.setItem(BEST_TIMES_KEY, value);
    assert.deepEqual(repository.read(), []);
  }
  storage.setItem(BEST_TIMES_KEY, JSON.stringify([null, { elapsedMs: -1, completedAt: '2026-10-29' }, { elapsedMs: '1000', completedAt: '2026-10-29' }, { elapsedMs: 1000, completedAt: 'no date' }, { elapsedMs: 5000, completedAt: '2026-10-29' }]));
  assert.equal(repository.read().length, 1);
  assert.ok(repository.add(3000).saved);
  assert.equal(repository.read().length, 2);
});

test('brak dostępu do localStorage nie zgłasza wyjątku i sygnalizuje brak zapisu', () => {
  const repository = new BestTimesRepository({ getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Quota exceeded'); } });
  assert.deepEqual(repository.read(), []);
  const result = repository.add(1000);
  assert.equal(result.saved, false);
  assert.equal(result.scores.length, 1);
});
