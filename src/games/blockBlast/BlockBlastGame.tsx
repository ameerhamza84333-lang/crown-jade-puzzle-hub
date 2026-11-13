import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Crown, RotateCcw, Settings, Sparkles } from 'lucide-react';
import {
  AdventureLevelConfig,
  BLOCK_COLORS,
  BlockColorKey,
  BlockGrid,
  GRID_SIZE,
  PolyominoPiece,
  applyPiecePlacement,
  canPlacePiece,
  createEmptyGrid,
  generateAdventureLevel,
  generateDailyBlockBlastChallenge,
  generateTrayPieces,
  isTrayGameOver,
  previewLinesToClear,
} from './blockBlastLogic';
import { CrownIcon, GemIcon, StarIcon } from '../../components/SvgAssets';
import { BannerAdSlot } from '../../components/BannerAdSlot';
import { SoundFX } from '../../services/sound';
import { AdManager } from '../../services/AdManager.js';
import { DAILY_BOOSTER_REWARD, formatDailyDisplayDate } from '../../services/dailyChallenge';

interface BlockBlastGameProps {
  initialMode: 'adventure' | 'endless';
  adventureLevel: number;
  adventureHighScore: number;
  classicHighScore: number;
  dailyDateKey?: string;
  isDailyCompleted?: boolean;
  onCompleteDaily?: (dateKey: string) => void;
  onUpdateProgress: (patch: {
    adventureLevel?: number;
    adventureHighScore?: number;
    classicHighScore?: number;
    lastMode?: 'adventure' | 'endless';
  }) => void;
  onOpenSettings: () => void;
  onBackHome: () => void;
}

interface DragState {
  trayIndex: number;
  piece: PolyominoPiece;
  pointerX: number;
  pointerY: number;
  offsetY: number;
  targetRow: number | null;
  targetCol: number | null;
}

interface FloatingBanner {
  id: number;
  text: string;
  subtext?: string;
  xPercent: number;
  yPercent: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  vRot: number;
  life: number;
  maxLife: number;
}

const PieceMatrixView: React.FC<{
  piece: PolyominoPiece;
  cellSize: number;
  gap?: number;
  dimmed?: boolean;
}> = ({ piece, cellSize, gap = 2, dimmed = false }) => {
  const theme = BLOCK_COLORS[piece.color];
  const rows = piece.matrix.length;
  const cols = piece.matrix[0].length;
  const width = cols * cellSize + (cols - 1) * gap;
  const height = rows * cellSize + (rows - 1) * gap;

  return (
    <div
      className={`relative select-none ${dimmed ? 'opacity-35' : ''}`}
      style={{ width, height }}
    >
      {piece.matrix.map((row, r) =>
        row.map((val, c) =>
          val === 1 ? (
            <div
              key={`${r}-${c}`}
              className="absolute rounded-[4px] shadow-sm"
              style={{
                left: c * (cellSize + gap),
                top: r * (cellSize + gap),
                width: cellSize,
                height: cellSize,
                background: `linear-gradient(155deg, ${theme.highlight} 0%, ${theme.base} 52%, ${theme.border} 100%)`,
                border: `1px solid ${theme.highlight}`,
              }}
            >
              <div
                className="mx-[14%] mt-[12%] h-[22%] rounded-sm opacity-55"
                style={{ backgroundColor: '#FFFFFF' }}
              />
            </div>
          ) : null,
        ),
      )}
    </div>
  );
};

