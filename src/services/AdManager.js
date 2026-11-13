/**
 * AdManager.js
 * ---------------------------------------------------------------------------
 * Production Google AdMob Integration Layer (@capacitor-community/admob)
 * with Safe Fallback for Web Preview & Amazon Fire OS / Non-GMS Devices.
 *
 * Uses live production IDs and `isTesting: false` from `src/config/admob.config.js`.
 *
 * Android Manifest Setup (`android/app/src/main/AndroidManifest.xml`):
 *   <meta-data
 *     android:name="com.google.android.gms.ads.APPLICATION_ID"
 *     android:value="ca-app-pub-3129876099942544~3347511713" />
 *   (Replace with ADMOB_APP_ID: ca-app-pub-3129876015229913~1201947084)
 */

import {
  ADMOB_CONFIG,
  ADMOB_APP_ID,
  BANNER_AD_ID,
  REWARDED_AD_ID,
  INTERSTITIAL_AD_ID,
  IS_TESTING,
} from '../config/admob.config.js';

export {
  ADMOB_CONFIG,
  ADMOB_APP_ID,
  BANNER_AD_ID,
  REWARDED_AD_ID,
  INTERSTITIAL_AD_ID,
  IS_TESTING,
};

/**
 * Detects Amazon Fire OS devices (e.g. Silk, KF* Fire tablet models, Amazon build).
 * Fire OS devices generally ship without Google Mobile Services (GMS).
 */
export function isAmazonFireDevice() {
  try {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /\b(Silk|Kindle|KF[A-Z0-9]{2,}|Amazon|FireOS)\b/i.test(ua);
  } catch {
    return false;
  }
}

/**
 * Resolves the native @capacitor-community/admob Capacitor plugin bridge if running
 * in a native Android shell with GMS available. Returns null in web preview.
 */
function getNativeAdMobPlugin() {
  try {
    if (typeof window === 'undefined') return null;
    const cap = window.Capacitor;
    if (!cap) return null;
    if (typeof cap.isNativePlatform === 'function' && !cap.isNativePlatform()) {
      return null;
    }
    return cap.Plugins?.AdMob || null;
  } catch {
    return null;
  }
}

/**
 * Wraps any promise with a hard timeout so missing GMS services on Fire OS
 * can never hang the UI thread or block level progression.
 */
function withTimeout(promise, ms = ADMOB_CONFIG.AD_LOAD_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Ad request timed out'));
    }, ms);
    Promise.resolve(promise)
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

class AdManagerService {
  constructor() {
    this.initialized = false;
    this.bannerVisible = false;
    this.lastInterstitialAt = 0;
    this.nonPersonalizedAds = ADMOB_CONFIG.NON_PERSONALIZED_ADS_DEFAULT;
  }

  /**
   * Initializes @capacitor-community/admob in production mode (`isTesting: false`).
   * On Amazon Fire OS or web preview without native GMS, safely degrades to fallback mode.
   */
  async initialize() {
    if (this.initialized) return { ok: true, mode: 'cached' };
    try {
      const adMob = getNativeAdMobPlugin();
      if (!adMob || isAmazonFireDevice()) {
        this.initialized = true;
        return { ok: true, mode: isAmazonFireDevice() ? 'fire-safe-fallback' : 'web-preview' };
      }

      await withTimeout(
        adMob.initialize({
          appId: ADMOB_APP_ID,
          requestTrackingAuthorization: false,
          initializeForTesting: IS_TESTING,
        }),
      );
      this.initialized = true;
      return { ok: true, mode: 'native-admob' };
    } catch {
      this.initialized = true;
      return { ok: false, mode: 'safe-degraded' };
    }
  }

  setNonPersonalizedAds(enabled) {
    this.nonPersonalizedAds = Boolean(enabled);
  }

