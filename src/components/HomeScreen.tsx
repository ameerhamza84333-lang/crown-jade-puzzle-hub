import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, ChevronRight, Settings, Sparkles } from 'lucide-react';
import {
  BlockPreviewSvg,
  BrandEmblemSvg,
  CrownIcon,
  MahjongPreviewSvg,
} from './SvgAssets';
import { BannerAdSlot } from './BannerAdSlot';
import { AppSaveState } from '../services/storage';
import { SoundFX } from '../services/sound';
import {
  formatDailyDisplayDate,
  getTimeUntilNextDaily,
} from '../services/dailyChallenge';

interface HomeScreenProps {
  saveState: AppSaveState;
  todayKey: string;
  onPlayBlockBlast: (mode: 'adventure' | 'endless') => void;
  onPlayMahjong: () => void;
  onPlayDailyBlockBlast: () => void;
  onPlayDailyMahjong: () => void;
  onOpenSettings: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  saveState,
  todayKey,
  onPlayBlockBlast,
  onPlayMahjong,
  onPlayDailyBlockBlast,
  onPlayDailyMahjong,
  onOpenSettings,
}) => {
  const [countdown, setCountdown] = useState(() => getTimeUntilNextDaily());

  useEffect(() => {
    setCountdown(getTimeUntilNextDaily());
    const id = window.setInterval(() => {
      setCountdown(getTimeUntilNextDaily());
    }, 30000);
    return () => window.clearInterval(id);
  }, [todayKey]);

  const blockBest = Math.max(
    saveState.blockBlast.adventureHighScore,
    saveState.blockBlast.classicHighScore,
  );
  const dailyBlockDone = saveState.dailyChallenge.blockBlastCompletedDate === todayKey;
  const dailyMahjongDone = saveState.dailyChallenge.mahjongCompletedDate === todayKey;

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-[radial-gradient(circle_at_20%_12%,#173D91_0%,#09183E_48%,#051E19_100%)] text-white select-none overflow-hidden">
      {/* Top Bar: Title & Settings Gear */}
      <header className="w-full max-w-3xl mx-auto px-4 pt-3 pb-1.5 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <BrandEmblemSvg className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 drop-shadow-md" />
          <div className="min-w-0">
            <h1 className="font-display text-xl sm:text-3xl font-extrabold tracking-tight text-white leading-none truncate">
              Crown &amp; Jade
            </h1>
            <p className="text-xs sm:text-sm text-blue-200/80 mt-0.5 truncate">
              Block Blast &amp; Mahjong Solitaire
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            SoundFX.playTap();
            onOpenSettings();
          }}
          aria-label="Open Settings"
          className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/16 border border-white/15 flex items-center justify-center active:scale-95 transition-transform cursor-pointer shrink-0"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Center Content */}
      <main className="flex-1 min-h-0 w-full max-w-3xl mx-auto px-4 py-2 overflow-y-auto flex flex-col">
        <div className="my-auto space-y-3.5">
          {/* Daily Challenge Banner Panel */}
          <section
            aria-label="Daily Challenge"
            className="rounded-2xl bg-gradient-to-r from-[#1A2D6E]/90 via-[#18385E]/90 to-[#0E4A36]/90 border border-amber-300/35 p-3.5 sm:p-4 shadow-lg space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-300/35 flex items-center justify-center text-amber-300 shrink-0">
                  <Calendar className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-base sm:text-lg font-extrabold text-white leading-none">
                      Daily Challenge
                    </h2>
                    <span className="text-xs font-semibold text-amber-300">
                      {formatDailyDisplayDate(todayKey)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-blue-100/75 mt-1">
                    <span className="tabular-nums">Resets in {countdown}</span>
                    {saveState.dailyChallenge.streak > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-300 font-semibold tabular-nums">
                          {saveState.dailyChallenge.streak}-day streak
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right text-[11px] text-amber-200/90 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>Win +1 Hint, Undo &amp; Shuffle per puzzle</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Daily Block Blast */}
              <button
                type="button"
                onClick={() => {
                  SoundFX.playTap();
                  onPlayDailyBlockBlast();
                }}
                className="h-12 px-3.5 rounded-xl bg-blue-950/65 hover:bg-blue-900/75 border border-blue-300/25 flex items-center justify-between gap-2 active:scale-[0.98] transition-transform cursor-pointer text-left"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white leading-tight truncate">
                    Daily Block Blast
                  </p>
                  <p className="text-[11px] text-cyan-200/80 leading-tight">
                    {dailyBlockDone ? 'Completed today · Replay' : '5 Gems · +1 All Boosters'}
                  </p>
                </div>
                {dailyBlockDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-amber-300 shrink-0" />
                )}
              </button>

              {/* Daily Mahjong */}
              <button
                type="button"
                onClick={() => {
                  SoundFX.playTap();
                  onPlayDailyMahjong();
                }}
                className="h-12 px-3.5 rounded-xl bg-emerald-950/65 hover:bg-emerald-900/75 border border-emerald-300/25 flex items-center justify-between gap-2 active:scale-[0.98] transition-transform cursor-pointer text-left"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white leading-tight truncate">
                    Daily Mahjong
                  </p>
                  <p className="text-[11px] text-emerald-200/80 leading-tight">
                    {dailyMahjongDone ? 'Completed today · Replay' : 'Solvable · +1 All Boosters'}
                  </p>
                </div>
                {dailyMahjongDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-amber-300 shrink-0" />
                )}
              </button>
            </div>
          </section>

          {/* Main Game Mode Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
            {/* Card 1: Play Block Blast (Deep Royal Blue Theme) */}
            <div className="rounded-3xl bg-gradient-to-br from-[#1944A8] via-[#102E78] to-[#091A4A] border border-blue-300/30 shadow-[0_18px_38px_rgba(4,12,40,0.55)] p-4 sm:p-5 flex flex-col justify-between gap-3.5">
              <div className="flex items-center gap-3.5">
                <BlockPreviewSvg className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 drop-shadow-lg" />
                <div className="min-w-0 flex-1 space-y-1">
                  <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                    Block Blast
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-blue-100/85">
                    <span>Level {saveState.blockBlast.adventureLevel}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums text-amber-300 font-semibold">
                      <CrownIcon className="w-3.5 h-3.5" />
                      {blockBest.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-blue-200/75 leading-relaxed">
                    Drag polyomino blocks onto the 8×8 grid, blast lines, and collect crystal gems.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    SoundFX.playTap();
                    onPlayBlockBlast('adventure');
                  }}
                  className="flex-[1.5] h-11 sm:h-12 rounded-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-slate-950 font-display font-extrabold text-sm sm:text-base flex items-center justify-center gap-1.5 shadow-lg active:scale-[0.98] transition-transform cursor-pointer whitespace-nowrap px-4"
                >
                  <span>Play Block Blast</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    SoundFX.playTap();
                    onPlayBlockBlast('endless');
                  }}
                  className="flex-1 h-11 sm:h-12 rounded-2xl bg-blue-950/60 hover:bg-blue-900/70 border border-blue-300/25 text-blue-100 font-semibold text-sm flex items-center justify-center active:scale-[0.98] transition-transform cursor-pointer whitespace-nowrap px-3"
                >
                  Endless
                </button>
              </div>
            </div>

            {/* Card 2: Play Mahjong (Rich Emerald Green & Gold Theme) */}
            <div className="rounded-3xl bg-gradient-to-br from-[#126B47] via-[#0B4A31] to-[#05291B] border border-amber-300/30 shadow-[0_18px_38px_rgba(3,24,16,0.55)] p-4 sm:p-5 flex flex-col justify-between gap-3.5">
              <div className="flex items-center gap-3.5">
                <MahjongPreviewSvg className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 drop-shadow-lg" />
                <div className="min-w-0 flex-1 space-y-1">
                  <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                    Mahjong Match
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-emerald-100/85">
                    <span>Level {saveState.mahjong.level}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums text-amber-300 font-semibold">
                      <CrownIcon className="w-3.5 h-3.5" />
                      {saveState.mahjong.highScore.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100/75 leading-relaxed">
                    Match free ivory tiles across solvable 3D boards · Boosters:{' '}
                    <span className="font-mono tabular-nums text-amber-200 font-semibold">
                      {saveState.mahjong.hints}H / {saveState.mahjong.undos}U / {saveState.mahjong.shuffles}S
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  SoundFX.playTap();
                  onPlayMahjong();
                }}
                className="w-full h-11 sm:h-12 rounded-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-slate-950 font-display font-extrabold text-sm sm:text-base flex items-center justify-center gap-1.5 shadow-lg active:scale-[0.98] transition-transform cursor-pointer whitespace-nowrap px-4"
              >
                <span>Play Mahjong</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Single Flat Control-Hint Line */}
          <p className="text-center text-xs text-slate-300/75 pt-0.5">
            Drag blocks to clear lines · Tap matching free tiles to clear the board
          </p>
        </div>
      </main>

      {/* Persistent 50px Bottom Banner Ad */}
      <BannerAdSlot theme="home" />
    </div>
  );
};
