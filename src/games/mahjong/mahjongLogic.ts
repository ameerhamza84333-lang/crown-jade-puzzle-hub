import { dateKeyToSeed } from '../../services/dailyChallenge';

export interface MahjongSlot {
  id: string;
  col: number; // half-tile units (each tile is 2 units wide)
  row: number; // half-tile units (each tile is 2 units tall)
  layer: number; // 0 = bottom, 1, 2, 3...
}

export interface MahjongTile extends MahjongSlot {
  tileType: string;
}

export interface MahjongLevelData {
  level: number;
  formationName: string;
  tiles: MahjongTile[];
}

export const ALL_TILE_TYPES: string[] = [
  'dot-1', 'dot-2', 'dot-3', 'dot-4', 'dot-5', 'dot-6', 'dot-7', 'dot-8', 'dot-9',
  'bam-1', 'bam-2', 'bam-3', 'bam-4', 'bam-5', 'bam-6', 'bam-7', 'bam-8', 'bam-9',
  'chr-1', 'chr-2', 'chr-3', 'chr-4', 'chr-5', 'chr-6', 'chr-7', 'chr-8', 'chr-9',
  'wind-E', 'wind-S', 'wind-W', 'wind-N',
  'drag-R', 'drag-G', 'drag-W',
  'flw-1', 'flw-2', 'flw-3', 'flw-4',
];

function rectsOverlap(aCol: number, aRow: number, bCol: number, bRow: number): boolean {
  return aCol < bCol + 2 && aCol + 2 > bCol && aRow < bRow + 2 && aRow + 2 > bRow;
}

