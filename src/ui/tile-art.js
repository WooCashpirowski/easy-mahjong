import { GLYPHS } from './glyphs/characters.js';

const INK = '#17231b';
const GREEN = '#17552c';
const SEASON_GREEN = '#2b7a43';
const RED = '#b91e29';
const GOLD = '#a87412';
const PAPER = '#f9faf4';
const NUMERALS = ['一', '二', '三', '四', '伍', '六', '七', '八', '九'];
const HONORS = {
  east: { glyph: '東', color: RED, label: 'Wiatr wschodni' },
  south: { glyph: '南', color: RED, label: 'Wiatr południowy' },
  west: { glyph: '西', color: RED, label: 'Wiatr zachodni' },
  north: { glyph: '北', color: RED, label: 'Wiatr północny' },
  red: { glyph: '中', color: RED, label: 'Czerwony smok' },
  green: { glyph: '發', color: GREEN, label: 'Zielony smok' },
  white: { label: 'Biały smok' },
};
const FLOWERS = ['梅', '蘭', '菊', '竹'];
const SEASON_GLYPHS = ['春', '夏', '秋', '冬'];
const SEASONS = ['Wiosna', 'Lato', 'Jesień', 'Zima'];
const DOT_POSITIONS = {
  2: [[24, 19], [24, 46]],
  3: [[12, 17], [24, 33], [36, 49]],
  4: [[13, 19], [35, 19], [13, 47], [35, 47]],
  5: [[13, 17], [35, 17], [24, 33], [13, 49], [35, 49]],
  6: [[13, 16], [35, 16], [13, 33], [35, 33], [13, 50], [35, 50]],
  7: [[11, 10], [24, 21], [37, 32], [13, 43], [35, 43], [13, 55], [35, 55]],
  8: [[13, 12], [35, 12], [13, 25], [35, 25], [13, 39], [35, 39], [13, 52], [35, 52]],
  9: [[10, 16], [24, 16], [38, 16], [10, 33], [24, 33], [38, 33], [10, 50], [24, 50], [38, 50]],
};
const BAMBOO_POSITIONS = {
  2: [[24, 18], [24, 46]],
  3: [[24, 16], [13, 47], [35, 47]],
  4: [[13, 18], [35, 18], [13, 46], [35, 46]],
  5: [[12, 13], [36, 13], [24, 32], [12, 51], [36, 51]],
  6: [[11, 18], [24, 18], [37, 18], [11, 46], [24, 46], [37, 46]],
  7: [[24, 11], [11, 32], [24, 32], [37, 32], [11, 53], [24, 53], [37, 53]],
  9: [[11, 12], [24, 12], [37, 12], [11, 32], [24, 32], [37, 32], [11, 52], [24, 52], [37, 52]],
};

function glyph(character, x, y, width, height, color) {
  const { box, path } = GLYPHS[character];
  return `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${box}" fill="${color}"><path d="${path}"/></svg>`;
}

function rosette(x, y, radius, color) {
  const petals = Array.from({ length: 8 }, (_, index) =>
    `<ellipse cx="0" cy="-.48" rx=".15" ry=".3" transform="rotate(${index * 45})"/>`,
  ).join('');
  return `<g transform="translate(${x} ${y}) scale(${radius})"><circle r="1" fill="${color}"/><circle r=".78" fill="none" stroke="${PAPER}" stroke-width=".075"/><g fill="${PAPER}">${petals}</g><circle r=".19" fill="${color}"/><circle r=".1" fill="${PAPER}"/></g>`;
}

function dotColor(value, index) {
  if (value === 3 && index === 1) return RED;
  if (value === 5 && index === 2) return RED;
  if (value === 6 && index >= 2) return RED;
  if (value === 7 && index >= 3) return RED;
  if (value === 9 && index >= 3 && index < 6) return RED;
  return GREEN;
}

function dots(value) {
  if (value === 1) {
    return rosette(24, 33, 19, GREEN) + rosette(24, 33, 9, RED);
  }
  const radius = value === 7 || value === 8 ? 5.6 : 6.3;
  return DOT_POSITIONS[value].map(([x, y], index) => rosette(x, y, radius, dotColor(value, index))).join('');
}

function bambooStick(x, y, color = INK, scale = 1, angle = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})"><path d="M-3-10Q0-12 3-10V-7H1.6V-1Q5 0 1.6 1V7H3V10Q0 12-3 10V7H-1.6V1Q-5 0-1.6-1V-7H-3Z" fill="${PAPER}" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/><path d="M-2-7H2M-2 0H2M-2 7H2" fill="none" stroke="${color}" stroke-width="1.2"/></g>`;
}

function bamboo(value) {
  if (value === 1) return bambooStick(24, 32, INK, 1.9);
  if (value === 8) {
    return [19, 46].map(y =>
      bambooStick(7, y, INK, .9) + bambooStick(18, y, INK, .9, 40) +
      bambooStick(30, y, INK, .9, -40) + bambooStick(41, y, INK, .9),
    ).join('');
  }
  const scale = value >= 7 || value === 5 ? .78 : 1;
  return BAMBOO_POSITIONS[value].map(([x, y], index) => {
    const red = (value === 7 && index === 0) || (value === 9 && index % 3 === 1);
    return bambooStick(x, y, red ? RED : INK, scale);
  }).join('');
}

function characters(value) {
  return glyph(NUMERALS[value - 1], 7, 7, 34, 22, GREEN) + glyph('万', 6, 34, 36, 25, RED);
}

function flower(value) {
  return glyph(FLOWERS[value - 1], 5, 6, 38, 45, GOLD) +
    `<g transform="translate(24 57)" fill="${GOLD}"><path d="M0-4C-4-9-8-3-3 0-8 4-2 8 0 3 3 8 8 3 3 0 8-4 2-8 0-4Z"/><circle r="1.2" fill="${PAPER}"/></g>`;
}

function season(value) {
  return glyph(SEASON_GLYPHS[value - 1], 5, 6, 38, 45, SEASON_GREEN) +
    `<path d="M17 59c0-7 5-9 14-7-1 8-7 10-13 6m0 1 9-5" fill="none" stroke="${SEASON_GREEN}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function honor(value) {
  if (value === 'white') {
    return `<g fill="none" stroke="${INK}" stroke-width="1.6"><path d="M8 10H40V54H8ZM12 14H36V50H12ZM21 26H27V38H21Z"/><path d="M24 10V14M24 50V54M8 32H12M36 32H40"/></g>`;
  }
  const { glyph: character, color } = HONORS[value];
  return glyph(character, 4, 6, 40, 52, color);
}

const DRAW = { dots, bamboo, characters, flowers: flower, seasons: season, honors: honor };

export function tileSvg(face) {
  return `<svg viewBox="0 0 48 64" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${DRAW[face.suit](face.value)}</svg>`;
}

export function tileLabel(face) {
  if (face.suit === 'honors') return HONORS[face.value].label;
  if (face.suit === 'seasons') return `Pora roku: ${SEASONS[face.value - 1].toLowerCase()}`;
  const suits = { dots: 'Kółka', bamboo: 'Bambusy', characters: 'Znaki', flowers: 'Kwiat' };
  return `${suits[face.suit]} ${face.value}`;
}
