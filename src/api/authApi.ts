import apiClient from './apiClient';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface ProfileResponse {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  group: string;
  course: number;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

/**
 * Авторизация пользователя
 * POST /api/auth/login/
 * Supports both email and username
 */
export const loginApi = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    // Пробуем отправить как есть
    const { data } = await apiClient.post<LoginResponse>('/auth/login/', credentials);
    return data;
  } catch (error: any) {
    // Если ошибка 400 и есть ошибка о email, пробуем с username
    if (error.response?.status === 400 && error.response?.data?.email) {
      const { data } = await apiClient.post<LoginResponse>('/auth/login/', {
        username: credentials.email,
        password: credentials.password,
      });
      return data;
    }
    throw error;
  }
};

/**
 * Получить профиль текущего пользователя
 * GET /api/profile/
 */
export const getProfileApi = async (): Promise<ProfileResponse> => {
  const { data } = await apiClient.get<ProfileResponse>('/profile/');
  return data;
};

export const changePasswordApi = async (payload: ChangePasswordRequest): Promise<void> => {
  try {
    // Основной вариант: JSON с old_password/new_password
    await apiClient.post('/profile/change-password/', {
      old_password: payload.current_password,
      new_password: payload.new_password,
    });
    return;
  } catch (error: any) {
    throw error;
  }
};