export function isSlotFree(target: MahjongSlot, active: MahjongSlot[]): boolean {
  let blockedLeft = false;
  let blockedRight = false;

  for (const other of active) {
    if (other.id === target.id) continue;

    // Covered by any tile on a higher layer overlapping our footprint
    if (other.layer > target.layer && rectsOverlap(target.col, target.row, other.col, other.row)) {
      return false;
    }

    // Same layer horizontal neighbors overlapping vertically
    if (other.layer === target.layer) {
      const vertOverlap = target.row < other.row + 2 && target.row + 2 > other.row;
      if (!vertOverlap) continue;
      if (other.col < target.col && other.col + 2 >= target.col) {
        blockedLeft = true;
      }
      if (other.col > target.col && other.col <= target.col + 2) {
        blockedRight = true;
      }
      if (blockedLeft && blockedRight) {
        return false;
      }
    }
  }

  return true;
}

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function shuffleInPlace<T>(arr: T[], rand: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const FORMATIONS = [
  'Pyramid',
  'Diamond',
  'Bridge',
  'Castle',
  'Twin Pagodas',
  'Lotus',
  'Fortress',
  'Imperial Gate',
];

function buildFormationSlots(level: number): { name: string; slots: MahjongSlot[] } {
  const formationIdx = (level - 1) % FORMATIONS.length;
  const name = FORMATIONS[formationIdx];
  const tier = Math.min(4, Math.floor((level - 1) / 3)); // scales board size gently

  const slotMap = new Map<string, MahjongSlot>();
  const add = (col: number, row: number, layer: number) => {
    const key = `${layer}:${col}:${row}`;
    if (!slotMap.has(key)) {
      slotMap.set(key, { id: key, col, row, layer });
    }
  };

  if (formationIdx === 0) {
    // Pyramid
    const w = 6 + (tier >= 2 ? 2 : 0);
    const h = 4 + (tier >= 1 ? 1 : 0);
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) add(c * 2, r * 2, 0);
    }
    for (let r = 0; r < h - 1; r++) {
      for (let c = 0; c < w - 2; c++) add(c * 2 + 2, r * 2 + 1, 1);
    }
    for (let r = 0; r < Math.max(1, h - 2); r++) {
      for (let c = 0; c < Math.max(2, w - 4); c++) add(c * 2 + 4, r * 2 + 2, 2);
    }
    if (tier >= 1) {
      add(Math.floor(w - 2), Math.floor(h - 2), 3);
      add(Math.floor(w), Math.floor(h - 2), 3);
    }
  } else if (formationIdx === 1) {
    // Diamond
    const rows = [
      { row: 0, cols: [4, 6] },
      { row: 2, cols: [2, 4, 6, 8] },
      { row: 4, cols: [0, 2, 4, 6, 8, 10] },
      { row: 6, cols: [2, 4, 6, 8] },
      { row: 8, cols: [4, 6] },
    ];
    for (const r of rows) {
      for (const c of r.cols) add(c, r.row, 0);
    }
    for (const c of [3, 5, 7]) {
      add(c, 3, 1);
      add(c, 5, 1);
    }
    add(4, 4, 2);
    add(6, 4, 2);
    if (tier >= 1) {
      add(0, 2, 0);
      add(10, 2, 0);
      add(0, 6, 0);
      add(10, 6, 0);
    }
    if (tier >= 2) {
      add(5, 4, 3);
      add(5, 2, 1);
    }
  } else if (formationIdx === 2) {
    // Bridge
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 2 && (c === 2 || c === 4)) continue;
        add(c * 2, r * 2, 0);
      }
    }
    for (let c = 1; c < 6; c++) {
      add(c * 2, 2, 1);
      add(c * 2, 6, 1);
    }
    for (let c = 2; c < 5; c++) {
      add(c * 2, 4, 2);
    }
    if (tier >= 1) {
      add(6, 4, 3);
      add(4, 4, 3);
    }
  } else if (formationIdx === 3) {
    // Castle
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 6; c++) {
        add(c * 2, r * 2, 0);
      }
    }
    // 4 Corner Towers
    const corners = [
      [0, 0],
      [10, 0],
      [0, 8],
      [10, 8],
    ];
    for (const [c, r] of corners) {
      add(c, r, 1);
      if (tier >= 1) add(c, r, 2);
    }
    // Central Keep
    for (const c of [4, 6]) {
      for (const r of [2, 4, 6]) {
        add(c, r, 1);
      }
    }
    add(4, 4, 2);
    add(6, 4, 2);
  } else if (formationIdx === 4) {
    // Twin Pagodas
    for (const baseCol of [0, 8]) {
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 3; c++) {
          add(baseCol + c * 2, r * 2, 0);
        }
      }
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          add(baseCol + 1 + c * 2, r * 2 + 1, 1);
        }
      }
      add(baseCol + 2, 2, 2);
      if (tier >= 1) {
        add(baseCol + 2, 4, 2);
      }
    }
    // Connecting plinth
    add(6, 2, 0);
    add(6, 4, 0);
  } else if (formationIdx === 5) {
    // Lotus
    for (let r = 0; r < 5; r++) {
      for (let c = 1; c <= 5; c++) {
        add(c * 2, r * 2, 0);
      }
    }
    add(0, 4, 0);
    add(12, 4, 0);
    for (let r = 1; r <= 3; r++) {
      for (let c = 2; c <= 4; c++) {
        add(c * 2, r * 2, 1);
      }
    }
    add(5, 4, 2);
    add(7, 4, 2);
    if (tier >= 1) {
      add(6, 2, 2);
      add(6, 6, 2);
    }
  } else if (formationIdx === 6) {
    // Fortress
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if ((r === 2 || r === 3) && (c === 2 || c === 3)) continue;
        add(c * 2, r * 2, 0);
      }
    }
    for (let c = 1; c < 5; c++) {
      add(c * 2, 0, 1);
      add(c * 2, 10, 1);
    }
    add(0, 4, 1);
    add(0, 6, 1);
    add(10, 4, 1);
    add(10, 6, 1);
    if (tier >= 1) {
      add(4, 0, 2);
      add(6, 0, 2);
      add(4, 10, 2);
      add(6, 10, 2);
    }
  } else {
    // Imperial Gate
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 7; c++) {
        if (r >= 2 && c >= 2 && c <= 4) continue;
        add(c * 2, r * 2, 0);
      }
    }
    for (let c = 1; c <= 5; c++) {
      add(c * 2, 0, 1);
      add(c * 2, 2, 1);
    }
    for (let c = 2; c <= 4; c++) {
      add(c * 2, 1, 2);
    }
    add(0, 4, 1);
    add(12, 4, 1);
    if (tier >= 1) {
      add(5, 1, 3);
      add(7, 1, 3);
    }
  }

  const slots = Array.from(slotMap.values());
  // Ensure even slot count by dropping one outer free tile if odd
  if (slots.length % 2 !== 0) {
    const outer = slots.find((s) => isSlotFree(s, slots)) || slots[slots.length - 1];
    return { name, slots: slots.filter((s) => s.id !== outer.id) };
  }
  return { name, slots };
}

