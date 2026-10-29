import { formatDate, formatTime } from './format.js';

export function renderRanking(element, scores) {
  if (!scores.length) {
    element.innerHTML = '<div class="empty-ranking"><div class="empty-ranking-mark" aria-hidden="true"><span></span><span></span><span></span></div><strong>Tu zaczyna się Twój rekord</strong><p>Ukończ pierwszą grę.<br>Dobry czas zostaje na dłużej.</p><span class="empty-time" aria-hidden="true">— — : — —</span></div>';
    return;
  }
  const list = document.createElement('ol');
  list.className = 'ranking-list';
  for (const [index, score] of scores.entries()) {
    const item = document.createElement('li');
    const rank = document.createElement('span');
    rank.className = 'rank-number';
    rank.textContent = String(index + 1).padStart(2, '0');
    const time = document.createElement('strong');
    time.textContent = formatTime(score.elapsedMs, true);
    const date = document.createElement('time');
    date.dateTime = score.completedAt;
    date.textContent = formatDate(score.completedAt);
    item.append(rank, time, date);
    list.append(item);
  }
  element.replaceChildren(list);
}
