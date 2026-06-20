import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { AuthSession, UserProfile } from '../../types/auth';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_DATA_KEY = 'user_data';

async function setTokenItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function getTokenItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function deleteTokenItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export const tokenStorage = {
  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      setTokenItem(ACCESS_TOKEN_KEY, accessToken),
      setTokenItem(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  },

  async getAccessToken(): Promise<string | null> {
    return getTokenItem(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return getTokenItem(REFRESH_TOKEN_KEY);
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      deleteTokenItem(ACCESS_TOKEN_KEY),
      deleteTokenItem(REFRESH_TOKEN_KEY),
    ]);
  },

  async saveUserData(user: UserProfile): Promise<void> {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  },

  async getUserData(): Promise<UserProfile | null> {
    const raw = await AsyncStorage.getItem(USER_DATA_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  },

  async clearUserData(): Promise<void> {
    await AsyncStorage.removeItem(USER_DATA_KEY);
  },

  async clearAuthStorage(): Promise<void> {
    await Promise.all([this.clearTokens(), this.clearUserData()]);
  },

  async restoreSession(): Promise<AuthSession> {
    const [accessToken, refreshToken, user] = await Promise.all([
      this.getAccessToken(),
      this.getRefreshToken(),
      this.getUserData(),
    ]);

    return {
      accessToken,
      refreshToken,
      user,
    };
  },
};
