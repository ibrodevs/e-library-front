import type { AuthToken, Student } from '../types/auth';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

/**
 * Сохранить токен авторизации
 */
export const saveAuthToken = (token: string, expiresIn: number = 24 * 60 * 60 * 1000): void => {
  const authToken: AuthToken = {
    token,
    expiresAt: Date.now() + expiresIn,
  };
  localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(authToken));
};

/**
 * Получить токен авторизации
 */
export const getAuthToken = (): string | null => {
  try {
    const stored = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!stored) return null;

    const authToken: AuthToken = JSON.parse(stored);
    
    // Проверяем, не истек ли токен
    if (Date.now() > authToken.expiresAt) {
      removeAuthToken();
      return null;
    }

    return authToken.token;
  } catch {
    return null;
  }
};

/**
 * Удалить токен авторизации
 */
export const removeAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

/**
 * Проверить, авторизован ли пользователь
 */
export const isAuthenticated = (): boolean => {
  return getAuthToken() !== null;
};

/**
 * Сохранить данные пользователя
 */
export const saveUserData = (user: Student): void => {
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
};

/**
 * Получить данные пользователя
 */
export const getUserData = (): Student | null => {
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
  removeAuthToken();
  removeUserData();
};

/**
 * Имитация API логина (заглушка)
 */
export const mockLogin = async (
  studentIdOrEmail: string,
  password: string
): Promise<{ token: string; user: Student }> => {
  // Имитация задержки сети
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Простая валидация (в реальности это делается на сервере)
  if (!studentIdOrEmail || !password) {
    throw new Error('Заполните все поля');
  }

  // Проверяем пароль (фиксированный для всех пользователей)
  if (password !== 'test1234') {
    throw new Error('Неверный пароль');
  }

  // Возвращаем мок-данные с сохраненным паролем
  return {
    token: 'mock_token_' + Math.random().toString(36).substr(2, 9),
    user: {
      id: '1',
      firstName: 'Алим',
      lastName: 'Салымбеков',
      middleName: 'Азаматович',
      studentId: studentIdOrEmail.includes('@') ? 'STU001234' : studentIdOrEmail,
      email: studentIdOrEmail.includes('@') ? studentIdOrEmail : 'student@su.edu.kg',
      password: 'test1234',
      avatar: 'https://ui-avatars.com/api/?name=Alim+Salymbekov&background=3b82f6&color=fff&size=200',
      department: 'Факультет компьютерных наук',
      course: 3,
      group: 'КТ-3-1',
    },
  };
};
