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

export const loginApi = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const { data } = await apiClient.post<LoginResponse>('/auth/login/', credentials);
  return data;
};

export const getProfileApi = async (): Promise<ProfileResponse> => {
  const { data } = await apiClient.get<ProfileResponse>('/profile/');
  return data;
};

export const changePasswordApi = async (payload: ChangePasswordRequest): Promise<void> => {
  await apiClient.post('/profile/change-password/', {
    old_password: payload.current_password,
    new_password: payload.new_password,
  });
};
