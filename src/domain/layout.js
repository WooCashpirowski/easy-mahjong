export function createTurtleLayout() {
  const positions = [];
  const add = (x, y, z) => positions.push({ id: positions.length, x, y, z });
  const rows = [[0, 12], [2, 8], [1, 10], [0, 12], [0, 12], [1, 10], [2, 8], [0, 12]];

  rows.forEach(([start, length], y) => {
    for (let x = start; x < start + length; x++) add(x, y, 0);
  });
  add(-1, 3.5, 0);
  add(12, 3.5, 0);
  add(13, 3.5, 0);

  for (let z = 1; z <= 3; z++) {
    for (let y = z; y < 8 - z; y++) {
      for (let x = z + 2; x < 10 - z; x++) add(x, y, z);
    }
  }
  add(5.5, 3.5, 4);
  return positions;
}

export function isFree(tile, tiles) {
  let left = false;
  let right = false;
  for (const other of tiles) {
    if (other.id === tile.id) continue;
    const overlapsRow = Math.abs(other.y - tile.y) < 1;
    if (other.z > tile.z && overlapsRow && Math.abs(other.x - tile.x) < 1) return false;
    if (other.z !== tile.z || !overlapsRow) continue;
    if (other.x === tile.x - 1) left = true;
    if (other.x === tile.x + 1) right = true;
    if (left && right) return false;
  }
  return true;
}

export function getFreeTiles(tiles) {
  return tiles.filter(tile => isFree(tile, tiles));
}