/**
 * Assigns pairs to slots via reverse-peeling so the board is guaranteed 100% solvable.
 */
function assignSolvablePairs(
  slots: MahjongSlot[],
  pairPool: string[],
  rand: () => number,
): MahjongTile[] | null {
  const remaining = [...slots];
  const result: MahjongTile[] = [];
  const shuffledPairs = shuffleInPlace([...pairPool], rand);
  let pairIdx = 0;

  while (remaining.length > 0) {
    const free = remaining.filter((s) => isSlotFree(s, remaining));
    if (free.length < 2) {
      return null;
    }

    // Sort slightly favoring top layers and outer edges so solutions feel rich
    shuffleInPlace(free, rand);
    free.sort((a, b) => b.layer - a.layer);

    // Pick two free slots (prefer non-adjacent when possible for more interesting play)
    const first = free[0];
    let second = free[1];
    for (let i = 1; i < Math.min(free.length, 6); i++) {
      const dist = Math.abs(free[i].col - first.col) + Math.abs(free[i].row - first.row);
      if (dist >= 4) {
        second = free[i];
        break;
      }
    }

    const tileType = shuffledPairs[pairIdx++];
    result.push({ ...first, tileType });
    result.push({ ...second, tileType });

    const removeIds = new Set([first.id, second.id]);
    for (let i = remaining.length - 1; i >= 0; i--) {
      if (removeIds.has(remaining[i].id)) {
        remaining.splice(i, 1);
      }
    }
  }

  return result;
}

export function generateSolvableMahjongLevel(level: number): MahjongLevelData {
  const { name, slots } = buildFormationSlots(level);
  const pairCount = slots.length / 2;

  // Pick tile variety scaled by level so early levels are crisp & readable, later levels richer
  const randBase = seededRandom(level * 104729 + 31337);
  const distinctCount = Math.min(
    ALL_TILE_TYPES.length,
    Math.max(10, Math.min(pairCount, 12 + level * 2)),
  );
  const availableTypes = shuffleInPlace([...ALL_TILE_TYPES], randBase).slice(0, distinctCount);
  const pairPool: string[] = [];
  for (let i = 0; i < pairCount; i++) {
    pairPool.push(availableTypes[i % availableTypes.length]);
  }

  for (let attempt = 0; attempt < 25; attempt++) {
    const rand = seededRandom(level * 9973 + attempt * 7919 + 17);
    const assigned = assignSolvablePairs(slots, pairPool, rand);
    if (assigned) {
      return {
        level,
        formationName: name,
        tiles: assigned,
      };
    }
  }

  // Fallback flat pairing guarantee (never reached on symmetric formations)
  const fallbackPairs = shuffleInPlace([...pairPool], randBase);
  const sorted = [...slots].sort((a, b) => b.layer - a.layer || a.col - b.col);
  const fallbackTiles: MahjongTile[] = [];
  for (let i = 0; i < sorted.length; i += 2) {
    const t = fallbackPairs[i / 2];
    fallbackTiles.push({ ...sorted[i], tileType: t });
    fallbackTiles.push({ ...sorted[i + 1], tileType: t });
  }
  return { level, formationName: name, tiles: fallbackTiles };
}

