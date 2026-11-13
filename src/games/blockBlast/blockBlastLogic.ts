import { dateKeyToSeed } from '../../services/dailyChallenge';

export const GRID_SIZE = 8;

export type BlockColorKey =
  | 'cyan'
  | 'amber'
  | 'rose'
  | 'emerald'
  | 'violet'
  | 'orange'
  | 'sky';

export interface BlockColorTheme {
  base: string;
  highlight: string;
  border: string;
  particle: string;
}

export const BLOCK_COLORS: Record<BlockColorKey, BlockColorTheme> = {
  cyan: {
    base: '#06B6D4',
    highlight: '#67E8F9',
    border: '#0E7490',
    particle: '#22D3EE',
  },
  amber: {
    base: '#F59E0B',
    highlight: '#FDE68A',
    border: '#B45309',
    particle: '#FBBF24',
  },
  rose: {
    base: '#F43F5E',
    highlight: '#FDA4AF',
    border: '#BE123C',
    particle: '#FB7185',
  },
  emerald: {
    base: '#10B981',
    highlight: '#6EE7B7',
    border: '#047857',
    particle: '#34D399',
  },
  violet: {
    base: '#8B5CF6',
    highlight: '#C4B5FD',
    border: '#5B21B6',
    particle: '#A78BFA',
  },
  orange: {
    base: '#F97316',
    highlight: '#FDBA74',
    border: '#C2410C',
    particle: '#FB923C',
  },
  sky: {
    base: '#3B82F6',
    highlight: '#93C5FD',
    border: '#1D4ED8',
    particle: '#60A5FA',
  },
};

const COLOR_KEYS = Object.keys(BLOCK_COLORS) as BlockColorKey[];

export type GemVariant = 'cyan' | 'ruby' | 'emerald' | 'amber';

export interface GridCell {
  color: BlockColorKey;
  gem?: GemVariant;
}

export type BlockGrid = (GridCell | null)[][];

export interface PolyominoPiece {
  id: string;
  matrix: number[][]; // 1 = filled, 0 = empty
  color: BlockColorKey;
  weight: number;
}

// 19 balanced polyomino shapes
const SHAPE_TEMPLATES: Array<{ matrix: number[][]; weight: number }> = [
  { matrix: [[1]], weight: 4 },
  { matrix: [[1, 1]], weight: 7 },
  { matrix: [[1], [1]], weight: 7 },
  { matrix: [[1, 1, 1]], weight: 8 },
  { matrix: [[1], [1], [1]], weight: 8 },
  { matrix: [[1, 1], [1, 1]], weight: 9 },
  { matrix: [[1, 1], [1, 0]], weight: 7 },
  { matrix: [[1, 1], [0, 1]], weight: 7 },
  { matrix: [[1, 0], [1, 1]], weight: 7 },
  { matrix: [[0, 1], [1, 1]], weight: 7 },
  { matrix: [[1, 1, 1, 1]], weight: 6 },
  { matrix: [[1], [1], [1], [1]], weight: 6 },
  { matrix: [[1, 1, 1], [0, 1, 0]], weight: 6 },
  { matrix: [[0, 1, 0], [1, 1, 1]], weight: 6 },
  { matrix: [[1, 1, 0], [0, 1, 1]], weight: 5 },
  { matrix: [[0, 1, 1], [1, 1, 0]], weight: 5 },
  { matrix: [[1, 0, 0], [1, 1, 1]], weight: 5 },
  { matrix: [[0, 0, 1], [1, 1, 1]], weight: 5 },
  { matrix: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], weight: 3 },
  { matrix: [[1, 1, 1, 1, 1]], weight: 2 },
  { matrix: [[1], [1], [1], [1], [1]], weight: 2 },
];

export function createEmptyGrid(): BlockGrid {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => null),
  );
}

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export interface AdventureLevelConfig {
  level: number;
  goalType: 'gems' | 'score';
  targetGems: number;
  targetScore: number;
  patternName: string;
  initialGrid: BlockGrid;
}

const PATTERN_NAMES = [
  'Sapphire Cross',
  'Twin Pillars',
  'Diamond Vault',
  'Crown Crest',
  'Diagonal Wave',
  'Fortress Ring',
  'Emerald Steps',
  'Starlight Matrix',
];

const GEM_VARIANTS: GemVariant[] = ['cyan', 'ruby', 'emerald', 'amber'];

