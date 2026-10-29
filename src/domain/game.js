import { createSolvableDeal } from './deal.js';
import { getFreeTiles } from './layout.js';
import { getMatchingPairs, matches } from './tiles.js';

export const HELP_PENALTY_MS = 30_000;

export class MahjongGame {
  constructor({ now = () => performance.now(), random = Math.random, createDeal = createSolvableDeal } = {}) {
    this.now = now;
    this.random = random;
    this.createDeal = createDeal;
    this.newGame();
  }

  newGame() {
    this.tiles = this.createDeal({ random: this.random }).tiles;
    this.selectedId = null;
    this.status = 'ready';
    this.accumulatedMs = 0;
    this.startedAt = null;
  }

  get elapsedMs() {
    return this.accumulatedMs + (this.startedAt === null ? 0 : Math.max(0, this.now() - this.startedAt));
  }

  get freeTiles() {
    return getFreeTiles(this.tiles);
  }

  get pairs() {
    return getMatchingPairs(this.freeTiles);
  }

  start() {
    if (this.status !== 'ready') return;
    this.status = 'running';
    this.startedAt = this.now();
  }

  select(id) {
    if (this.status === 'paused' || this.status === 'won') return { type: 'ignored' };
    const tile = this.freeTiles.find(item => item.id === id);
    if (!tile) return { type: 'blocked' };
    this.start();
    if (this.selectedId === id) {
      this.selectedId = null;
      return { type: 'deselected' };
    }
    const selected = this.tiles.find(item => item.id === this.selectedId);
    if (selected && matches(selected, tile)) {
      this.tiles = this.tiles.filter(item => item.id !== id && item.id !== selected.id);
      this.selectedId = null;
      if (!this.tiles.length) {
        this.accumulatedMs = this.elapsedMs;
        this.startedAt = null;
        this.status = 'won';
      }
      return { type: this.status === 'won' ? 'won' : 'removed', ids: [selected.id, id] };
    }
    this.selectedId = id;
    return { type: selected ? 'mismatch' : 'selected' };
  }

  pause() {
    if (this.status !== 'running') return false;
    this.accumulatedMs = this.elapsedMs;
    this.startedAt = null;
    this.status = 'paused';
    return true;
  }

  resume() {
    if (this.status !== 'paused') return false;
    this.startedAt = this.now();
    this.status = 'running';
    return true;
  }

  hint() {
    if (this.status === 'paused' || this.status === 'won') return null;
    const pair = this.pairs[0];
    if (!pair) return null;
    this.start();
    this.accumulatedMs += HELP_PENALTY_MS;
    this.selectedId = null;
    return pair.map(tile => tile.id);
  }

  shuffle() {
    if (this.status === 'paused' || this.status === 'won') return null;
    const penaltyMs = this.pairs.length ? HELP_PENALTY_MS : 0;
    const { tiles } = this.createDeal({
      positions: this.tiles.map(({ id, x, y, z }) => ({ id, x, y, z })),
      faces: this.tiles.map(tile => tile.face),
      random: this.random,
    });
    this.start();
    this.tiles = tiles;
    this.selectedId = null;
    this.accumulatedMs += penaltyMs;
    return { penaltyMs };
  }
}
