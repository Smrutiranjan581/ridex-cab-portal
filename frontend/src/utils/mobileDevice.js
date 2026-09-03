import { Geolocation } from '@capacitor/geolocation';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { App as CapApp } from '@capacitor/app';

// Detect if running on native mobile shell
export const isNativeMobile = () => {
  return typeof window !== 'undefined' && window.Capacitor?.isNativePlatform();
};

export const getAppTarget = () => {
  return import.meta.env.VITE_APP_TARGET || 'web';
};

// Initialize Mobile App Native Chrome & Status Bar
export const initMobileDeviceExperience = async (appTarget = 'rider') => {
  if (!isNativeMobile()) return;

  try {
    if (appTarget === 'rider') {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#0F172A' });
    } else if (appTarget === 'captain') {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#020617' });
    }

    // Android Hardware Back Button listener
    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        CapApp.exitApp();
      } else {
        window.history.back();
      }
    });
  } catch (err) {
    console.log('Mobile device init info:', err);
  }
};

// High-accuracy native GPS Geolocation
export const getNativeCurrentPosition = async () => {
  try {
    if (isNativeMobile()) {
      const perm = await Geolocation.checkPermissions();
      if (perm.location !== 'granted') {
        const req = await Geolocation.requestPermissions();
        if (req.location !== 'granted') {
          return null;
        }
      }
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000
      });
      return {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude,
        accuracy: coordinates.coords.accuracy,
        speed: coordinates.coords.speed,
        heading: coordinates.coords.heading
      };
    }
  } catch (e) {
    console.warn('Native GPS fallback to browser:', e);
  }

  // Browser Fallback
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
};

// Native Vibration / Haptic Feedback
export const triggerHaptic = async (style = 'medium') => {
  try {
    if (isNativeMobile()) {
      if (style === 'heavy') {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } else if (style === 'light') {
        await Haptics.impact({ style: ImpactStyle.Light });
      } else {
        await Haptics.impact({ style: ImpactStyle.Medium });
      }
    } else if ('vibrate' in navigator) {
      navigator.vibrate(style === 'heavy' ? [100, 50, 100] : 50);
    }
  } catch (e) {}
};
