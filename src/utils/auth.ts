import type { UserProfile } from '../types/auth';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_DATA_KEY = 'user_data';

/**
 * Сохранить JWT токены
 */
export const saveTokens = (access: string, refresh: string): void => {
  console.log('💾 Saving tokens to localStorage:', {
    accessLength: access.length,
    refreshLength: refresh.length,
  });
  
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  
  console.log('✅ Tokens saved. Verifying...', {
    accessTokenSaved: !!localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshTokenSaved: !!localStorage.getItem(REFRESH_TOKEN_KEY),
  });
};

/**
 * Получить access token
 */
export const getAuthToken = (): string | null => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) {
    console.warn('⚠️ getAuthToken: NO TOKEN FOUND in localStorage');
  } else {
    console.log('✅ getAuthToken: Token found, length:', token.length);
  }
  return token;
};

/**
 * Получить refresh token
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Удалить токены авторизации
 */
export const removeAuthToken = (): void => {
  console.log('🗑️ Removing tokens from localStorage');
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * Проверить, авторизован ли пользователь
 */
export const isAuthenticated = (): boolean => {
  const isAuth = getAuthToken() !== null;
  console.log('🔐 isAuthenticated:', isAuth);
  return isAuth;
};

/**
 * Сохранить данные пользователя
 */
export const saveUserData = (user: UserProfile): void => {
  console.log('💾 Saving user data:', user);
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
};

/**
 * Получить данные пользователя
 */
export const getUserData = (): UserProfile | null => {
  try {
    const stored = localStorage.getItem(USER_DATA_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

/**
 * Удалить данные пользователя
 */
export const removeUserData = (): void => {
  localStorage.removeItem(USER_DATA_KEY);
};

/**
 * Полный выход из системы
 */
export const logout = (): void => {
  console.log('🚪 Logging out - removing all auth data');
  removeAuthToken();
  removeUserData();
};
