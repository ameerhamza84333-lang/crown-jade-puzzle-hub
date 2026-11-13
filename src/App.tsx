import { useCallback, useEffect, useState } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { SettingsModal } from './components/SettingsModal';
import { BlockBlastGame } from './games/blockBlast/BlockBlastGame';
import { MahjongGame } from './games/mahjong/MahjongGame';
import {
  AppSaveState,
  loadSaveState,
  persistSaveState,
  resetSaveState,
} from './services/storage';
import { SoundFX } from './services/sound';
import { AdManager } from './services/AdManager.js';
import {
  DAILY_BOOSTER_REWARD,
  getTodayDateKey,
  getYesterdayDateKey,
} from './services/dailyChallenge';

type ActiveScreen =
  | 'home'
  | 'block_blast'
  | 'mahjong'
  | 'block_blast_daily'
  | 'mahjong_daily';

export default function App() {
  const [saveState, setSaveState] = useState<AppSaveState>(() => loadSaveState());
  const [screen, setScreen] = useState<ActiveScreen>('home');
  const [todayKey, setTodayKey] = useState<string>(() => getTodayDateKey());
  const [blockBlastStartMode, setBlockBlastStartMode] = useState<'adventure' | 'endless'>(
    () => saveState.blockBlast.lastMode,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Sync global SoundFX & AdManager privacy state on mount and state changes
  useEffect(() => {
    SoundFX.setEnabled(saveState.isSoundEnabled);
    AdManager.setNonPersonalizedAds(saveState.nonPersonalizedAds);
    persistSaveState(saveState);
  }, [saveState]);

  useEffect(() => {
    void AdManager.initialize();
  }, []);

  // Automatically roll over Daily Challenge at local midnight
  useEffect(() => {
    const interval = window.setInterval(() => {
      const nextKey = getTodayDateKey();
      setTodayKey((prev) => (prev !== nextKey ? nextKey : prev));
    }, 30000);
    return () => window.clearInterval(interval);
  }, []);

  const handleToggleSound = useCallback(() => {
    setSaveState((prev) => {
      const nextEnabled = !prev.isSoundEnabled;
      SoundFX.setEnabled(nextEnabled);
      if (nextEnabled) SoundFX.playTap();
      return { ...prev, isSoundEnabled: nextEnabled };
    });
  }, []);

  const handleToggleNpa = useCallback(() => {
    setSaveState((prev) => ({
      ...prev,
      nonPersonalizedAds: !prev.nonPersonalizedAds,
    }));
  }, []);

  const handleResetProgress = useCallback(() => {
    const fresh = resetSaveState();
    setSaveState(fresh);
    setScreen('home');
  }, []);

  const updateBlockBlastProgress = useCallback(
    (patch: Partial<AppSaveState['blockBlast']>) => {
      setSaveState((prev) => ({
        ...prev,
        blockBlast: {
          ...prev.blockBlast,
          ...patch,
        },
      }));
    },
    [],
  );

  const updateMahjongProgress = useCallback(
    (patch: Partial<AppSaveState['mahjong']>) => {
      setSaveState((prev) => ({
        ...prev,
        mahjong: {
          ...prev.mahjong,
          ...patch,
        },
      }));
    },
    [],
  );

  const handleCompleteDaily = useCallback(
    (game: 'block_blast' | 'mahjong', dateKey: string) => {
      setSaveState((prev) => {
        const alreadyDone =
          game === 'block_blast'
            ? prev.dailyChallenge.blockBlastCompletedDate === dateKey
            : prev.dailyChallenge.mahjongCompletedDate === dateKey;

        if (alreadyDone) return prev;

        const yesterdayKey = getYesterdayDateKey();
        const prevStreakDate = prev.dailyChallenge.lastStreakDate;
        const nextStreak =
          prevStreakDate === dateKey
            ? Math.max(1, prev.dailyChallenge.streak)
            : prevStreakDate === yesterdayKey
              ? prev.dailyChallenge.streak + 1
              : 1;

        return {
          ...prev,
          mahjong: {
            ...prev.mahjong,
            hints: prev.mahjong.hints + DAILY_BOOSTER_REWARD.hints,
            undos: prev.mahjong.undos + DAILY_BOOSTER_REWARD.undos,
            shuffles: prev.mahjong.shuffles + DAILY_BOOSTER_REWARD.shuffles,
          },
          dailyChallenge: {
            ...prev.dailyChallenge,
            blockBlastCompletedDate:
              game === 'block_blast' ? dateKey : prev.dailyChallenge.blockBlastCompletedDate,
            mahjongCompletedDate:
              game === 'mahjong' ? dateKey : prev.dailyChallenge.mahjongCompletedDate,
            streak: nextStreak,
            lastStreakDate: dateKey,
          },
        };
      });
    },
    [],
  );

  return (
    <>
      {screen === 'home' && (
        <HomeScreen
          saveState={saveState}
          todayKey={todayKey}
          onPlayBlockBlast={(mode) => {
            setBlockBlastStartMode(mode);
            setScreen('block_blast');
          }}
          onPlayMahjong={() => setScreen('mahjong')}
          onPlayDailyBlockBlast={() => setScreen('block_blast_daily')}
          onPlayDailyMahjong={() => setScreen('mahjong_daily')}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}

      {screen === 'block_blast' && (
        <BlockBlastGame
          initialMode={blockBlastStartMode}
          adventureLevel={saveState.blockBlast.adventureLevel}
          adventureHighScore={saveState.blockBlast.adventureHighScore}
          classicHighScore={saveState.blockBlast.classicHighScore}
          onUpdateProgress={updateBlockBlastProgress}
          onOpenSettings={() => setSettingsOpen(true)}
          onBackHome={() => setScreen('home')}
        />
      )}

      {screen === 'block_blast_daily' && (
        <BlockBlastGame
          initialMode="adventure"
          adventureLevel={1}
          adventureHighScore={saveState.blockBlast.adventureHighScore}
          classicHighScore={saveState.blockBlast.classicHighScore}
          dailyDateKey={todayKey}
          isDailyCompleted={saveState.dailyChallenge.blockBlastCompletedDate === todayKey}
          onCompleteDaily={(dk) => handleCompleteDaily('block_blast', dk)}
          onUpdateProgress={updateBlockBlastProgress}
          onOpenSettings={() => setSettingsOpen(true)}
          onBackHome={() => setScreen('home')}
        />
      )}

      {screen === 'mahjong' && (
        <MahjongGame
          level={saveState.mahjong.level}
          highScore={saveState.mahjong.highScore}
          hints={saveState.mahjong.hints}
          undos={saveState.mahjong.undos}
          shuffles={saveState.mahjong.shuffles}
          onUpdateProgress={updateMahjongProgress}
          onOpenSettings={() => setSettingsOpen(true)}
          onBackHome={() => setScreen('home')}
        />
      )}

      {screen === 'mahjong_daily' && (
        <MahjongGame
          level={1}
          highScore={saveState.mahjong.highScore}
          hints={saveState.mahjong.hints}
          undos={saveState.mahjong.undos}
          shuffles={saveState.mahjong.shuffles}
          dailyDateKey={todayKey}
          isDailyCompleted={saveState.dailyChallenge.mahjongCompletedDate === todayKey}
          onCompleteDaily={(dk) => handleCompleteDaily('mahjong', dk)}
          onUpdateProgress={updateMahjongProgress}
          onOpenSettings={() => setSettingsOpen(true)}
          onBackHome={() => setScreen('home')}
        />
      )}

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        isSoundEnabled={saveState.isSoundEnabled}
        onToggleSound={handleToggleSound}
        nonPersonalizedAds={saveState.nonPersonalizedAds}
        onToggleNonPersonalizedAds={handleToggleNpa}
        onResetProgress={handleResetProgress}
      />
    </>
  );
}
