import test from 'node:test';
import assert from 'node:assert/strict';
import { createTurtleLayout, getFreeTiles, isFree } from '../src/domain/layout.js';
import { createFaces, getMatchingPairs, matchKey, matches } from '../src/domain/tiles.js';
import { createSolvableDeal } from '../src/domain/deal.js';
import { MahjongGame, HELP_PENALTY_MS } from '../src/domain/game.js';

function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function verifySolution(deal) {
  let remaining = [...deal.tiles];
  assert.equal(deal.solution.length, remaining.length / 2);
  for (const ids of deal.solution) {
    const pair = ids.map(id => remaining.find(tile => tile.id === id));
    assert.ok(pair.every(tile => tile && isFree(tile, remaining)), 'Obie płytki muszą być wolne przed usunięciem.');
    assert.ok(matches(...pair));
    remaining = remaining.filter(tile => !ids.includes(tile.id));
  }
  assert.equal(remaining.length, 0);
}

const tile = (id, x, value = 1, y = 0, z = 0, suit = 'dots') => ({ id, x, y, z, face: { suit, value } });

test('klasyczny żółw ma 144 unikalne pozycje w pięciu warstwach', () => {
  const positions = createTurtleLayout();
  assert.equal(positions.length, 144);
  assert.equal(new Set(positions.map(({ x, y, z }) => `${x},${y},${z}`)).size, 144);
  assert.deepEqual([0, 1, 2, 3, 4].map(z => positions.filter(p => p.z === z).length), [87, 36, 16, 4, 1]);
});

test('talia ma 144 płytki, 34 zwykłe typy po 4 i 8 specjalnych', () => {
  const faces = createFaces();
  assert.equal(faces.length, 144);
  const counts = new Map();
  faces.forEach(face => counts.set(matchKey(face), (counts.get(matchKey(face)) ?? 0) + 1));
  assert.equal(counts.size, 36);
  assert.ok([...counts.values()].every(count => count === 4));
  assert.equal(new Set(faces.filter(f => f.suit === 'flowers').map(f => f.value)).size, 4);
  assert.equal(new Set(faces.filter(f => f.suit === 'seasons').map(f => f.value)).size, 4);
});

test('płytkę blokują oba boki, ale pojedynczy sąsiad jej nie blokuje', () => {
  const row = [tile(0, 0), tile(1, 1), tile(2, 2)];
  assert.deepEqual(getFreeTiles(row).map(t => t.id), [0, 2]);
  assert.ok(isFree(row[1], row.slice(1)));
});

test('częściowe przykrycie i sąsiedztwo przesunięte o pół płytki blokują', () => {
  const bottom = tile(0, 0);
  assert.equal(isFree(bottom, [bottom, tile(1, 0.5, 1, 0.5, 1)]), false);
  assert.equal(isFree(bottom, [bottom, tile(1, 1, 1, 0, 1)]), true);
  const middle = tile(0, 0, 1, 3);
  assert.equal(isFree(middle, [middle, tile(1, -1, 1, 3.5), tile(2, 1, 1, 3)]), false);
});

test('kwiaty i pory roku pasują wewnątrz własnych grup', () => {
  const flower = tile(0, 0, 1, 0, 0, 'flowers');
  assert.ok(matches(flower, tile(1, 1, 4, 0, 0, 'flowers')));
  assert.ok(matches(tile(2, 2, 1, 0, 0, 'seasons'), tile(3, 3, 3, 0, 0, 'seasons')));
  assert.equal(matches(flower, tile(4, 4, 1, 0, 0, 'seasons')), false);
  assert.equal(matches(tile(5, 5, 1), tile(6, 6, 2)), false);
});

test('liczba par obejmuje wszystkie kombinacje wolnych płytek', () => {
  assert.equal(getMatchingPairs([tile(0, 0), tile(1, 1), tile(2, 2), tile(3, 3)]).length, 6);
});

test('100 losowych rozdań zachowuje talię i można je całkowicie rozwiązać', () => {
  const faceKeys = faces => faces.map(f => `${f.suit}:${f.value}`).sort();
  const expected = faceKeys(createFaces());
  for (let seed = 1; seed <= 100; seed++) {
    const deal = createSolvableDeal({ random: seededRandom(seed) });
    assert.deepEqual(faceKeys(deal.tiles.map(t => t.face)), expected);
    verifySolution(deal);
  }
});

