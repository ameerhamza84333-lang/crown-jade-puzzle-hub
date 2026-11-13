import React, { useEffect } from 'react';
import { AdManager } from '../services/AdManager.js';

interface BannerAdSlotProps {
  theme?: 'home' | 'blue' | 'jade';
}

export const BannerAdSlot: React.FC<BannerAdSlotProps> = ({ theme = 'home' }) => {
  useEffect(() => {
    void AdManager.showBannerAd();
  }, []);

  const bgClass =
    theme === 'jade'
      ? 'bg-[#042117] border-emerald-800/60 text-emerald-300/70'
      : theme === 'blue'
        ? 'bg-[#050E29] border-blue-800/60 text-blue-300/70'
        : 'bg-[#050C24] border-white/10 text-slate-400';

  return (
    <aside
      aria-label="Advertisement"
      className={`h-[50px] w-full shrink-0 border-t flex items-center justify-center px-4 select-none ${bgClass}`}
    >
      <div className="w-full max-w-[320px] h-[38px] rounded border border-dashed border-current/25 flex items-center justify-between px-3 text-xs">
        <span className="font-mono tracking-tight uppercase opacity-75">Ad Banner · 320×50</span>
        <span className="opacity-60">Amazon / AdMob Ready</span>
      </div>
    </aside>
  );
};
