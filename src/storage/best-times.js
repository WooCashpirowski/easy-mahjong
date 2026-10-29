export const BEST_TIMES_KEY = 'mahjong.best-times.v1';
export const MAX_BEST_TIMES = 10;

function normalize(entries) {
  if (!Array.isArray(entries)) return [];
  return entries
    .filter(entry => entry && Number.isFinite(entry.elapsedMs) && entry.elapsedMs >= 0 &&
      typeof entry.completedAt === 'string' && Number.isFinite(Date.parse(entry.completedAt)))
    .map(({ elapsedMs, completedAt }) => ({ elapsedMs, completedAt }))
    .sort((a, b) => a.elapsedMs - b.elapsedMs || Date.parse(a.completedAt) - Date.parse(b.completedAt))
    .slice(0, MAX_BEST_TIMES);
}

export class BestTimesRepository {
  constructor(storage) {
    this.storage = storage;
  }

  read() {
    try {
      return normalize(JSON.parse(this.storage.getItem(BEST_TIMES_KEY) ?? '[]'));
    } catch {
      return [];
    }
  }

  add(elapsedMs, completedAt = new Date().toISOString()) {
    const scores = normalize([...this.read(), { elapsedMs, completedAt }]);
    try {
      this.storage.setItem(BEST_TIMES_KEY, JSON.stringify(scores));
      return { scores, saved: true };
    } catch {
      return { scores, saved: false };
    }
  }
}