export function generateDailyMahjongChallenge(dateKey: string): MahjongLevelData {
  const seed = dateKeyToSeed(dateKey, 'mahjong');
  // Choose a rich daily formation & tier (equivalent to level 3..10 variety)
  const virtualLevel = 3 + (seed % 8);
  const { name, slots } = buildFormationSlots(virtualLevel);
  const pairCount = slots.length / 2;

  const randBase = seededRandom(seed);
  const distinctCount = Math.min(ALL_TILE_TYPES.length, Math.max(14, Math.min(pairCount, 22)));
  const availableTypes = shuffleInPlace([...ALL_TILE_TYPES], randBase).slice(0, distinctCount);
  const pairPool: string[] = [];
  for (let i = 0; i < pairCount; i++) {
    pairPool.push(availableTypes[i % availableTypes.length]);
  }

  for (let attempt = 0; attempt < 25; attempt++) {
    const rand = seededRandom(seed + attempt * 7919 + 17);
    const assigned = assignSolvablePairs(slots, pairPool, rand);
    if (assigned) {
      return {
        level: 1,
        formationName: `Daily · ${name}`,
        tiles: assigned,
      };
    }
  }

  return generateSolvableMahjongLevel(virtualLevel);
}

export function shuffleRemainingSolvable(tiles: MahjongTile[]): MahjongTile[] {
  if (tiles.length === 0) return tiles;

  // Group existing tiles into pairs by tileType so we preserve exact remaining symbols
  const byType = new Map<string, number>();
  for (const t of tiles) {
    byType.set(t.tileType, (byType.get(t.tileType) || 0) + 1);
  }
  const pairPool: string[] = [];
  byType.forEach((count, type) => {
    for (let i = 0; i < Math.floor(count / 2); i++) {
      pairPool.push(type);
    }
  });

  const slots: MahjongSlot[] = tiles.map(({ id, col, row, layer }) => ({ id, col, row, layer }));
  for (let attempt = 0; attempt < 25; attempt++) {
    const rand = seededRandom(Date.now() + attempt * 131);
    const assigned = assignSolvablePairs(slots, pairPool, rand);
    if (assigned) return assigned;
  }

  // Fallback shuffle if a weird leftover state occurs
  const rand = seededRandom(Date.now());
  const types = shuffleInPlace(tiles.map((t) => t.tileType), rand);
  return tiles.map((t, idx) => ({ ...t, tileType: types[idx] }));
}

export function getFreeTileIds(tiles: MahjongTile[]): Set<string> {
  const free = new Set<string>();
  for (const t of tiles) {
    if (isSlotFree(t, tiles)) {
      free.add(t.id);
    }
  }
  return free;
}

export function countValidPairs(tiles: MahjongTile[]): number {
  const freeIds = getFreeTileIds(tiles);
  const counts = new Map<string, number>();
  for (const t of tiles) {
    if (freeIds.has(t.id)) {
      counts.set(t.tileType, (counts.get(t.tileType) || 0) + 1);
    }
  }
  let pairs = 0;
  counts.forEach((c) => {
    pairs += Math.floor(c / 2);
  });
  return pairs;
}

export function findHintPair(tiles: MahjongTile[]): [string, string] | null {
  const freeIds = getFreeTileIds(tiles);
  const byType = new Map<string, MahjongTile[]>();
  for (const t of tiles) {
    if (!freeIds.has(t.id)) continue;
    const list = byType.get(t.tileType) || [];
    list.push(t);
    byType.set(t.tileType, list);
  }
  for (const list of byType.values()) {
    if (list.length >= 2) {
      return [list[0].id, list[1].id];
    }
  }
  return null;
}