  /**
   * Displays the single persistent bottom banner ad using BANNER_AD_ID.
   * Idempotent across screen switches so duplicate banners are never stacked.
   */
  async showBannerAd() {
    try {
      await this.initialize();
      const adMob = getNativeAdMobPlugin();
      if (!adMob || isAmazonFireDevice()) {
        this.bannerVisible = true;
        return { shown: true, fallback: true, adId: BANNER_AD_ID };
      }

      if (this.bannerVisible) {
        if (typeof adMob.resumeBanner === 'function') {
          await withTimeout(adMob.resumeBanner(), 1500);
        }
        return { shown: true, fallback: false, adId: BANNER_AD_ID };
      }

      await withTimeout(
        adMob.showBanner({
          adId: BANNER_AD_ID,
          adSize: 'BANNER',
          position: 'BOTTOM_CENTER',
          margin: 0,
          isTesting: IS_TESTING,
          npa: this.nonPersonalizedAds,
        }),
      );
      this.bannerVisible = true;
      return { shown: true, fallback: false, adId: BANNER_AD_ID };
    } catch {
      this.bannerVisible = false;
      return { shown: false, fallback: true, adId: BANNER_AD_ID };
    }
  }

  async hideBannerAd() {
    try {
      const adMob = getNativeAdMobPlugin();
      if (adMob && !isAmazonFireDevice()) {
        await withTimeout(adMob.hideBanner(), 1500);
      }
      this.bannerVisible = false;
    } catch {
      this.bannerVisible = false;
    }
  }

  /**
   * Shows an interstitial ad only if a live INTERSTITIAL_AD_ID is configured.
   * Never throws or blocks user flow if ad fails or device lacks GMS.
   */
  async showInterstitialAd() {
    if (!INTERSTITIAL_AD_ID) {
      return { shown: false, reason: 'not-configured' };
    }

    const now = Date.now();
    if (now - this.lastInterstitialAt < ADMOB_CONFIG.INTERSTITIAL_COOLDOWN_MS) {
      return { shown: false, reason: 'cooldown' };
    }

    try {
      await this.initialize();
      const adMob = getNativeAdMobPlugin();
      if (!adMob || isAmazonFireDevice()) {
        this.lastInterstitialAt = now;
        return { shown: false, reason: 'non-gms-fallback' };
      }

      await withTimeout(
        adMob.prepareInterstitial({
          adId: INTERSTITIAL_AD_ID,
          isTesting: IS_TESTING,
          npa: this.nonPersonalizedAds,
        }),
      );
      await withTimeout(adMob.showInterstitial(), 8000);
      this.lastInterstitialAt = Date.now();
      return { shown: true };
    } catch {
      return { shown: false, reason: 'graceful-degradation' };
    }
  }

  /**
   * Loads and shows a Rewarded Video Ad using REWARDED_AD_ID (`isTesting: false`)
   * and triggers `onRewardEarned()` to refill Mahjong boosters (+2 uses).
   * Safely degrades on Web Preview / Amazon Fire OS / timeouts.
   *
   * @param {(reward: { type: string, amount: number, source: string }) => void} onRewardEarned
   * @param {() => void} [onAdFailed]
   */
  async showRewardedAd(onRewardEarned, onAdFailed) {
    try {
      await this.initialize();
      const adMob = getNativeAdMobPlugin();

      if (!adMob || isAmazonFireDevice()) {
        await new Promise((resolve) => setTimeout(resolve, 1100));
        if (typeof onRewardEarned === 'function') {
          onRewardEarned({ type: 'booster_refill', amount: 2, source: 'safe-fallback' });
        }
        return { rewarded: true, fallback: true, adId: REWARDED_AD_ID };
      }

      await withTimeout(
        adMob.prepareRewardVideoAd({
          adId: REWARDED_AD_ID,
          isTesting: IS_TESTING,
          npa: this.nonPersonalizedAds,
        }),
      );

      const rewardResult = await withTimeout(adMob.showRewardVideoAd(), 45000);
      if (typeof onRewardEarned === 'function') {
        onRewardEarned({
          type: rewardResult?.type || 'booster_refill',
          amount: rewardResult?.amount || 2,
          source: 'admob',
        });
      }
      return { rewarded: true, fallback: false, adId: REWARDED_AD_ID };
    } catch {
      try {
        if (typeof onRewardEarned === 'function') {
          onRewardEarned({ type: 'booster_refill', amount: 2, source: 'timeout-fallback' });
        }
      } catch {
        if (typeof onAdFailed === 'function') onAdFailed();
      }
      return { rewarded: true, fallback: true, adId: REWARDED_AD_ID };
    }
  }
}

export const AdManager = new AdManagerService();
export default AdManager;