export const BlockBlastGame: React.FC<BlockBlastGameProps> = ({
  initialMode,
  adventureLevel,
  adventureHighScore,
  classicHighScore,
  dailyDateKey,
  isDailyCompleted = false,
  onCompleteDaily,
  onUpdateProgress,
  onOpenSettings,
  onBackHome,
}) => {
  const isDaily = Boolean(dailyDateKey);
  const [mode, setMode] = useState<'adventure' | 'endless'>(isDaily ? 'adventure' : initialMode);
  const [levelConfig, setLevelConfig] = useState<AdventureLevelConfig>(() =>
    dailyDateKey
      ? generateDailyBlockBlastChallenge(dailyDateKey)
      : generateAdventureLevel(adventureLevel),
  );
  const [grid, setGrid] = useState<BlockGrid>(() => {
    if (dailyDateKey) {
      return generateDailyBlockBlastChallenge(dailyDateKey).initialGrid.map((r) =>
        r.map((c) => (c ? { ...c } : null)),
      );
    }
    return initialMode === 'adventure'
      ? generateAdventureLevel(adventureLevel).initialGrid.map((r) =>
          r.map((c) => (c ? { ...c } : null)),
        )
      : createEmptyGrid();
  });
  const [tray, setTray] = useState<Array<PolyominoPiece | null>>(() => {
    const startGrid = dailyDateKey
      ? generateDailyBlockBlastChallenge(dailyDateKey).initialGrid
      : initialMode === 'adventure'
        ? generateAdventureLevel(adventureLevel).initialGrid
        : createEmptyGrid();
    return generateTrayPieces(startGrid);
  });
  const [score, setScore] = useState(0);
  const [gemsCollected, setGemsCollected] = useState(0);
  const [streak, setStreak] = useState(0);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [floatingBanners, setFloatingBanners] = useState<FloatingBanner[]>([]);
  const [recentlyPlaced, setRecentlyPlaced] = useState<Set<string>>(new Set());
  const [statusModal, setStatusModal] = useState<'none' | 'level_complete' | 'game_over'>('none');
  const [claimedRewardNow, setClaimedRewardNow] = useState(false);

  const stageContainerRef = useRef<HTMLDivElement>(null);
  const trayContainerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const bannerIdRef = useRef(0);

  const [viewport, setViewport] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 390,
    h: typeof window !== 'undefined' ? window.innerHeight : 844,
  }));
  const [boardPx, setBoardPx] = useState(280);
  const [trayBox, setTrayBox] = useState({ w: 100, h: 88 });

  // Track viewport orientation/size for Android portrait vs landscape split
  useEffect(() => {
    const onResize = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isLandscapeCompact = viewport.w >= 560 && viewport.h < 560;
  const isShortPortrait = !isLandscapeCompact && viewport.h < 640;

  // Responsive board sizing strictly bounded to available <main> area (zero overlap!)
  useEffect(() => {
    const el = stageContainerRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      // Account for outer 10px frame padding + safety margin
      const maxDim = Math.floor(Math.min(rect.width - 20, rect.height - 18, 460));
      setBoardPx(Math.max(128, maxDim));
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isLandscapeCompact, isShortPortrait]);

  // Measure individual tray slot size so 5-long / 3x3 pieces never overflow their box
  useEffect(() => {
    const el = trayContainerRef.current;
    if (!el) return;
    const measureTray = () => {
      const rect = el.getBoundingClientRect();
      if (isLandscapeCompact) {
        setTrayBox({
          w: Math.max(64, rect.width - 16),
          h: Math.max(48, (rect.height - 32) / 3),
        });
      } else {
        setTrayBox({
          w: Math.max(64, (rect.width - 36) / 3),
          h: Math.max(52, rect.height - 16),
        });
      }
    };
    measureTray();
    const ro = new ResizeObserver(measureTray);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isLandscapeCompact]);

  const highScore = mode === 'adventure' ? adventureHighScore : classicHighScore;
  const cellPx = boardPx / GRID_SIZE;

  const startLevel = useCallback(
    (targetMode: 'adventure' | 'endless', lvlNum: number) => {
      setStatusModal('none');
      setScore(0);
      setGemsCollected(0);
      setStreak(0);
      setDragState(null);
      setFloatingBanners([]);
      if (dailyDateKey) {
        const cfg = generateDailyBlockBlastChallenge(dailyDateKey);
        setLevelConfig(cfg);
        const cloned = cfg.initialGrid.map((r) => r.map((c) => (c ? { ...c } : null)));
        setGrid(cloned);
        setTray(generateTrayPieces(cloned));
        return;
      }
      setMode(targetMode);
      onUpdateProgress({ lastMode: targetMode });
      if (targetMode === 'adventure') {
        const cfg = generateAdventureLevel(lvlNum);
        setLevelConfig(cfg);
        const cloned = cfg.initialGrid.map((r) => r.map((c) => (c ? { ...c } : null)));
        setGrid(cloned);
        setTray(generateTrayPieces(cloned));
      } else {
        const empty = createEmptyGrid();
        setGrid(empty);
        setTray(generateTrayPieces(empty));
      }
    },
    [dailyDateKey, onUpdateProgress],
  );

  // Sync canvas size to boardPx
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(boardPx * dpr);
    canvas.height = Math.round(boardPx * dpr);
  }, [boardPx]);

  // Particle loop (runs only while particles exist)
  const triggerParticleLoop = useCallback(() => {
    if (animFrameRef.current !== null) return;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const canvas = canvasRef.current;
      if (!canvas) {
        animFrameRef.current = null;
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animFrameRef.current = null;
        return;
      }
      const dpr = canvas.width / Math.max(1, boardPx);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, boardPx, boardPx);

      const alive: Particle[] = [];
      for (const p of particlesRef.current) {
        p.life += dt;
        if (p.life >= p.maxLife) continue;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 420 * dt;
        p.rotation += p.vRot * dt;
        p.alpha = 1 - p.life / p.maxLife;
        alive.push(p);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
      particlesRef.current = alive;
      if (alive.length > 0) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        ctx.clearRect(0, 0, boardPx, boardPx);
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
  }, [boardPx]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const spawnClearParticles = useCallback(
    (cells: Array<{ row: number; col: number; color: BlockColorKey; hadGem: boolean }>) => {
      const size = boardPx / GRID_SIZE;
      for (const cell of cells) {
        const cx = (cell.col + 0.5) * size;
        const cy = (cell.row + 0.5) * size;
        const color = cell.hadGem ? '#FDE047' : BLOCK_COLORS[cell.color].particle;
        const count = cell.hadGem ? 9 : 5;
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 75 + Math.random() * 190;
          particlesRef.current.push({
            x: cx + (Math.random() - 0.5) * size * 0.4,
            y: cy + (Math.random() - 0.5) * size * 0.4,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 60,
            size: 4 + Math.random() * 6,
            color,
            alpha: 1,
            rotation: Math.random() * Math.PI,
            vRot: (Math.random() - 0.5) * 10,
            life: 0,
            maxLife: 0.45 + Math.random() * 0.3,
          });
        }
      }
      triggerParticleLoop();
    },
    [boardPx, triggerParticleLoop],
  );

  const pushBanner = useCallback(
    (text: string, subtext: string | undefined, row: number, col: number) => {
      const id = ++bannerIdRef.current;
      const xPercent = Math.min(82, Math.max(18, ((col + 0.5) / GRID_SIZE) * 100));
      const yPercent = Math.min(82, Math.max(18, ((row + 0.5) / GRID_SIZE) * 100));
      setFloatingBanners((prev) => [...prev, { id, text, subtext, xPercent, yPercent }]);
      window.setTimeout(() => {
        setFloatingBanners((prev) => prev.filter((b) => b.id !== id));
      }, 950);
    },
    [],
  );

  const computeTargetCell = useCallback(
    (piece: PolyominoPiece, pointerX: number, pointerY: number, offsetY: number) => {
      const boardEl = boardRef.current;
      if (!boardEl) return { row: null, col: null };
      const rect = boardEl.getBoundingClientRect();
      const unit = rect.width / GRID_SIZE;
      const pRows = piece.matrix.length;
      const pCols = piece.matrix[0].length;
      const visualTopLeftX = pointerX - (pCols * unit) / 2;
      const visualTopLeftY = pointerY - offsetY - (pRows * unit) / 2;
      const col = Math.round((visualTopLeftX - rect.left) / unit);
      const row = Math.round((visualTopLeftY - rect.top) / unit);
      if (canPlacePiece(grid, piece, row, col)) {
        return { row, col };
      }
      return { row: null, col: null };
    },
    [grid],
  );

  const dragRef = useRef<DragState | null>(null);
  dragRef.current = dragState;
  const isDragging = dragState !== null;

  // Pointer drag listeners on window during active drag (bound once per drag)
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: PointerEvent) => {
      e.preventDefault();
      const prev = dragRef.current;
      if (!prev) return;
      const { row, col } = computeTargetCell(prev.piece, e.clientX, e.clientY, prev.offsetY);
      setDragState({
        ...prev,
        pointerX: e.clientX,
        pointerY: e.clientY,
        targetRow: row,
        targetCol: col,
      });
    };

    const handleUp = (e: PointerEvent) => {
      const current = dragRef.current;
      if (!current) return;
      const { row, col } = computeTargetCell(
        current.piece,
        e.clientX,
        e.clientY,
        current.offsetY,
      );

      setDragState(null);

      if (row === null || col === null) {
        SoundFX.playInvalid();
        return;
      }

      // Commit placement
      const result = applyPiecePlacement(grid, current.piece, row, col, streak);
      const nextScore = score + result.pointsEarned;
      const nextGems = gemsCollected + result.gemsCollected;
      const linesCleared = result.clearedRows.length + result.clearedCols.length;
      const nextStreak = linesCleared > 0 ? streak + linesCleared : 0;

      setGrid(result.nextGrid);
      setScore(nextScore);
      setGemsCollected(nextGems);
      setStreak(nextStreak);

      // Cell pop highlight
      const placedKeys = new Set<string>();
      for (let r = 0; r < current.piece.matrix.length; r++) {
        for (let c = 0; c < current.piece.matrix[0].length; c++) {
          if (current.piece.matrix[r][c] === 1) {
            placedKeys.add(`${row + r},${col + c}`);
          }
        }
      }
      setRecentlyPlaced(placedKeys);
      window.setTimeout(() => setRecentlyPlaced(new Set()), 180);

      // Update high score immediately
      if (mode === 'adventure' && nextScore > adventureHighScore) {
        onUpdateProgress({ adventureHighScore: nextScore });
      } else if (mode === 'endless' && nextScore > classicHighScore) {
        onUpdateProgress({ classicHighScore: nextScore });
      }

      if (linesCleared > 0) {
        SoundFX.playClear(nextStreak);
        spawnClearParticles(result.clearedCells);
        const label =
          nextStreak >= 2
            ? `Combo x${nextStreak}`
            : linesCleared >= 2
              ? `Double Clear!`
              : `+${result.pointsEarned}`;
        const sub =
          nextStreak >= 2 || linesCleared >= 2 ? `+${result.pointsEarned}` : undefined;
        pushBanner(label, sub, row, col);
      } else {
        SoundFX.playPlace();
      }

      // Update tray
      const nextTray = tray.map((p, idx) => (idx === current.trayIndex ? null : p));
      const finalTray = nextTray.every((p) => p === null)
        ? generateTrayPieces(result.nextGrid)
        : nextTray;
      setTray(finalTray);

      // Check Adventure / Daily Goal Completion
      if (mode === 'adventure') {
        const goalMet =
          levelConfig.goalType === 'gems'
            ? nextGems >= levelConfig.targetGems
            : nextScore >= levelConfig.targetScore;
        if (goalMet) {
          SoundFX.playVictory();
          if (dailyDateKey) {
            setClaimedRewardNow(!isDailyCompleted);
            onCompleteDaily?.(dailyDateKey);
          } else {
            onUpdateProgress({
              adventureLevel: Math.max(adventureLevel, levelConfig.level + 1),
            });
          }
          setStatusModal('level_complete');
          return;
        }
      }

      // Check Game Over
      if (isTrayGameOver(result.nextGrid, finalTray)) {
        SoundFX.playGameOver();
        setStatusModal('game_over');
      }
    };

    window.addEventListener('pointermove', handleMove, { passive: false });
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [
    adventureHighScore,
    adventureLevel,
    classicHighScore,
    computeTargetCell,
    gemsCollected,
    grid,
    isDragging,
    levelConfig,
    mode,
    onUpdateProgress,
    pushBanner,
    score,
    spawnClearParticles,
    streak,
    tray,
  ]);

  const clearPreview = useMemo(() => {
    if (!dragState || dragState.targetRow === null || dragState.targetCol === null) {
      return { rows: [] as number[], cols: [] as number[] };
    }
    return previewLinesToClear(grid, dragState.piece, dragState.targetRow, dragState.targetCol);
  }, [dragState, grid]);

  const ghostCells = useMemo(() => {
    const map = new Set<string>();
    if (!dragState || dragState.targetRow === null || dragState.targetCol === null) return map;
    for (let r = 0; r < dragState.piece.matrix.length; r++) {
      for (let c = 0; c < dragState.piece.matrix[0].length; c++) {
        if (dragState.piece.matrix[r][c] === 1) {
          map.add(`${dragState.targetRow + r},${dragState.targetCol + c}`);
        }
      }
    }
    return map;
  }, [dragState]);

  const progressRatio = useMemo(() => {
    if (mode !== 'adventure') return 0;
    if (levelConfig.goalType === 'gems') {
      return Math.min(1, gemsCollected / Math.max(1, levelConfig.targetGems));
    }
    return Math.min(1, score / Math.max(1, levelConfig.targetScore));
  }, [gemsCollected, levelConfig, mode, score]);

  const handleNextAdventureLevel = () => {
    const nextLvl = levelConfig.level + 1;
    void AdManager.showInterstitialAd();
    startLevel('adventure', nextLvl);
  };

  const handleRestartAfterGameOver = () => {
    void AdManager.showInterstitialAd();
    startLevel(mode, levelConfig.level);
  };

  const getTrayPieceCellSize = (piece: PolyominoPiece) => {
    const rows = piece.matrix.length;
    const cols = piece.matrix[0].length;
    const maxByHeight = Math.floor((trayBox.h - 10 - (rows - 1) * 2) / rows);
    const maxByWidth = Math.floor((trayBox.w - 10 - (cols - 1) * 2) / cols);
    return Math.max(9, Math.min(22, maxByHeight, maxByWidth));
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="h-[100dvh] w-full flex flex-col bg-gradient-to-b from-[#0A1D4E] via-[#0E286B] to-[#081538] text-white select-none overflow-hidden"
    >
      {/* Top HUD */}
      <header
        className={`w-full max-w-4xl mx-auto px-3 shrink-0 ${
          isLandscapeCompact ? 'pt-1.5 pb-1' : isShortPortrait ? 'pt-1.5 pb-1 space-y-1' : 'pt-2.5 pb-1.5 space-y-2'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              SoundFX.playTap();
              onBackHome();
            }}
            aria-label="Back to Home"
            className={`${
              isLandscapeCompact || isShortPortrait ? 'w-9 h-9' : 'w-11 h-11'
            } rounded-xl bg-white/10 hover:bg-white/16 border border-white/15 flex items-center justify-center active:scale-95 transition-transform cursor-pointer shrink-0`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Mode Switcher or Daily Header */}
          {dailyDateKey ? (
            <div className="px-3.5 py-1.5 rounded-xl bg-[#071336]/80 border border-amber-300/30 text-xs font-bold text-amber-300 whitespace-nowrap">
              Daily Challenge · {formatDailyDisplayDate(dailyDateKey)}
            </div>
          ) : (
            <div className="flex items-center p-0.5 rounded-xl bg-[#071336]/80 border border-blue-300/20">
              <button
                type="button"
                onClick={() => {
                  if (mode !== 'adventure') {
                    SoundFX.playTap();
                    startLevel('adventure', adventureLevel);
                  }
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  mode === 'adventure'
                    ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 shadow'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                Adventure
              </button>
              <button
                type="button"
                onClick={() => {
                  if (mode !== 'endless') {
                    SoundFX.playTap();
                    startLevel('endless', adventureLevel);
                  }
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  mode === 'endless'
                    ? 'bg-gradient-to-b from-cyan-400 to-blue-500 text-slate-950 shadow'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                Endless
              </button>
            </div>
          )}

          {/* Inline compact score on landscape screens */}
          {isLandscapeCompact && (
            <div className="flex items-center gap-3 px-3 py-1 rounded-xl bg-[#07143A]/75 border border-blue-400/20 text-xs">
              <span className="font-mono font-bold tabular-nums text-white">
                {score.toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-1 font-mono font-bold tabular-nums text-amber-300">
                <CrownIcon className="w-3.5 h-3.5" />
                {Math.max(highScore, score).toLocaleString()}
              </span>
              {mode === 'adventure' && (
                <span className="font-semibold text-cyan-300 tabular-nums">
                  {dailyDateKey ? 'Daily' : `Lv.${levelConfig.level}`}{' '}
                  {levelConfig.goalType === 'gems'
                    ? `${gemsCollected}/${levelConfig.targetGems}`
                    : `${score}/${levelConfig.targetScore}`}
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              SoundFX.playTap();
              onOpenSettings();
            }}
            aria-label="Open Settings"
            className={`${
              isLandscapeCompact || isShortPortrait ? 'w-9 h-9' : 'w-11 h-11'
            } rounded-xl bg-white/10 hover:bg-white/16 border border-white/15 flex items-center justify-center active:scale-95 transition-transform cursor-pointer shrink-0`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Score & Goal Bar (Portrait) */}
        {!isLandscapeCompact && (
          <div
            className={`flex items-center justify-between gap-2 px-3 rounded-2xl bg-[#07143A]/75 border border-blue-400/20 shadow-inner ${
              isShortPortrait ? 'py-1.5' : 'py-2'
            }`}
          >
            <div className="flex items-center gap-3">
              <div>
                <span className="block text-[10px] font-medium text-blue-200/75 leading-none">
                  Score
                </span>
                <span
                  className={`font-mono font-bold tabular-nums text-white leading-tight ${
                    isShortPortrait ? 'text-base' : 'text-xl'
                  }`}
                >
                  {score.toLocaleString()}
                </span>
              </div>
              <div className="h-6 w-px bg-white/12" aria-hidden="true" />
              <div className="flex items-center gap-1.5">
                <CrownIcon className="w-4 h-4 shrink-0" />
                <div>
                  <span className="block text-[10px] font-medium text-amber-200/80 leading-none">
                    Best
                  </span>
                  <span className="font-mono text-sm font-bold tabular-nums text-amber-300 leading-tight">
                    {Math.max(highScore, score).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {mode === 'adventure' ? (
              <div className="flex-1 max-w-[165px] text-right">
                <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-blue-100 mb-1">
                  <span>{dailyDateKey ? 'Daily Goal' : `Level ${levelConfig.level}`}</span>
                  <span aria-hidden="true">·</span>
                  {levelConfig.goalType === 'gems' ? (
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums text-cyan-300">
                      <GemIcon className="w-3.5 h-3.5" variant="cyan" />
                      {gemsCollected}/{levelConfig.targetGems}
                    </span>
                  ) : (
                    <span className="font-mono tabular-nums text-amber-300">
                      {score}/{levelConfig.targetScore}
                    </span>
                  )}
                </div>
                <div className="h-1.5 w-full rounded-full bg-blue-950/90 overflow-hidden border border-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-amber-400 transition-all duration-200"
                    style={{ width: `${Math.round(progressRatio * 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-right">
                <span className="block text-[10px] font-medium text-cyan-200/75 leading-none">
                  Mode
                </span>
                <span className="text-xs font-bold text-cyan-300">Classic 8×8</span>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Play Area: Vertical in Portrait, Side-by-Side in Short Landscape */}
      <div
        className={`flex-1 min-h-0 w-full max-w-4xl mx-auto flex ${
          isLandscapeCompact ? 'flex-row items-stretch gap-3 px-3 pb-1.5' : 'flex-col'
        }`}
      >
        {/* Center 8x8 Grid Stage */}
        <main
          ref={stageContainerRef}
          className="flex-1 min-h-0 min-w-0 flex items-center justify-center px-2 overflow-hidden"
        >
          <div
            className="relative rounded-2xl p-[5px] bg-gradient-to-b from-[#17398A] to-[#0B1E52] border-2 border-blue-400/35 shadow-[0_14px_34px_rgba(3,8,28,0.65)] touch-none shrink-0"
            style={{ width: boardPx + 10, height: boardPx + 10 }}
          >
            <div
              ref={boardRef}
              className="relative grid grid-cols-8 grid-rows-8 gap-[2px] rounded-xl bg-[#091538] p-[2px]"
              style={{ width: boardPx, height: boardPx }}
            >
              {grid.map((row, r) =>
                row.map((cell, c) => {
                  const key = `${r},${c}`;
                  const isGhost = ghostCells.has(key);
                  const isClearingHighlight =
                    clearPreview.rows.includes(r) || clearPreview.cols.includes(c);
                  const isRecent = recentlyPlaced.has(key);
                  const activeColor = cell
                    ? BLOCK_COLORS[cell.color]
                    : isGhost && dragState
                      ? BLOCK_COLORS[dragState.piece.color]
                      : null;

                  return (
                    <div
                      key={key}
                      className={`relative rounded-[5px] transition-transform duration-150 ${
                        isRecent ? 'animate-cell-pop' : ''
                      } ${
                        isClearingHighlight
                          ? 'ring-2 ring-amber-300 shadow-[0_0_12px_rgba(253,224,71,0.75)]'
                          : ''
                      }`}
                      style={
                        cell && activeColor
                          ? {
                              background: `linear-gradient(155deg, ${activeColor.highlight} 0%, ${activeColor.base} 52%, ${activeColor.border} 100%)`,
                              border: `1px solid ${activeColor.highlight}`,
                            }
                          : isGhost && activeColor
                            ? {
                                backgroundColor: `${activeColor.base}66`,
                                border: `1.5px dashed ${activeColor.highlight}`,
                              }
                            : {
                                backgroundColor: '#102458',
                                boxShadow: 'inset 0 2px 4px rgba(2,6,23,0.45)',
                              }
                      }
                    >
                      {cell && (
                        <div className="mx-[14%] mt-[11%] h-[22%] rounded-sm bg-white/45 pointer-events-none" />
                      )}
                      {cell?.gem && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <GemIcon className="w-[68%] h-[68%] drop-shadow" variant={cell.gem} />
                        </div>
                      )}
                    </div>
                  );
                }),
              )}
            </div>

            {/* Canvas Particle FX Overlay */}
            <canvas
              ref={canvasRef}
              className="absolute left-[5px] top-[5px] pointer-events-none z-20"
              style={{ width: boardPx, height: boardPx }}
            />

            {/* Floating Combo & Score Popups */}
            <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
              {floatingBanners.map((b) => (
                <div
                  key={b.id}
                  className="animate-float-pop absolute text-center whitespace-nowrap"
                  style={{ left: `${b.xPercent}%`, top: `${b.yPercent}%` }}
                >
                  <div className="font-display text-xl font-extrabold text-amber-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                    {b.text}
                  </div>
                  {b.subtext && (
                    <div className="font-mono text-xs font-bold text-white drop-shadow">
                      {b.subtext}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Bottom / Side 3-Piece Polyomino Tray */}
        <section
          aria-label="Available Block Pieces"
          className={
            isLandscapeCompact
              ? 'w-[148px] shrink-0 flex flex-col'
              : 'w-full max-w-2xl mx-auto px-3 pb-2 pt-1 shrink-0'
          }
        >
          <div
            ref={trayContainerRef}
            className={`rounded-2xl bg-[#07143A]/85 border border-blue-400/20 p-2 grid gap-2 overflow-hidden ${
              isLandscapeCompact
                ? 'flex-1 grid-cols-1 grid-rows-3'
                : isShortPortrait
                  ? 'grid-cols-3 h-[86px]'
                  : 'grid-cols-3 h-[108px] sm:h-[120px]'
            }`}
          >
            {tray.map((piece, idx) => {
              const isBeingDragged = dragState?.trayIndex === idx;
              return (
                <div
                  key={piece ? piece.id : `empty-${idx}`}
                  onPointerDown={(e) => {
                    if (!piece || statusModal !== 'none') return;
                    e.preventDefault();
                    SoundFX.playPickup();
                    const isTouch = e.pointerType === 'touch';
                    // Vertical offset above touch point so thumb never obscures target cells
                    const offsetY = isTouch ? (isLandscapeCompact ? 56 : 72) : 18;
                    const { row, col } = computeTargetCell(piece, e.clientX, e.clientY, offsetY);
                    setDragState({
                      trayIndex: idx,
                      piece,
                      pointerX: e.clientX,
                      pointerY: e.clientY,
                      offsetY,
                      targetRow: row,
                      targetCol: col,
                    });
                  }}
                  className={`relative rounded-xl flex items-center justify-center touch-none overflow-hidden transition-colors ${
                    piece && !isBeingDragged
                      ? 'bg-blue-900/35 hover:bg-blue-800/45 cursor-grab active:cursor-grabbing'
                      : 'bg-blue-950/25'
                  }`}
                >
                  {piece && !isBeingDragged && (
                    <PieceMatrixView
                      piece={piece}
                      cellSize={getTrayPieceCellSize(piece)}
                      gap={2}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Persistent 50px Bottom Banner Ad */}
      <BannerAdSlot theme="blue" />

      {/* Floating Dragged Block (Rendered with Touch Offset) */}
      {dragState && (
        <div
          className="fixed z-40 pointer-events-none"
          style={{
            left: dragState.pointerX,
            top: dragState.pointerY - dragState.offsetY,
            transform: 'translate(-50%, -50%) scale(1.03)',
            filter: 'drop-shadow(0 16px 24px rgba(0, 0, 0, 0.55))',
          }}
        >
          <PieceMatrixView
            piece={dragState.piece}
            cellSize={Math.max(16, cellPx - 2)}
            gap={2}
          />
        </div>
      )}

      {/* Level Complete / Game Over Modals */}
      {statusModal !== 'none' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-[#132E73] to-[#0B1C4A] border border-blue-300/35 p-6 text-center shadow-2xl space-y-5">
            {statusModal === 'level_complete' ? (
              <>
                <div className="flex items-center justify-center gap-2">
                  <StarIcon className="w-8 h-8 -rotate-12 translate-y-1" />
                  <StarIcon className="w-11 h-11" />
                  <StarIcon className="w-8 h-8 rotate-12 translate-y-1" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-cyan-300">
                    {dailyDateKey
                      ? `${levelConfig.patternName} · ${formatDailyDisplayDate(dailyDateKey)}`
                      : `Level ${levelConfig.level} · ${levelConfig.patternName}`}
                  </p>
                  <h2 className="font-display text-2xl font-extrabold text-white">
                    {dailyDateKey ? 'Daily Challenge Complete!' : 'Congratulations!'}
                  </h2>
                  <p className="text-sm text-blue-100/85">
                    Stage cleared with{' '}
                    <span className="font-mono font-bold tabular-nums text-amber-300">
                      {score.toLocaleString()}
                    </span>{' '}
                    points.
                  </p>
                  {dailyDateKey && (
                    <div className="mt-2 p-2.5 rounded-xl bg-amber-400/15 border border-amber-300/35 text-xs font-semibold text-amber-200">
                      {claimedRewardNow
                        ? `Reward Unlocked: +${DAILY_BOOSTER_REWARD.hints} Hint · +${DAILY_BOOSTER_REWARD.undos} Undo · +${DAILY_BOOSTER_REWARD.shuffles} Shuffle`
                        : 'Daily booster reward already claimed today'}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onBackHome}
                    className="flex-1 h-12 rounded-xl bg-white/10 hover:bg-white/16 text-sm font-semibold cursor-pointer"
                  >
                    Home
                  </button>
                  {dailyDateKey ? (
                    <button
                      type="button"
                      onClick={() => startLevel('adventure', 1)}
                      className="flex-[1.5] h-12 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Replay Daily</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextAdventureLevel}
                      className="flex-[1.5] h-12 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Next Level</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-400/35 flex items-center justify-center text-rose-300">
                  <Crown className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h2 className="font-display text-2xl font-extrabold text-white">
                    No Moves Left
                  </h2>
                  <p className="text-sm text-blue-100/80">
                    Final Score:{' '}
                    <span className="font-mono font-bold tabular-nums text-white">
                      {score.toLocaleString()}
                    </span>
                    {' · '}Best:{' '}
                    <span className="font-mono font-bold tabular-nums text-amber-300">
                      {Math.max(highScore, score).toLocaleString()}
                    </span>
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onBackHome}
                    className="flex-1 h-12 rounded-xl bg-white/10 hover:bg-white/16 text-sm font-semibold cursor-pointer"
                  >
                    Home
                  </button>
                  <button
                    type="button"
                    onClick={handleRestartAfterGameOver}
                    className="flex-[1.5] h-12 rounded-xl bg-gradient-to-b from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Play Again</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
