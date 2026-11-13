import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Lightbulb, Play, RotateCcw, Settings, Shuffle, Undo2 } from 'lucide-react';
import {
  MahjongLevelData,
  MahjongTile,
  countValidPairs,
  findHintPair,
  generateDailyMahjongChallenge,
  generateSolvableMahjongLevel,
  getFreeTileIds,
  shuffleRemainingSolvable,
} from './mahjongLogic';
import { CrownIcon, MahjongTileFace, StarIcon } from '../../components/SvgAssets';
import { BannerAdSlot } from '../../components/BannerAdSlot';
import { BoosterType, RewardedAdModal } from '../../components/RewardedAdModal';
import { SoundFX } from '../../services/sound';
import { AdManager } from '../../services/AdManager.js';
import { DAILY_BOOSTER_REWARD, formatDailyDisplayDate } from '../../services/dailyChallenge';

interface MahjongGameProps {
  level: number;
  highScore: number;
  hints: number;
  undos: number;
  shuffles: number;
  dailyDateKey?: string;
  isDailyCompleted?: boolean;
  onCompleteDaily?: (dateKey: string) => void;
  onUpdateProgress: (patch: {
    level?: number;
    highScore?: number;
    hints?: number;
    undos?: number;
    shuffles?: number;
  }) => void;
  onOpenSettings: () => void;
  onBackHome: () => void;
}

interface MoveHistoryEntry {
  removedPair: [MahjongTile, MahjongTile];
  pointsAdded: number;
}

