import { tileSvg, tileLabel } from './tile-art.js';

export class BoardView {
  constructor(element, onSelect) {
    this.element = element;
    this.buttons = new Map();
    element.addEventListener('click', event => {
      const button = event.target.closest('[data-tile-id]');
      if (button && !button.disabled) onSelect(Number(button.dataset.tileId));
    });
  }

  create(tiles) {
    this.buttons.clear();
    const fragment = document.createDocumentFragment();
    for (const tile of tiles) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tile';
      button.dataset.tileId = tile.id;
      button.setAttribute('aria-label', tileLabel(tile.face));
      button.title = tileLabel(tile.face);
      button.innerHTML = tileSvg(tile.face);
      button.style.left = `${((61 + tile.x * 51 - tile.z * 4) / 784) * 100}%`;
      button.style.top = `${((8 + tile.y * 67 - tile.z * 5) / 552) * 100}%`;
      button.style.zIndex = tile.z * 100 + Math.floor(tile.y * 2);
      this.buttons.set(tile.id, button);
      fragment.append(button);
    }
    this.element.replaceChildren(fragment);
  }

  update(game, hintedIds = []) {
    const remaining = new Set(game.tiles.map(tile => tile.id));
    const free = new Set(game.freeTiles.map(tile => tile.id));
    for (const [id, button] of this.buttons) {
      button.hidden = !remaining.has(id);
      button.disabled = !free.has(id) || game.status === 'paused' || game.status === 'won';
      button.classList.toggle('is-free', free.has(id));
      button.classList.toggle('is-selected', game.selectedId === id);
      button.classList.toggle('is-hinted', hintedIds.includes(id));
      button.setAttribute('aria-pressed', String(game.selectedId === id));
    }
    this.element.inert = game.status === 'paused' || game.status === 'won';
  }

  focusFirstFree() {
    const button = [...this.buttons.values()].find(item => !item.disabled && !item.hidden);
    button?.focus({ preventScroll: true });
  }
}
