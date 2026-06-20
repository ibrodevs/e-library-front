export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthApiUser {
  id?: number;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  username?: string;
  email?: string;
  group?: string;
  student_id?: string;
  course?: number | string;
}

export interface LoginResponse {
  access: string | null;
  refresh: string | null;
  user: UserProfile | null;
}

export interface UserProfile {
  id?: number;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  username?: string;
  email?: string;
  group?: string;
  student_id?: string;
  course?: number | string;
}

export interface AuthSession {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
}

export interface RefreshTokenResponse {
  access: string | null;
}
