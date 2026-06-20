import type { AuthApiUser, LoginResponse, RefreshTokenResponse, UserProfile } from '../../types/auth';
import { apiClient } from './client';

function normalizeUser(input: unknown): UserProfile | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const raw = input as AuthApiUser;

  return {
    id: raw.id,
    first_name: raw.first_name,
    last_name: raw.last_name,
    full_name: raw.full_name,
    username: raw.username,
    email: raw.email,
    group: raw.group,
    student_id: raw.student_id,
    course: raw.course,
  };
}

function normalizeLoginResponse(data: any): LoginResponse {
  return {
    access: data?.access ?? data?.tokens?.access ?? null,
    refresh: data?.refresh ?? data?.tokens?.refresh ?? null,
    user: normalizeUser(data?.user ?? data?.profile ?? data?.student ?? null),
  };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post('/auth/login/', { email, password });
  return normalizeLoginResponse(data);
}

export async function refreshToken(refreshTokenValue: string): Promise<RefreshTokenResponse> {
  const { data } = await apiClient.post('/auth/token/refresh/', {
    refresh: refreshTokenValue,
  });

  return {
    access: data?.access ?? null,
  };
}