export function generateAdventureLevel(level: number): AdventureLevelConfig {
  const rand = seededRandom(level * 7919 + 104729);
  const grid = createEmptyGrid();
  const patternIndex = (level - 1) % PATTERN_NAMES.length;
  const patternName = PATTERN_NAMES[patternIndex];

  // Decide cells based on deterministic symmetrical pattern
  const candidateCoords: Array<[number, number]> = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      let include = false;
      switch (patternIndex) {
        case 0: // Sapphire Cross
          include = (r === 2 || r === 5 || c === 2 || c === 5) && (r + c) % 2 === 0;
          break;
        case 1: // Twin Pillars
          include = (c === 1 || c === 6) && r >= 1 && r <= 6;
          break;
        case 2: // Diamond Vault
          include = Math.abs(r - 3.5) + Math.abs(c - 3.5) === 3 || Math.abs(r - 3.5) + Math.abs(c - 3.5) === 1;
          break;
        case 3: // Crown Crest
          include = (r === 5 && c >= 1 && c <= 6) || (r === 3 && (c === 1 || c === 3 || c === 4 || c === 6)) || (r === 4 && c % 2 === 1);
          break;
        case 4: // Diagonal Wave
          include = (r + c) % 3 === 0 && r > 0 && r < 7;
          break;
        case 5: // Fortress Ring
          include = ((r === 1 || r === 6) && (c >= 1 && c <= 6 && c !== 3 && c !== 4)) || ((c === 1 || c === 6) && (r === 2 || r === 5));
          break;
        case 6: // Emerald Steps
          include = (r === c || r + c === 7) && r >= 1 && r <= 6;
          break;
        default: // Starlight Matrix
          include = (r % 2 === 1 && c % 2 === 1) || (r === 0 && (c === 3 || c === 4));
          break;
      }
      if (include) candidateCoords.push([r, c]);
    }
  }

  // Scale pre-filled density gently with level, keeping rows/cols non-full
  const desiredCount = Math.min(24, Math.max(8, 10 + Math.floor(level * 1.1)));
  // Shuffle candidate coords deterministically
  for (let i = candidateCoords.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [candidateCoords[i], candidateCoords[j]] = [candidateCoords[j], candidateCoords[i]];
  }

  // Also sprinkle extra random cells on higher levels while leaving >= 2 blanks per row/col
  const allCoords: Array<[number, number]> = [...candidateCoords];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!allCoords.some(([ar, ac]) => ar === r && ac === c)) {
        allCoords.push([r, c]);
      }
    }
  }

  const rowCounts = Array(GRID_SIZE).fill(0);
  const colCounts = Array(GRID_SIZE).fill(0);
  const filledCells: Array<[number, number]> = [];
  const paletteOffset = Math.floor(rand() * COLOR_KEYS.length);

  for (const [r, c] of allCoords) {
    if (filledCells.length >= desiredCount) break;
    if (rowCounts[r] >= 5 || colCounts[c] >= 5) continue;
    const color = COLOR_KEYS[(paletteOffset + ((r + c) % 3)) % COLOR_KEYS.length];
    grid[r][c] = { color };
    rowCounts[r]++;
    colCounts[c]++;
    filledCells.push([r, c]);
  }

  const goalType: 'gems' | 'score' = level % 2 === 1 ? 'gems' : 'score';
  const targetGems =
    goalType === 'gems' ? Math.min(filledCells.length, Math.min(10, 3 + Math.floor(level / 2))) : 0;
  const targetScore = 320 + level * 140;

  if (goalType === 'gems') {
    for (let i = 0; i < targetGems; i++) {
      const [r, c] = filledCells[i];
      const cell = grid[r][c];
      if (cell) {
        cell.gem = GEM_VARIANTS[i % GEM_VARIANTS.length];
      }
    }
  }

  return {
    level,
    goalType,
    targetGems,
    targetScore,
    patternName,
    initialGrid: grid,
  };
}

