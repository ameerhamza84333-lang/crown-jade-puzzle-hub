export interface AppSaveState {
  isSoundEnabled: boolean;
  nonPersonalizedAds: boolean;
  blockBlast: {
    adventureLevel: number;
    adventureHighScore: number;
    classicHighScore: number;
    lastMode: 'adventure' | 'endless';
  };
  mahjong: {
    level: number;
    highScore: number;
    hints: number;
    undos: number;
    shuffles: number;
  };
  dailyChallenge: {
    blockBlastCompletedDate: string | null;
    mahjongCompletedDate: string | null;
    streak: number;
    lastStreakDate: string | null;
  };
}

const STORAGE_KEY = 'crown_jade_puzzle_hub_v1';

export const DEFAULT_SAVE_STATE: AppSaveState = {
  isSoundEnabled: true,
  nonPersonalizedAds: true,
  blockBlast: {
    adventureLevel: 1,
    adventureHighScore: 0,
    classicHighScore: 0,
    lastMode: 'adventure',
  },
  mahjong: {
    level: 1,
    highScore: 0,
    hints: 2,
    undos: 2,
    shuffles: 2,
  },
  dailyChallenge: {
    blockBlastCompletedDate: null,
    mahjongCompletedDate: null,
    streak: 0,
    lastStreakDate: null,
  },
};

export function loadSaveState(): AppSaveState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_SAVE_STATE);
    const parsed = JSON.parse(raw) as Partial<AppSaveState>;
    return {
      isSoundEnabled:
        typeof parsed.isSoundEnabled === 'boolean'
          ? parsed.isSoundEnabled
          : DEFAULT_SAVE_STATE.isSoundEnabled,
      nonPersonalizedAds:
        typeof parsed.nonPersonalizedAds === 'boolean'
          ? parsed.nonPersonalizedAds
          : DEFAULT_SAVE_STATE.nonPersonalizedAds,
      blockBlast: {
        adventureLevel: Math.max(
          1,
          Number(parsed.blockBlast?.adventureLevel) || DEFAULT_SAVE_STATE.blockBlast.adventureLevel,
        ),
        adventureHighScore: Math.max(
          0,
          Number(parsed.blockBlast?.adventureHighScore) || 0,
        ),
        classicHighScore: Math.max(
          0,
          Number(parsed.blockBlast?.classicHighScore) || 0,
        ),
        lastMode: parsed.blockBlast?.lastMode === 'endless' ? 'endless' : 'adventure',
      },
      mahjong: {
        level: Math.max(1, Number(parsed.mahjong?.level) || DEFAULT_SAVE_STATE.mahjong.level),
        highScore: Math.max(0, Number(parsed.mahjong?.highScore) || 0),
        hints:
          typeof parsed.mahjong?.hints === 'number'
            ? Math.max(0, parsed.mahjong.hints)
            : DEFAULT_SAVE_STATE.mahjong.hints,
        undos:
          typeof parsed.mahjong?.undos === 'number'
            ? Math.max(0, parsed.mahjong.undos)
            : DEFAULT_SAVE_STATE.mahjong.undos,
        shuffles:
          typeof parsed.mahjong?.shuffles === 'number'
            ? Math.max(0, parsed.mahjong.shuffles)
            : DEFAULT_SAVE_STATE.mahjong.shuffles,
      },
      dailyChallenge: {
        blockBlastCompletedDate:
          typeof parsed.dailyChallenge?.blockBlastCompletedDate === 'string'
            ? parsed.dailyChallenge.blockBlastCompletedDate
            : null,
        mahjongCompletedDate:
          typeof parsed.dailyChallenge?.mahjongCompletedDate === 'string'
            ? parsed.dailyChallenge.mahjongCompletedDate
            : null,
        streak: Math.max(0, Number(parsed.dailyChallenge?.streak) || 0),
        lastStreakDate:
          typeof parsed.dailyChallenge?.lastStreakDate === 'string'
            ? parsed.dailyChallenge.lastStreakDate
            : null,
      },
    };
  } catch {
    return structuredClone(DEFAULT_SAVE_STATE);
  }
}

export function persistSaveState(state: AppSaveState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota or private browsing errors gracefully
  }
}

export function resetSaveState(): AppSaveState {
  const fresh = structuredClone(DEFAULT_SAVE_STATE);
  persistSaveState(fresh);
  return fresh;
}
