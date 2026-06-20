import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { setUnauthorizedHandler } from '../services/api/client';
import { login as loginRequest } from '../services/api/authApi';
import { getProfile } from '../services/api/profileApi';
import { tokenStorage } from '../services/auth/tokenStorage';
import type { AuthSession, UserProfile } from '../types/auth';

interface AuthContextValue extends AuthSession {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  fetchProfile: () => Promise<UserProfile | null>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const syncLoggedOutState = async () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setError(null);
  };

  const fetchProfile = async (): Promise<UserProfile | null> => {
    const profile = await getProfile();
    setUser(profile);
    await tokenStorage.saveUserData(profile);
    return profile;
  };

  const restoreSession = async () => {
    setIsLoading(true);

    try {
      const session = await tokenStorage.restoreSession();

      if (!session.accessToken || !session.refreshToken) {
        await tokenStorage.clearAuthStorage();
        await syncLoggedOutState();
        return;
      }

      setAccessToken(session.accessToken);
      setRefreshToken(session.refreshToken);

      try {
        await fetchProfile();
      } catch {
        await tokenStorage.clearAuthStorage();
        await syncLoggedOutState();
      }
    } catch {
      await tokenStorage.clearAuthStorage();
      await syncLoggedOutState();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void restoreSession();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await syncLoggedOutState();
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await loginRequest(email, password);

      if (!response.access || !response.refresh) {
        throw new Error('Server did not return auth tokens.');
      }

      await tokenStorage.saveTokens(response.access, response.refresh);
      setAccessToken(response.access);
      setRefreshToken(response.refresh);

      if (response.user) {
        setUser(response.user);
        await tokenStorage.saveUserData(response.user);
      } else {
        await fetchProfile();
      }
    } catch (requestError: any) {
      await tokenStorage.clearAuthStorage();
      await syncLoggedOutState();
      setError(
        requestError?.response?.data?.detail ||
          requestError?.response?.data?.non_field_errors?.[0] ||
          requestError?.message ||
          'Failed to sign in.'
      );
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await tokenStorage.clearAuthStorage();
    await syncLoggedOutState();
    setIsLoading(false);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      refreshToken,
      user,
      isAuthenticated: Boolean(accessToken && user),
      isLoading,
      error,
      login,
      logout,
      restoreSession,
      fetchProfile,
      clearError,
    }),
    [accessToken, refreshToken, user, isLoading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthStore() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthStore must be used inside AuthProvider');
  }

  return context;
}
