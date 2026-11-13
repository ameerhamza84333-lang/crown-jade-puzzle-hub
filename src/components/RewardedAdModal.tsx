import React, { useState } from 'react';
import { PlayCircle, X } from 'lucide-react';
import { AdManager } from '../services/AdManager.js';

export type BoosterType = 'Hint' | 'Undo' | 'Shuffle';

interface RewardedAdModalProps {
  booster: BoosterType | null;
  onClose: () => void;
  onRewardGranted: (booster: BoosterType, amount: number) => void;
}

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  booster,
  onClose,
  onRewardGranted,
}) => {
  const [watching, setWatching] = useState(false);

  if (!booster) return null;

  const handleWatchAd = async () => {
    if (watching) return;
    setWatching(true);
    await AdManager.showRewardedAd(
      (reward: { amount?: number }) => {
        setWatching(false);
        onRewardGranted(booster, reward?.amount || 2);
      },
      () => {
        setWatching(false);
        onClose();
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reward-modal-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-[#0A3A28] border border-amber-400/35 shadow-2xl overflow-hidden text-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 id="reward-modal-title" className="font-display text-lg font-bold">
            Refill {booster}
          </h2>
          {!watching && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cancel refill"
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/15 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-5 text-center space-y-5">
          {!watching ? (
            <>
              <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300">
                <PlayCircle className="w-8 h-8" />
              </div>
              <p className="text-sm text-emerald-50 leading-relaxed">
                Out of <span className="font-bold text-amber-300">{booster}</span>! Watch a short ad
                to get <span className="font-bold text-white">+2 more</span>?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-11 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold cursor-pointer"
                >
                  Not Now
                </button>
                <button
                  type="button"
                  onClick={handleWatchAd}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-sm font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Watch Ad (+2)</span>
                </button>
              </div>
            </>
          ) : (
            <div className="py-4 space-y-4">
              <div className="mx-auto w-10 h-10 rounded-full border-3 border-amber-300 border-t-transparent animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Loading Rewarded Ad…</p>
                <p className="text-xs text-emerald-200/75">
                  Granting +2 {booster} uses momentarily
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