export function generateDailyBlockBlastChallenge(dateKey: string): AdventureLevelConfig {
  const seed = dateKeyToSeed(dateKey, 'block');
  const rand = seededRandom(seed);
  const grid = createEmptyGrid();
  const patternIndex = seed % PATTERN_NAMES.length;
  const patternName = PATTERN_NAMES[patternIndex];

  const candidateCoords: Array<[number, number]> = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      // Symmetrical daily motif plus seeded variations
      const symScore =
        Math.abs(r - 3.5) + Math.abs(c - 3.5) === 2 ||
        (r === c && r >= 1 && r <= 6) ||
        (r + c === 7 && r >= 1 && r <= 6);
      if (symScore || rand() < 0.28) {
        candidateCoords.push([r, c]);
      }
    }
  }

  for (let i = candidateCoords.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [candidateCoords[i], candidateCoords[j]] = [candidateCoords[j], candidateCoords[i]];
  }

  const desiredCount = 14 + (seed % 6); // 14 to 19 pre-filled cells
  const rowCounts = Array(GRID_SIZE).fill(0);
  const colCounts = Array(GRID_SIZE).fill(0);
  const filledCells: Array<[number, number]> = [];
  const paletteOffset = Math.floor(rand() * COLOR_KEYS.length);

  for (const [r, c] of candidateCoords) {
    if (filledCells.length >= desiredCount) break;
    if (rowCounts[r] >= 5 || colCounts[c] >= 5) continue;
    const color = COLOR_KEYS[(paletteOffset + ((r * 2 + c) % 4)) % COLOR_KEYS.length];
    grid[r][c] = { color };
    rowCounts[r]++;
    colCounts[c]++;
    filledCells.push([r, c]);
  }

  const targetGems = Math.min(filledCells.length, 5);
  for (let i = 0; i < targetGems; i++) {
    const [r, c] = filledCells[i];
    const cell = grid[r][c];
    if (cell) {
      cell.gem = GEM_VARIANTS[(seed + i) % GEM_VARIANTS.length];
    }
  }

  return {
    level: 1,
    goalType: 'gems',
    targetGems,
    targetScore: 500,
    patternName: `Daily · ${patternName}`,
    initialGrid: grid,
  };
}

export function canPlacePiece(
  grid: BlockGrid,
  piece: PolyominoPiece,
  startRow: number,
  startCol: number,
): boolean {
  const rows = piece.matrix.length;
  const cols = piece.matrix[0].length;
  if (startRow < 0 || startCol < 0 || startRow + rows > GRID_SIZE || startCol + cols > GRID_SIZE) {
    return false;
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (piece.matrix[r][c] === 1 && grid[startRow + r][startCol + c] !== null) {
        return false;
      }
    }
  }
  return true;
}

export function canPieceFitAnywhere(grid: BlockGrid, piece: PolyominoPiece): boolean {
  const rows = piece.matrix.length;
  const cols = piece.matrix[0].length;
  for (let r = 0; r <= GRID_SIZE - rows; r++) {
    for (let c = 0; c <= GRID_SIZE - cols; c++) {
      if (canPlacePiece(grid, piece, r, c)) {
        return true;
      }
    }
  }
  return false;
}

export function isTrayGameOver(grid: BlockGrid, tray: Array<PolyominoPiece | null>): boolean {
  const active = tray.filter((p): p is PolyominoPiece => p !== null);
  if (active.length === 0) return false;
  return !active.some((p) => canPieceFitAnywhere(grid, p));
}

let pieceCounter = 0;

function pickWeightedShape(rng: () => number = Math.random): number[][] {
  const totalWeight = SHAPE_TEMPLATES.reduce((acc, s) => acc + s.weight, 0);
  let r = rng() * totalWeight;
  for (const tmpl of SHAPE_TEMPLATES) {
    r -= tmpl.weight;
    if (r <= 0) return tmpl.matrix.map((row) => [...row]);
  }
  return [[1, 1]];
}

export function generateTrayPieces(
  grid: BlockGrid,
  rng: () => number = Math.random,
): PolyominoPiece[] {
  const pieces: PolyominoPiece[] = [];
  for (let i = 0; i < 3; i++) {
    const color = COLOR_KEYS[Math.floor(rng() * COLOR_KEYS.length)];
    pieces.push({
      id: `piece-${Date.now()}-${++pieceCounter}`,
      matrix: pickWeightedShape(rng),
      color,
      weight: 1,
    });
  }

  // Fairness guarantee: if none of the 3 pieces fit, try swapping one with a smaller piece that fits
  if (isTrayGameOver(grid, pieces)) {
    const smallFallbacks = [
      [[1]],
      [[1, 1]],
      [[1], [1]],
      [[1, 1], [1, 0]],
      [[1, 1, 1]],
      [[1], [1], [1]],
    ];
    for (const mat of smallFallbacks) {
      const candidate: PolyominoPiece = {
        id: `piece-${Date.now()}-${++pieceCounter}`,
        matrix: mat,
        color: COLOR_KEYS[Math.floor(rng() * COLOR_KEYS.length)],
        weight: 1,
      };
      if (canPieceFitAnywhere(grid, candidate)) {
        pieces[Math.floor(rng() * 3)] = candidate;
        break;
      }
    }
  }

  return pieces;
}