test('tasowanie niepełnej planszy zachowuje pozycje i pozostałe symbole', () => {
  const initial = createSolvableDeal({ random: seededRandom(51) });
  const removed = new Set(initial.solution.slice(0, 23).flat());
  const remaining = initial.tiles.filter(t => !removed.has(t.id));
  const shuffled = createSolvableDeal({ positions: remaining, faces: remaining.map(t => t.face), random: seededRandom(14) });
  assert.deepEqual(shuffled.tiles.map(t => t.id), remaining.map(t => t.id));
  const keys = tiles => tiles.map(t => `${t.face.suit}:${t.face.value}`).sort();
  assert.deepEqual(keys(shuffled.tiles), keys(remaining));
  verifySolution(shuffled);
});

test('zegar startuje przy legalnym wyborze, wyklucza pauzę i zatrzymuje się po wygranej', () => {
  let now = 0;
  const game = new MahjongGame({ now: () => now, createDeal: () => ({ tiles: [tile(0, 0), tile(1, 1)] }) });
  now = 10_000;
  assert.equal(game.elapsedMs, 0);
  assert.equal(game.select(99).type, 'blocked');
  assert.equal(game.status, 'ready');
  game.select(0);
  now += 1234;
  assert.equal(game.elapsedMs, 1234);
  assert.ok(game.pause());
  now += 20_000;
  assert.equal(game.elapsedMs, 1234);
  assert.equal(game.select(1).type, 'ignored');
  game.resume();
  now += 2000;
  assert.equal(game.select(1).type, 'won');
  assert.equal(game.elapsedMs, 3234);
  now += 100_000;
  assert.equal(game.elapsedMs, 3234);
});

test('kliknięcie tej samej płytki odznacza ją i nie usuwa pary', () => {
  const game = new MahjongGame({ random: seededRandom(1) });
  const id = game.freeTiles[0].id;
  game.select(id);
  assert.equal(game.select(id).type, 'deselected');
  assert.equal(game.tiles.length, 144);
});

test('różne symbole zmieniają wybór, a zablokowana płytka go nie zmienia', () => {
  const tiles = [tile(0, 0, 1), tile(1, 1, 1), tile(2, 2, 2), tile(3, 3, 2)];
  const game = new MahjongGame({ createDeal: () => ({ tiles }) });
  game.select(0);
  assert.equal(game.select(1).type, 'blocked');
  assert.equal(game.selectedId, 0);
  assert.equal(game.select(3).type, 'mismatch');
  assert.equal(game.selectedId, 3);
  assert.equal(game.tiles.length, 4);
});

test('podpowiedź dodaje 30 sekund i wskazuje legalną parę', () => {
  const game = new MahjongGame({ now: () => 0, random: seededRandom(10) });
  const ids = game.hint();
  assert.equal(ids.length, 2);
  assert.equal(game.elapsedMs, HELP_PENALTY_MS);
  assert.ok(ids.every(id => game.freeTiles.some(t => t.id === id)));
  assert.ok(matches(...ids.map(id => game.tiles.find(t => t.id === id))));
});

test('tasowanie dodaje karę tylko wtedy, gdy przed tasowaniem istnieje para', () => {
  const game = new MahjongGame({ now: () => 0, random: seededRandom(1) });
  assert.equal(game.shuffle().penaltyMs, HELP_PENALTY_MS);
  assert.equal(game.elapsedMs, HELP_PENALTY_MS);
  const stuckTiles = [tile(0, 0, 1), tile(1, 1, 1), tile(2, 2, 2), tile(3, 3, 2)];
  const stuck = new MahjongGame({ now: () => 0, random: seededRandom(3), createDeal: options => options.positions ? createSolvableDeal(options) : { tiles: stuckTiles } });
  assert.equal(stuck.pairs.length, 0);
  assert.equal(stuck.hint(), null);
  assert.equal(stuck.status, 'ready');
  assert.equal(stuck.shuffle().penaltyMs, 0);
  assert.equal(stuck.elapsedMs, 0);
  assert.ok(stuck.pairs.length > 0);
});

test('całą grę można ukończyć, usuwając 72 legalne pary', () => {
  const deal = createSolvableDeal({ random: seededRandom(73) });
  const game = new MahjongGame({ createDeal: () => deal });
  for (const [index, [first, second]] of deal.solution.entries()) {
    assert.equal(game.select(first).type, 'selected');
    assert.equal(game.select(second).type, index === 71 ? 'won' : 'removed');
  }
  assert.equal(game.status, 'won');
  assert.equal(game.tiles.length, 0);
  assert.equal(game.hint(), null);
  assert.equal(game.shuffle(), null);
});

test('nowa gra resetuje czas, pauzę i wybór', () => {
  const game = new MahjongGame({ random: seededRandom(9) });
  game.hint();
  game.select(game.freeTiles[0].id);
  game.pause();
  game.newGame();
  assert.equal(game.tiles.length, 144);
  assert.equal(game.status, 'ready');
  assert.equal(game.selectedId, null);
  assert.equal(game.elapsedMs, 0);
});
