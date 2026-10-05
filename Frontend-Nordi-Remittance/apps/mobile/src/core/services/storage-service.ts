import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'nordi_has_seen_onboarding';

export const storageService = {
  async hasSeenOnboarding(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(ONBOARDING_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  },
  async setSeenOnboarding(seen = true): Promise<void> {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, seen ? 'true' : 'false');
    } catch {
      // non-blocking
    }
  },
};
