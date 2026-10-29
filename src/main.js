import { MahjongGame } from './domain/game.js';
import { BestTimesRepository, BEST_TIMES_KEY } from './storage/best-times.js';
import { BoardView } from './ui/board-view.js';
import { renderRanking } from './ui/ranking-view.js';
import { formatTime } from './ui/format.js';
import { setupPwaView } from './ui/pwa-view.js';

const byId = id => document.getElementById(id);
const game = new MahjongGame();
const repository = new BestTimesRepository({
  getItem: key => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
});
const board = new BoardView(byId('board'), selectTile);
const rulesDialog = byId('rules-dialog');
const newGameDialog = byId('new-game-dialog');
const sidebarDialog = byId('sidebar-dialog');
const dialogs = [rulesDialog, newGameDialog, sidebarDialog];
const isDialogOpen = () => dialogs.some(dialog => dialog.open);
let hintedIds = [];
let resumeAfterDialog = false;

function setStatus(message) {
  byId('status').textContent = message;
}

function render() {
  board.update(game, hintedIds);
  const pairCount = game.pairs.length;
  byId('remaining').textContent = game.tiles.length;
  byId('pair-count').textContent = pairCount;
  byId('pair-count').classList.toggle('no-pairs', pairCount === 0 && game.status !== 'won');
  byId('timer').textContent = formatTime(game.elapsedMs);
  byId('pause-button').disabled = game.status !== 'running';
  byId('hint-button').disabled = ['paused', 'won'].includes(game.status) || !pairCount;
  byId('shuffle-button').disabled = ['paused', 'won'].includes(game.status);
  byId('shuffle-penalty').textContent = pairCount ? '+30 s' : 'bez kary';
  byId('play-surface').classList.toggle('is-paused', game.status === 'paused');
  byId('board-overlay').hidden = !['paused', 'won'].includes(game.status);
  if (game.status === 'paused') {
    byId('overlay-symbol').textContent = 'Ⅱ';
    byId('overlay-eyebrow').textContent = 'CHWILA ODDECHU';
    byId('overlay-title').textContent = 'Gra wstrzymana';
    byId('overlay-message').textContent = 'Wróć, kiedy zechcesz. Czas poczeka.';
    byId('overlay-action').textContent = 'Wznów grę';
  }
}

function selectTile(id) {
  const result = game.select(id);
  hintedIds = [];
  render();
  if (result.type === 'won') {
    const { scores, saved } = repository.add(game.elapsedMs);
    renderRanking(byId('ranking-content'), scores);
    byId('overlay-symbol').textContent = '✦';
    byId('overlay-eyebrow').textContent = 'CAŁA PLANSZA JEST TWOJA';
    byId('overlay-title').textContent = 'Pięknie rozegrane!';
    byId('overlay-message').textContent = `Twój czas: ${formatTime(game.elapsedMs, true)}. ${saved ? 'Wynik uwzględniony w rankingu 10 najlepszych czasów.' : 'Przeglądarka nie pozwoliła zapisać wyniku. Włącz pamięć lokalną, aby zachować kolejne czasy.'}`;
    byId('overlay-action').textContent = 'Zagraj jeszcze raz';
    setStatus(saved ? 'Plansza ukończona. Świetna robota!' : 'Gra ukończona. Nie udało się zapisać wyniku w pamięci przeglądarki.');
    byId('overlay-action').focus();
  } else if (!game.pairs.length) {
    setStatus('Brak dostępnych par. Przetasuj pozostałe płytki bez kary czasowej.');
  } else if (result.type === 'mismatch') {
    setStatus('Te symbole nie tworzą pary. Wybrano nową płytkę.');
  } else if (result.type === 'selected') {
    setStatus('Znajdź drugą wolną płytkę z tym samym symbolem.');
  } else if (result.type === 'removed') {
    setStatus(`Para usunięta. Pozostało płytek: ${game.tiles.length}.`);
    board.focusFirstFree();
  } else {
    setStatus('Łącz wolne płytki w pary.');
  }
}

function startNewGame() {
  game.newGame();
  hintedIds = [];
  board.create(game.tiles);
  render();
  setStatus('Wybierz pierwszą płytkę, aby rozpocząć pomiar czasu.');
}

function togglePause() {
  if (isDialogOpen()) return;
  if (game.status === 'paused') {
    game.resume();
    render();
    board.focusFirstFree();
    setStatus('Gra wznowiona. Powodzenia!');
  } else if (game.pause()) {
    render();
    byId('overlay-action').focus();
    setStatus('Pauza. Pomiar czasu jest wstrzymany.');
  }
}

function showDialog(dialog) {
  if (!isDialogOpen()) resumeAfterDialog = game.pause();
  render();
  dialog.showModal();
  byId('panel-button').setAttribute('aria-expanded', String(sidebarDialog.open));
}

function finishDialog() {
  byId('panel-button').setAttribute('aria-expanded', String(sidebarDialog.open));
  if (isDialogOpen()) return;
  if (resumeAfterDialog && !document.hidden) game.resume();
  resumeAfterDialog = false;
  render();
}

byId('hint-button').addEventListener('click', () => {
  hintedIds = game.hint() ?? [];
  render();
  setStatus(hintedIds.length ? 'Wyróżniono dostępną parę. Do czasu dodano 30 sekund.' : 'Brak dostępnych par. Przetasuj płytki bez kary.');
});

byId('shuffle-button').addEventListener('click', () => {
  const result = game.shuffle();
  if (!result) return;
  hintedIds = [];
  board.create(game.tiles);
  render();
  setStatus(result.penaltyMs ? 'Płytki przetasowane. Do czasu dodano 30 sekund.' : 'Płytki przetasowane bez kary czasowej.');
});

byId('pause-button').addEventListener('click', togglePause);
byId('overlay-action').addEventListener('click', () => game.status === 'won' ? startNewGame() : togglePause());
byId('new-game-button').addEventListener('click', () => ['running', 'paused'].includes(game.status) ? showDialog(newGameDialog) : startNewGame());
byId('cancel-new-game').addEventListener('click', () => newGameDialog.close());
byId('confirm-new-game').addEventListener('click', () => {
  resumeAfterDialog = false;
  newGameDialog.close();
  startNewGame();
});

byId('panel-button').addEventListener('click', () => showDialog(sidebarDialog));
byId('close-panel-button').addEventListener('click', () => sidebarDialog.close());
sidebarDialog.addEventListener('click', event => {
  const bounds = sidebarDialog.getBoundingClientRect();
  if (event.target === sidebarDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) sidebarDialog.close();
});
byId('more-rules-button').addEventListener('click', () => showDialog(rulesDialog));
for (const button of document.querySelectorAll('[data-close-dialog]')) button.addEventListener('click', () => rulesDialog.close());
for (const dialog of dialogs) dialog.addEventListener('close', finishDialog);

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !isDialogOpen()) {
    event.preventDefault();
    togglePause();
  }
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) return;
  resumeAfterDialog = false;
  if (game.pause()) {
    render();
    setStatus('Gra została automatycznie wstrzymana po zmianie karty.');
  }
});
window.addEventListener('storage', event => {
  if (event.key === BEST_TIMES_KEY || event.key === null) renderRanking(byId('ranking-content'), repository.read());
});
setInterval(() => {
  if (game.status === 'running') byId('timer').textContent = formatTime(game.elapsedMs);
}, 100);

board.create(game.tiles);
render();
renderRanking(byId('ranking-content'), repository.read());
setupPwaView(byId('pwa-panel'));
