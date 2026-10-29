const INK = '#174548';
const RED = '#9e2443';
const BLUE = '#2b4d92';
const GOLD = '#7b461b';
const PAPER = '#f3f5fc';
const NUMERALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
const HONORS = {
  east: { glyph: '東', color: INK, label: 'Wiatr wschodni', mark: 'E' },
  south: { glyph: '南', color: INK, label: 'Wiatr południowy', mark: 'S' },
  west: { glyph: '西', color: INK, label: 'Wiatr zachodni', mark: 'W' },
  north: { glyph: '北', color: INK, label: 'Wiatr północny', mark: 'N' },
  red: { glyph: '中', color: RED, label: 'Czerwony smok', mark: 'R' },
  green: { glyph: '發', color: INK, label: 'Zielony smok', mark: 'G' },
  white: { color: BLUE, label: 'Biały smok', mark: 'W' },
};
const SEASONS = ['Wiosna', 'Lato', 'Jesień', 'Zima'];
const DOT_POSITIONS = {
  2: [[24, 19], [24, 46]],
  3: [[13, 18], [24, 33], [35, 48]],
  4: [[13, 19], [35, 19], [13, 47], [35, 47]],
  5: [[13, 18], [35, 18], [24, 33], [13, 48], [35, 48]],
  6: [[13, 17], [35, 17], [13, 33], [35, 33], [13, 49], [35, 49]],
  7: [[12, 14], [24, 23], [36, 32], [13, 43], [35, 43], [13, 55], [35, 55]],
  8: [[13, 14], [35, 14], [13, 27], [35, 27], [13, 40], [35, 40], [13, 53], [35, 53]],
  9: [[11, 16], [24, 16], [37, 16], [11, 34], [24, 34], [37, 34], [11, 52], [24, 52], [37, 52]],
};

function text(value, x, y, size, color, attributes = '') {
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${attributes}>${value}</text>`;
}

function badge(value, color) {
  return text(value, 3, 10, 9, color, 'class="tile-badge" font-weight="800"');
}

function dots(value) {
  const symbol = value === 1
    ? `<circle cx="24" cy="34" r="17" fill="${BLUE}"/><circle cx="24" cy="34" r="12" fill="${PAPER}"/><circle cx="24" cy="34" r="8" fill="${RED}"/><circle cx="24" cy="34" r="3" fill="${PAPER}"/>`
    : DOT_POSITIONS[value].map(([x, y], i) => {
      const color = value === 5 && i === 2 ? RED : value === 9 ? [BLUE, RED, INK][Math.floor(i / 3)] : value <= 3 ? RED : INK;
      return `<circle cx="${x}" cy="${y}" r="${value > 6 ? 5 : 6.5}" fill="${color}"/><circle cx="${x}" cy="${y}" r="2" fill="${PAPER}"/>`;
    }).join('');
  return badge(value, BLUE) + symbol;
}

function bamboo(value) {
  const symbol = value === 1
    ? `<path d="M16 45c-8-10-6-20 4-25-1-9 9-13 15-7l-6 7c7 9 5 19-6 24l-4 11-3-10Z" fill="${INK}"/><path d="m28 17 10 3-10 2M17 30l9 5-10 5m2 7-7 10m12-13 4 12" fill="none" stroke="${GOLD}" stroke-width="2.5"/><circle cx="29" cy="15" r="1.7" fill="${PAPER}"/>`
    : bambooSticks(value);
  return badge(value, INK) + symbol;
}

function bambooSticks(value) {
  const columns = value <= 3 ? value : value <= 6 ? 2 : 3;
  const rows = Math.ceil(value / columns);
  return Array.from({ length: value }, (_, i) => {
    const x = 24 + ((i % columns) - (columns - 1) / 2) * 13;
    const y = 34 + (Math.floor(i / columns) - (rows - 1) / 2) * 17;
    const color = value === 7 && i === 0 ? RED : INK;
    return `<rect x="${x - 2.8}" y="${y - 7}" width="5.6" height="14" rx="1.7" fill="${color}"/><path d="M${x - 4} ${y - 5}h8m-8 10h8" stroke="${color}" stroke-width="2"/><path d="M${x} ${y - 3}v6" stroke="#b9cbd8" stroke-width="1.2"/>`;
  }).join('');
}

function characters(value) {
  return text(value, 24, 37, 38, RED, 'class="tile-number" text-anchor="middle" font-weight="800"') +
    text(`${NUMERALS[value - 1]}萬`, 24, 57, 16, RED, 'class="tile-glyph" text-anchor="middle" font-weight="700"');
}

function flower(value) {
  const color = [RED, GOLD, BLUE, INK][value - 1];
  const petals = Array.from({ length: 5 }, (_, i) => `<ellipse cx="25" cy="19" rx="4.5" ry="8" fill="${color}" transform="rotate(${i * 72} 25 25)"/>`).join('');
  return badge('KW', color) + `<path d="M24 57q8-20 0-33M24 46q-12-1-14-11 11-1 14 11m1-9q13-2 14-11-12 1-14 11" fill="none" stroke="${INK}" stroke-width="2.8"/>${petals}<circle cx="25" cy="25" r="3.5" fill="#f5c183"/>`;
}

function season(value) {
  const drawings = [
    `<path d="M24 55V30m0 12C9 43 8 30 9 26c12-1 17 6 15 16Zm0-8c-2-13 8-18 16-18 2 12-4 19-16 18Z" fill="${INK}" stroke="${INK}" stroke-width="2"/>`,
    `<circle cx="24" cy="34" r="11" fill="${GOLD}"/><path d="M24 13v5m0 32v5M3 34h5m32 0h5M9 19l4 4m22 22 4 4M9 49l4-4m22-22 4-4" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>`,
    `<path d="M13 49C3 29 20 17 39 15c1 22-5 38-25 35Z" fill="${GOLD}"/><path d="m11 56 23-33m-14 21-1-13m6 6 9-1" fill="none" stroke="${PAPER}" stroke-width="2.2"/>`,
    `<path d="M24 13v42M6 24l36 20M6 44l36-20m-24-5 6 6 6-6m-12 30 6-6 6 6M7 31l8-2-1-8m20 26-1-8 8-2M7 37l8 2-1 8m20-26-1 8 8 2" fill="none" stroke="${BLUE}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  ];
  return badge('PR', GOLD) + drawings[value - 1];
}

function honor(value) {
  const { glyph, color, mark } = HONORS[value];
  if (['east', 'south', 'west', 'north'].includes(value)) {
    return text(mark, 24, 38, 36, color, 'class="tile-number" text-anchor="middle" font-weight="800"') +
      text(glyph, 24, 58, 19, color, 'class="tile-glyph" text-anchor="middle" font-weight="700"');
  }
  const symbol = value === 'white'
    ? `<rect x="9" y="15" width="30" height="34" rx="2" fill="none" stroke="${BLUE}" stroke-width="4"/><rect x="15" y="21" width="18" height="22" rx="1" fill="none" stroke="${BLUE}" stroke-width="1.8"/>`
    : text(glyph, 24, 45, 36, color, `class="tile-glyph" text-anchor="middle" font-weight="700" stroke="${color}" stroke-width=".4"`);
  return badge(mark, color) + symbol + text('SMOK', 24, 60, 6, color, 'class="tile-badge" text-anchor="middle" letter-spacing="1" font-weight="800"');
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