export const MahjongGame: React.FC<MahjongGameProps> = ({
  level,
  highScore,
  hints,
  undos,
  shuffles,
  dailyDateKey,
  isDailyCompleted = false,
  onCompleteDaily,
  onUpdateProgress,
  onOpenSettings,
  onBackHome,
}) => {
  const [levelData, setLevelData] = useState<MahjongLevelData>(() =>
    dailyDateKey ? generateDailyMahjongChallenge(dailyDateKey) : generateSolvableMahjongLevel(level),
  );
  const [tiles, setTiles] = useState<MahjongTile[]>(() => levelData.tiles);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hintPair, setHintPair] = useState<[string, string] | null>(null);
  const [shakingId, setShakingId] = useState<string | null>(null);
  const [matchingIds, setMatchingIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<MoveHistoryEntry[]>([]);
  const [rewardModalBooster, setRewardModalBooster] = useState<BoosterType | null>(null);
  const [statusModal, setStatusModal] = useState<'none' | 'victory' | 'no_moves'>('none');
  const [claimedRewardNow, setClaimedRewardNow] = useState(false);

  const boardWrapRef = useRef<HTMLDivElement>(null);
  const [wrapSize, setWrapSize] = useState({ width: 340, height: 420 });

  useEffect(() => {
    const el = boardWrapRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setWrapSize({
        width: Math.max(240, rect.width),
        height: Math.max(240, rect.height),
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const loadLevel = useCallback(
    (lvlNum: number, resetScore = false) => {
      const data = dailyDateKey
        ? generateDailyMahjongChallenge(dailyDateKey)
        : generateSolvableMahjongLevel(lvlNum);
      setLevelData(data);
      setTiles(data.tiles);
      if (resetScore) setScore(0);
      setCombo(0);
      setSelectedId(null);
      setHintPair(null);
      setHistory([]);
      setMatchingIds(new Set());
      setStatusModal('none');
    },
    [dailyDateKey],
  );

  const freeIds = useMemo(() => getFreeTileIds(tiles), [tiles]);
  const validPairs = useMemo(() => countValidPairs(tiles), [tiles]);

  // Compute responsive tile size based on formation bounds
  const boardMetrics = useMemo(() => {
    if (tiles.length === 0) {
      return { tileW: 44, tileH: 56, boardW: 200, boardH: 200, minCol: 0, minRow: 0, layerShift: 4, depthPad: 0 };
    }
    let minCol = Infinity;
    let maxCol = -Infinity;
    let minRow = Infinity;
    let maxRow = -Infinity;
    let maxLayer = 0;

    for (const t of tiles) {
      minCol = Math.min(minCol, t.col);
      maxCol = Math.max(maxCol, t.col + 2);
      minRow = Math.min(minRow, t.row);
      maxRow = Math.max(maxRow, t.row + 2);
      maxLayer = Math.max(maxLayer, t.layer);
    }

    const spanCols = Math.max(4, (maxCol - minCol) / 2); // in full tile widths
    const spanRows = Math.max(4, (maxRow - minRow) / 2); // in full tile heights

    // Maintain ~1 : 1.24 Mahjong tile aspect ratio
    const availW = Math.max(120, wrapSize.width - 20 - maxLayer * 6);
    const availH = Math.max(100, wrapSize.height - 16 - maxLayer * 8);
    const maxTileWByWidth = availW / spanCols;
    const maxTileWByHeight = availH / (spanRows * 1.24);
    const tileW = Math.max(16, Math.min(64, Math.floor(Math.min(maxTileWByWidth, maxTileWByHeight))));
    const tileH = Math.round(tileW * 1.24);
    const layerShift = Math.max(2, Math.round(tileW * 0.1));
    const depthPad = maxLayer * layerShift;

    return {
      tileW,
      tileH,
      boardW: spanCols * tileW + depthPad,
      boardH: spanRows * tileH + depthPad,
      minCol,
      minRow,
      layerShift,
      depthPad,
    };
  }, [tiles, wrapSize]);

  // Sort tiles back-to-front so higher layers and lower/right tiles overlap naturally
  const sortedTiles = useMemo(() => {
    return [...tiles].sort((a, b) => {
      if (a.layer !== b.layer) return a.layer - b.layer;
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });
  }, [tiles]);

  // Detect no valid moves left
  useEffect(() => {
    if (tiles.length > 0 && validPairs === 0 && matchingIds.size === 0 && statusModal === 'none') {
      const timer = window.setTimeout(() => {
        setStatusModal('no_moves');
      }, 240);
      return () => window.clearTimeout(timer);
    }
  }, [tiles.length, validPairs, matchingIds.size, statusModal]);

  const handleTilePress = (tile: MahjongTile) => {
    if (statusModal !== 'none' || matchingIds.size > 0) return;
    if (!freeIds.has(tile.id)) {
      SoundFX.playInvalid();
      setShakingId(tile.id);
      window.setTimeout(() => setShakingId(null), 230);
      return;
    }

    if (selectedId === tile.id) {
      SoundFX.playTap();
      setSelectedId(null);
      return;
    }

    if (!selectedId) {
      SoundFX.playTileSelect();
      setSelectedId(tile.id);
      return;
    }

    const first = tiles.find((t) => t.id === selectedId);
    if (!first) {
      setSelectedId(tile.id);
      return;
    }

    if (first.tileType === tile.tileType) {
      // Valid Match!
      SoundFX.playTileMatch();
      setHintPair(null);
      setSelectedId(null);
      const pairSet = new Set([first.id, tile.id]);
      setMatchingIds(pairSet);

      const nextCombo = combo + 1;
      const pointsAdded = 20 + Math.min(nextCombo, 8) * 5;
      const nextScore = score + pointsAdded;
      setCombo(nextCombo);
      setScore(nextScore);

      if (nextScore > highScore) {
        onUpdateProgress({ highScore: nextScore });
      }

      window.setTimeout(() => {
        setMatchingIds(new Set());
        setHistory((prev) => [...prev, { removedPair: [first, tile], pointsAdded }]);
        setTiles((prev) => {
          const remaining = prev.filter((t) => !pairSet.has(t.id));
          if (remaining.length === 0) {
            SoundFX.playVictory();
            if (dailyDateKey) {
              setClaimedRewardNow(!isDailyCompleted);
              onCompleteDaily?.(dailyDateKey);
            } else {
              onUpdateProgress({ level: Math.max(level, levelData.level + 1) });
            }
            setStatusModal('victory');
          }
          return remaining;
        });
      }, 170);
    } else {
      // Switch selection cleanly if clicking another free tile of a different type
      SoundFX.playTileSelect();
      setSelectedId(tile.id);
    }
  };

  const handleHint = () => {
    if (statusModal !== 'none') return;
    if (hints <= 0) {
      SoundFX.playTap();
      setRewardModalBooster('Hint');
      return;
    }
    const pair = findHintPair(tiles);
    if (!pair) {
      setStatusModal('no_moves');
      return;
    }
    SoundFX.playBooster();
    onUpdateProgress({ hints: hints - 1 });
    setHintPair(pair);
    setSelectedId(pair[0]);
  };

  const handleUndo = () => {
    if (statusModal !== 'none' || history.length === 0) {
      if (history.length === 0) SoundFX.playInvalid();
      return;
    }
    if (undos <= 0) {
      SoundFX.playTap();
      setRewardModalBooster('Undo');
      return;
    }
    const last = history[history.length - 1];
    SoundFX.playBooster();
    onUpdateProgress({ undos: undos - 1 });
    setHistory((prev) => prev.slice(0, -1));
    setTiles((prev) => [...prev, last.removedPair[0], last.removedPair[1]]);
    setScore((prev) => Math.max(0, prev - last.pointsAdded));
    setCombo(0);
    setSelectedId(null);
    setHintPair(null);
  };

  const handleShuffle = () => {
    if (tiles.length === 0) return;
    if (shuffles <= 0) {
      SoundFX.playTap();
      setRewardModalBooster('Shuffle');
      return;
    }
    SoundFX.playBooster();
    onUpdateProgress({ shuffles: shuffles - 1 });
    setTiles((prev) => shuffleRemainingSolvable(prev));
    setSelectedId(null);
    setHintPair(null);
    setStatusModal('none');
  };

  const handleRewardGranted = (booster: BoosterType, amount: number) => {
    SoundFX.playVictory();
    if (booster === 'Hint') onUpdateProgress({ hints: hints + amount });
    if (booster === 'Undo') onUpdateProgress({ undos: undos + amount });
    if (booster === 'Shuffle') onUpdateProgress({ shuffles: shuffles + amount });
    setRewardModalBooster(null);
  };

  const handleNextLevel = () => {
    const nextLvl = levelData.level + 1;
    void AdManager.showInterstitialAd();
    loadLevel(nextLvl, false);
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-[radial-gradient(ellipse_at_top,#126342_0%,#083B27_58%,#042116_100%)] text-white select-none overflow-hidden">
      {/* Top HUD */}
      <header className="w-full max-w-3xl mx-auto px-3 pt-2.5 pb-1.5 shrink-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              SoundFX.playTap();
              onBackHome();
            }}
            aria-label="Back to Home"
            className="w-11 h-11 rounded-xl bg-black/25 hover:bg-black/35 border border-emerald-300/20 flex items-center justify-center active:scale-95 transition-transform cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="text-center min-w-0">
            <p className="text-[11px] font-semibold text-amber-300 tracking-wide truncate">
              {dailyDateKey
                ? `${formatDailyDisplayDate(dailyDateKey)} · ${levelData.formationName}`
                : `Level ${levelData.level} · ${levelData.formationName}`}
            </p>
            <div className="flex items-center justify-center gap-3 text-xs text-emerald-100/85">
              <span className="font-mono tabular-nums">Tiles: {tiles.length}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-amber-200">
                Pairs: {validPairs}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              SoundFX.playTap();
              onOpenSettings();
            }}
            aria-label="Open Settings"
            className="w-11 h-11 rounded-xl bg-black/25 hover:bg-black/35 border border-emerald-300/20 flex items-center justify-center active:scale-95 transition-transform cursor-pointer shrink-0"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Score Strip */}
        <div className="flex items-center justify-between px-4 py-1.5 rounded-xl bg-black/25 border border-amber-300/20">
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-200/80">Score</span>
            <span className="font-mono text-lg font-bold tabular-nums text-white">
              {score.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CrownIcon className="w-4 h-4 shrink-0" />
            <span className="text-xs text-amber-200/80">Best</span>
            <span className="font-mono text-base font-bold tabular-nums text-amber-300">
              {Math.max(highScore, score).toLocaleString()}
            </span>
          </div>
        </div>
      </header>

      {/* Center 3D Mahjong Board */}
      <main
        ref={boardWrapRef}
        className="flex-1 min-h-0 w-full flex items-center justify-center px-2 overflow-hidden"
      >
        <div
          className="relative"
          style={{
            width: boardMetrics.boardW,
            height: boardMetrics.boardH,
          }}
        >
          {sortedTiles.map((tile) => {
            const isFree = freeIds.has(tile.id);
            const isSelected = selectedId === tile.id;
            const isHinted = hintPair?.includes(tile.id) ?? false;
            const isShaking = shakingId === tile.id;
            const isMatching = matchingIds.has(tile.id);

            const left =
              boardMetrics.depthPad +
              ((tile.col - boardMetrics.minCol) / 2) * boardMetrics.tileW -
              tile.layer * boardMetrics.layerShift;
            const top =
              boardMetrics.depthPad +
              ((tile.row - boardMetrics.minRow) / 2) * boardMetrics.tileH -
              tile.layer * boardMetrics.layerShift;

            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => handleTilePress(tile)}
                aria-label={`Mahjong tile ${tile.tileType}${isFree ? '' : ' (blocked)'}`}
                style={{
                  left,
                  top,
                  width: boardMetrics.tileW - 2,
                  height: boardMetrics.tileH - 2,
                  zIndex: tile.layer * 100 + tile.row * 2,
                  transform: isMatching
                    ? 'scale(1.12)'
                    : isSelected
                      ? 'translateY(-4px) scale(1.03)'
                      : 'none',
                  opacity: isMatching ? 0 : 1,
                }}
                className={`absolute rounded-[7px] transition-[transform,opacity] duration-150 focus-visible:outline-2 focus-visible:outline-amber-400 ${
                  isFree ? 'cursor-pointer' : 'cursor-default'
                } ${isShaking ? 'animate-tile-shake' : ''}`}
              >
                {/* 3D Jade Backing Lip */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 translate-x-[2px] translate-y-[4px] rounded-[7px] bg-[#064E3B] shadow-[0_4px_8px_rgba(0,0,0,0.45)]"
                />
                {/* Tile Face */}
                <span
                  className={`relative block w-full h-full rounded-[7px] p-[3px] border transition-colors ${
                    isSelected
                      ? 'bg-[#FFFDF0] border-amber-400 ring-2 ring-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.75)]'
                      : isHinted
                        ? 'bg-[#FFFBEB] border-amber-400 animate-hint-pulse'
                        : isFree
                          ? 'bg-gradient-to-b from-[#FFFDF7] to-[#F3ECD6] border-[#D6C7A1]'
                          : 'bg-gradient-to-b from-[#D5DDD8] to-[#B7C4BC] border-[#8FA197] brightness-90'
                  }`}
                >
                  <MahjongTileFace tileType={tile.tileType} />
                </span>
              </button>
            );
          })}
        </div>
      </main>

      {/* Bottom Power-Up Booster Bar */}
      <section
        aria-label="Mahjong Boosters"
        className="w-full max-w-lg mx-auto px-3 pb-2.5 pt-1 shrink-0"
      >
        <div className="grid grid-cols-3 gap-2.5">
          {/* Hint Booster */}
          <button
            type="button"
            onClick={handleHint}
            className="relative h-14 rounded-2xl bg-black/30 hover:bg-black/40 border border-amber-300/25 flex items-center justify-center gap-2 px-3 active:scale-95 transition-transform cursor-pointer"
          >
            <Lightbulb className="w-5 h-5 text-amber-300 shrink-0" />
            <span className="text-sm font-bold text-white">Hint</span>
            {hints > 0 ? (
              <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-amber-400 text-slate-950 font-mono text-xs font-extrabold flex items-center justify-center tabular-nums">
                {hints}
              </span>
            ) : (
              <span className="h-[22px] px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center gap-0.5 whitespace-nowrap">
                <Play className="w-2.5 h-2.5 fill-current" />
                +AD
              </span>
            )}
          </button>

          {/* Undo Booster */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0 && undos > 0}
            className={`relative h-14 rounded-2xl bg-black/30 border border-amber-300/25 flex items-center justify-center gap-2 px-3 transition-transform ${
              history.length === 0 && undos > 0
                ? 'opacity-45 cursor-not-allowed'
                : 'hover:bg-black/40 active:scale-95 cursor-pointer'
            }`}
          >
            <Undo2 className="w-5 h-5 text-emerald-300 shrink-0" />
            <span className="text-sm font-bold text-white">Undo</span>
            {undos > 0 ? (
              <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-emerald-400 text-slate-950 font-mono text-xs font-extrabold flex items-center justify-center tabular-nums">
                {undos}
              </span>
            ) : (
              <span className="h-[22px] px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center gap-0.5 whitespace-nowrap">
                <Play className="w-2.5 h-2.5 fill-current" />
                +AD
              </span>
            )}
          </button>

          {/* Shuffle Booster */}
          <button
            type="button"
            onClick={handleShuffle}
            className="relative h-14 rounded-2xl bg-black/30 hover:bg-black/40 border border-amber-300/25 flex items-center justify-center gap-2 px-3 active:scale-95 transition-transform cursor-pointer"
          >
            <Shuffle className="w-5 h-5 text-cyan-300 shrink-0" />
            <span className="text-sm font-bold text-white">Shuffle</span>
            {shuffles > 0 ? (
              <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-cyan-400 text-slate-950 font-mono text-xs font-extrabold flex items-center justify-center tabular-nums">
                {shuffles}
              </span>
            ) : (
              <span className="h-[22px] px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center gap-0.5 whitespace-nowrap">
                <Play className="w-2.5 h-2.5 fill-current" />
                +AD
              </span>
            )}
          </button>
        </div>
      </section>

      {/* Persistent 50px Bottom Banner Ad */}
      <BannerAdSlot theme="jade" />

      {/* Rewarded Ad Refill Modal */}
      <RewardedAdModal
        booster={rewardModalBooster}
        onClose={() => setRewardModalBooster(null)}
        onRewardGranted={handleRewardGranted}
      />

      {/* Victory / No Moves Modal */}
      {statusModal !== 'none' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-[#0E5137] to-[#062B1D] border border-amber-300/35 p-6 text-center shadow-2xl space-y-5">
            {statusModal === 'victory' ? (
              <>
                <div className="flex items-center justify-center gap-2">
                  <StarIcon className="w-8 h-8 -rotate-12 translate-y-1" />
                  <StarIcon className="w-11 h-11" />
                  <StarIcon className="w-8 h-8 rotate-12 translate-y-1" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-amber-300">
                    {dailyDateKey
                      ? `${formatDailyDisplayDate(dailyDateKey)} · ${levelData.formationName}`
                      : `Level ${levelData.level} · ${levelData.formationName}`}
                  </p>
                  <h2 className="font-display text-2xl font-extrabold text-white">
                    {dailyDateKey ? 'Daily Challenge Cleared!' : 'Board Cleared!'}
                  </h2>
                  <p className="text-sm text-emerald-100/85">
                    Score:{' '}
                    <span className="font-mono font-bold tabular-nums text-amber-300">
                      {score.toLocaleString()}
                    </span>
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
                      onClick={() => loadLevel(1, true)}
                      className="flex-[1.5] h-12 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-lg cursor-pointer"
                    >
                      Replay Daily
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextLevel}
                      className="flex-[1.5] h-12 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-lg cursor-pointer"
                    >
                      Next Level
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-300/35 flex items-center justify-center text-amber-300">
                  <Shuffle className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h2 className="font-display text-2xl font-extrabold text-white">
                    No Valid Pairs Left
                  </h2>
                  <p className="text-sm text-emerald-100/80">
                    Shuffle the remaining {tiles.length} tiles into a solvable layout or restart this board.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => loadLevel(levelData.level, true)}
                    className="flex-1 h-12 rounded-xl bg-white/10 hover:bg-white/16 text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Restart</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShuffle}
                    className="flex-[1.5] h-12 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
                  >
                    <Shuffle className="w-4 h-4" />
                    <span>{shuffles > 0 ? `Shuffle (${shuffles})` : 'Refill Shuffle'}</span>
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
