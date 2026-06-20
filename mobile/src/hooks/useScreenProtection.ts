import { useEffect } from 'react';
import { Platform } from 'react-native';

export function useScreenProtection(enabled = true) {
  useEffect(() => {
    if (!enabled || Platform.OS === 'web') {
      return undefined;
    }

    let mounted = true;

    async function enableProtection() {
      try {
        const ScreenCapture = await import('expo-screen-capture');
        await ScreenCapture.preventScreenCaptureAsync();
      } catch (error) {
        if (__DEV__) {
          console.warn('[screen protection] failed to enable', error);
        }
      }
    }

    void enableProtection();

    return () => {
      mounted = false;

      async function disableProtection() {
        try {
          const ScreenCapture = await import('expo-screen-capture');

          if (!mounted) {
            await ScreenCapture.allowScreenCaptureAsync();
          }
        } catch (error) {
          if (__DEV__) {
            console.warn('[screen protection] failed to disable', error);
          }
        }
      }

      void disableProtection();
    };
  }, [enabled]);
}
