import React, { useState } from 'react';
import { Volume2, VolumeX, ShieldCheck, RotateCcw, X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  nonPersonalizedAds: boolean;
  onToggleNonPersonalizedAds: () => void;
  onResetProgress: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isSoundEnabled,
  onToggleSound,
  nonPersonalizedAds,
  onToggleNonPersonalizedAds,
  onResetProgress,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-[#0F1E46] border border-blue-400/25 shadow-2xl overflow-hidden text-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 id="settings-title" className="font-display text-xl font-bold tracking-tight">
            Settings
          </h2>
          <button
            type="button"
            onClick={() => {
              setConfirmReset(false);
              onClose();
            }}
            aria-label="Close settings"
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/8 hover:bg-white/15 active:scale-95 transition-transform cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-white/6 border border-white/10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
                {isSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">Sound Effects</p>
                <p className="text-xs text-blue-200/75">
                  {isSoundEnabled ? 'Lightweight audio cues on' : 'Muted'}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isSoundEnabled}
              onClick={onToggleSound}
              className={`relative w-14 h-8 rounded-full transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400 ${
                isSoundEnabled ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            >
              <span
                className={`block w-6 h-6 rounded-full bg-white shadow transition-transform duration-150 ${
                  isSoundEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Amazon Appstore / Ad Privacy Toggle */}
          <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-white/6 border border-white/10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">Non-Personalized Ads</p>
                <p className="text-xs text-blue-200/75">Limit ad tracking on Fire OS</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={nonPersonalizedAds}
              onClick={onToggleNonPersonalizedAds}
              className={`relative w-14 h-8 rounded-full transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400 ${
                nonPersonalizedAds ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            >
              <span
                className={`block w-6 h-6 rounded-full bg-white shadow transition-transform duration-150 ${
                  nonPersonalizedAds ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Reset Progress */}
          <div className="pt-1">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="w-full h-11 rounded-xl border border-rose-400/30 bg-rose-500/12 hover:bg-rose-500/20 text-rose-200 text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Saved Levels &amp; Scores</span>
              </button>
            ) : (
              <div className="p-3.5 rounded-xl border border-rose-400/40 bg-rose-950/50 space-y-3">
                <p className="text-xs text-rose-100 text-center">
                  Reset all unlocked levels, high scores, and booster counts?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="flex-1 h-10 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onResetProgress();
                      setConfirmReset(false);
                      onClose();
                    }}
                    className="flex-1 h-10 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Confirm Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