export interface ClearPreview {
  rows: number[];
  cols: number[];
}

export function previewLinesToClear(
  grid: BlockGrid,
  piece: PolyominoPiece,
  startRow: number,
  startCol: number,
): ClearPreview {
  if (!canPlacePiece(grid, piece, startRow, startCol)) {
    return { rows: [], cols: [] };
  }
  const rows: number[] = [];
  const cols: number[] = [];
  const pRows = piece.matrix.length;
  const pCols = piece.matrix[0].length;

  const willFill = (r: number, c: number): boolean => {
    if (grid[r][c] !== null) return true;
    const pr = r - startRow;
    const pc = c - startCol;
    return pr >= 0 && pr < pRows && pc >= 0 && pc < pCols && piece.matrix[pr][pc] === 1;
  };

  for (let r = 0; r < GRID_SIZE; r++) {
    let full = true;
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!willFill(r, c)) {
        full = false;
        break;
      }
    }
    if (full) rows.push(r);
  }

  for (let c = 0; c < GRID_SIZE; c++) {
    let full = true;
    for (let r = 0; r < GRID_SIZE; r++) {
      if (!willFill(r, c)) {
        full = false;
        break;
      }
    }
    if (full) cols.push(c);
  }

  return { rows, cols };
}

export interface PlacementResult {
  nextGrid: BlockGrid;
  clearedRows: number[];
  clearedCols: number[];
  clearedCells: Array<{ row: number; col: number; color: BlockColorKey; hadGem: boolean }>;
  gemsCollected: number;
  pointsEarned: number;
}

export function applyPiecePlacement(
  grid: BlockGrid,
  piece: PolyominoPiece,
  startRow: number,
  startCol: number,
  currentStreak: number,
): PlacementResult {
  const nextGrid: BlockGrid = grid.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
  let placedCells = 0;

  for (let r = 0; r < piece.matrix.length; r++) {
    for (let c = 0; c < piece.matrix[0].length; c++) {
      if (piece.matrix[r][c] === 1) {
        nextGrid[startRow + r][startCol + c] = { color: piece.color };
        placedCells++;
      }
    }
  }

  const clearedRows: number[] = [];
  const clearedCols: number[] = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    if (nextGrid[r].every((cell) => cell !== null)) {
      clearedRows.push(r);
    }
  }
  for (let c = 0; c < GRID_SIZE; c++) {
    if (nextGrid.every((row) => row[c] !== null)) {
      clearedCols.push(c);
    }
  }

  const toClearSet = new Set<string>();
  for (const r of clearedRows) {
    for (let c = 0; c < GRID_SIZE; c++) toClearSet.add(`${r},${c}`);
  }
  for (const c of clearedCols) {
    for (let r = 0; r < GRID_SIZE; r++) toClearSet.add(`${r},${c}`);
  }

  const clearedCells: Array<{ row: number; col: number; color: BlockColorKey; hadGem: boolean }> = [];
  let gemsCollected = 0;

  toClearSet.forEach((key) => {
    const [rStr, cStr] = key.split(',');
    const r = Number(rStr);
    const c = Number(cStr);
    const cell = nextGrid[r][c];
    if (cell) {
      const hadGem = Boolean(cell.gem);
      if (hadGem) gemsCollected++;
      clearedCells.push({ row: r, col: c, color: cell.color, hadGem });
      nextGrid[r][c] = null;
    }
  });

  const totalLines = clearedRows.length + clearedCols.length;
  const effectiveCombo = totalLines > 0 ? Math.max(1, currentStreak + totalLines) : 0;
  const lineBonus = totalLines > 0 ? totalLines * 24 * effectiveCombo : 0;
  const gemBonus = gemsCollected * 35;
  const pointsEarned = placedCells * 4 + lineBonus + gemBonus;

  return {
    nextGrid,
    clearedRows,
    clearedCols,
    clearedCells,
    gemsCollected,
    pointsEarned,
  };
}
