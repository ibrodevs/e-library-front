import type { UserProfile } from '../../types/auth';
import { apiClient } from './client';

function normalizeProfile(data: any): UserProfile {
  return {
    id: data?.id,
    first_name: data?.first_name,
    last_name: data?.last_name,
    full_name: data?.full_name,
    username: data?.username,
    email: data?.email,
    group: data?.group,
    student_id: data?.student_id,
    course: data?.course,
  };
}

export async function getProfile(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>('/profile/');
  return normalizeProfile(data);
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  await apiClient.post('/profile/change-password/', {
    old_password: oldPassword,
    new_password: newPassword,
  });
}
