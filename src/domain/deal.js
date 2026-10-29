import { createTurtleLayout, getFreeTiles } from './layout.js';
import { createFaces, matchKey } from './tiles.js';

function shuffled(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pairFaces(faces, random) {
  const groups = new Map();
  for (const face of faces) {
    const key = matchKey(face);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(face);
  }
  const pairs = [];
  for (const group of groups.values()) {
    if (group.length % 2) throw new Error('Nieparzysta liczba pasujących płytek.');
    const randomized = shuffled(group, random);
    for (let i = 0; i < randomized.length; i += 2) pairs.push([randomized[i], randomized[i + 1]]);
  }
  return shuffled(pairs, random);
}

function removalOrder(positions, random) {
  for (let attempt = 0; attempt < 100; attempt++) {
    let remaining = [...positions];
    const order = [];
    while (remaining.length) {
      const free = getFreeTiles(remaining);
      if (free.length < 2) break;
      const first = free.splice(Math.floor(random() * free.length), 1)[0];
      const second = free[Math.floor(random() * free.length)];
      order.push([first.id, second.id]);
      remaining = remaining.filter(tile => tile.id !== first.id && tile.id !== second.id);
    }
    if (!remaining.length) return order;
  }
  return null;
}

export function createSolvableDeal({ positions = createTurtleLayout(), faces = createFaces(), random = Math.random } = {}) {
  if (positions.length !== faces.length) throw new Error('Liczba pozycji i płytek musi być równa.');
  const pairs = pairFaces(faces, random);
  let layout = positions;
  let solution = removalOrder(layout, random);
  if (!solution) {
    layout = createTurtleLayout().slice(0, positions.length).map((position, index) => ({ ...position, id: positions[index].id }));
    solution = removalOrder(layout, random);
  }
  if (!solution) throw new Error('Nie udało się przygotować rozwiązywalnego rozdania.');
  const assignedFaces = new Map();
  solution.forEach(([first, second], index) => {
    assignedFaces.set(first, pairs[index][0]);
    assignedFaces.set(second, pairs[index][1]);
  });
  return { tiles: layout.map(position => ({ ...position, face: assignedFaces.get(position.id) })), solution };
}
