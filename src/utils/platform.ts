/**
 * Platform Detection & Environment Utility
 * 
 * Segregates Web capabilities from Native Mobile App environments (Android APK, Android AAB, iOS App).
 * Under Google Play Store & Apple App Store guidelines and security architecture:
 * - Master Admin controls, passkeys, and root admin panels are EXCLUSIVELY available on the official Web platform.
 * - In Android APK, Android AAB, iOS builds, or native mobile WebViews, all Admin buttons,
 *   entry points, passkey modals, and admin views are completely stripped and inaccessible.
 */

export type AppPlatform = 'web' | 'android-apk' | 'ios-app';

/**
 * Checks whether the current build or runtime environment is a native mobile app
 * (e.g., Android APK, Android AAB, iOS IPA/App, Capacitor, Cordova, or Android WebView).
 */
export const isNativeMobileApp = (): boolean => {
  // 1. Build-time environment variable check (set during `npm run build:mobile` or `VITE_APP_PLATFORM=mobile`)
  if (import.meta.env.VITE_APP_PLATFORM === 'mobile') {
    return true;
  }

  // 2. Allow simulated preview via URL param (e.g. `?platform=mobile` or session storage override)
  if (typeof window !== 'undefined') {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const forcedPlatform = searchParams.get('platform');
      if (forcedPlatform === 'mobile' || forcedPlatform === 'app') {
        return true;
      }
      if (forcedPlatform === 'web') {
        return false;
      }
      
      const storedSimulation = sessionStorage.getItem('cps_simulated_platform');
      if (storedSimulation === 'mobile') {
        return true;
      }
      if (storedSimulation === 'web') {
        return false;
      }
    } catch {
      // Safe fallback if window/sessionStorage unavailable
    }

    // 3. Runtime Capacitor / Cordova Native Bridge Detection
    const win = window as any;
    if (win?.Capacitor?.isNativePlatform && win.Capacitor.isNativePlatform()) {
      return true;
    }
    if (win?.Capacitor?.getPlatform && win.Capacitor.getPlatform() !== 'web') {
      return true;
    }
    if (win?.cordova || win?._cordovaNative) {
      return true;
    }

    // 4. Android Native Bridge / Interface Check
    if (win?.Android || win?.AndroidBridge) {
      return true;
    }

    // 5. iOS WebKit Native Message Handlers Check
    if (win?.webkit?.messageHandlers && win?.webkit?.messageHandlers?.nativeApp) {
      return true;
    }

    // 6. Native WebView User-Agent Detection (Android APK WebView or iOS standalone app)
    const userAgent = navigator.userAgent || '';
    const isAndroidWebView = /wv|Android.*Version\/[0-9.]+\s+Chrome\/[0-9.]+\s+Mobile/i.test(userAgent);
    const isIosWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(userAgent);
    if (isAndroidWebView || isIosWebView) {
      return true;
    }
  }

  return false;
};

/**
 * Returns true if the Master Admin Panel and its UI triggers are allowed on the current platform.
 * Returns true ONLY on Web browsers.
 * Returns FALSE on Android APK/AAB and iOS builds.
 */
export const isAdminPortalSupported = (): boolean => {
  return !isNativeMobileApp();
};

/**
 * Returns the detected platform identity
 */
export const getCurrentPlatform = (): AppPlatform => {
  if (!isNativeMobileApp()) {
    return 'web';
  }
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  if (/iPad|iPhone|iPod/i.test(userAgent)) {
    return 'ios-app';
  }
  return 'android-apk';
};
