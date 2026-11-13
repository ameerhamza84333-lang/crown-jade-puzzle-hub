/**
 * src/config/admob.config.js
 * ---------------------------------------------------------------------------
 * Live Production Google AdMob Configuration (Android & Amazon Appstore)
 *
 * Ensure `android/app/src/main/AndroidManifest.xml` also contains your App ID:
 *   <meta-data
 *     android:name="com.google.android.gms.ads.APPLICATION_ID"
 *     android:value="ca-app-pub-3129876015229913~1201947084" />
 */

export const ADMOB_APP_ID = 'ca-app-pub-3129876015229913~1201947084';

export const BANNER_AD_ID = 'ca-app-pub-3129876015229913/9703253634';
export const REWARDED_AD_ID = 'ca-app-pub-3129876015229913/2384980903';

// Optional: add a live Interstitial Ad Unit ID if you enable interstitials later
export const INTERSTITIAL_AD_ID = '';

// Production mode: test ads disabled
export const IS_TESTING = false;

export const ADMOB_CONFIG = {
  ADMOB_APP_ID,
  BANNER_AD_ID,
  REWARDED_AD_ID,
  INTERSTITIAL_AD_ID,
  IS_TESTING,
  isTesting: IS_TESTING,

  // Amazon Fire OS / Non-GMS safety controls
  AD_LOAD_TIMEOUT_MS: 3500,
  INTERSTITIAL_COOLDOWN_MS: 45000,
  NON_PERSONALIZED_ADS_DEFAULT: true,
};

export default ADMOB_CONFIG;
