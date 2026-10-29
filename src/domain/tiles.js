const SUITS = ['dots', 'bamboo', 'characters'];
const HONORS = ['east', 'south', 'west', 'north', 'red', 'green', 'white'];

export function createFaces() {
  const faces = [];
  for (const suit of SUITS) {
    for (let value = 1; value <= 9; value++) {
      for (let copy = 0; copy < 4; copy++) faces.push({ suit, value });
    }
  }
  for (const value of HONORS) {
    for (let copy = 0; copy < 4; copy++) faces.push({ suit: 'honors', value });
  }
  for (const suit of ['flowers', 'seasons']) {
    for (let value = 1; value <= 4; value++) faces.push({ suit, value });
  }
  return faces;
}

export function matchKey(face) {
  return ['flowers', 'seasons'].includes(face.suit) ? face.suit : `${face.suit}:${face.value}`;
}

export function matches(first, second) {
  return matchKey(first.face) === matchKey(second.face);
}

export function getMatchingPairs(freeTiles) {
  const groups = new Map();
  for (const tile of freeTiles) {
    const key = matchKey(tile.face);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(tile);
  }
  const pairs = [];
  for (const group of groups.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) pairs.push([group[i], group[j]]);
    }
  }
  return pairs;
}
