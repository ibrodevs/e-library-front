import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS } from '../../constants/config';
import { tokenStorage } from '../auth/tokenStorage';

let unauthorizedHandler: null | (() => void | Promise<void>) = null;
let refreshPromise: Promise<string | null> | null = null;

export function setUnauthorizedHandler(handler: null | (() => void | Promise<void>)) {
  unauthorizedHandler = handler;
}

async function getFreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshTokenValue = await tokenStorage.getRefreshToken();

      if (!refreshTokenValue) {
        return null;
      }

      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/token/refresh/`,
          { refresh: refreshTokenValue },
          {
            timeout: API_TIMEOUT_MS,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const nextAccessToken = data?.access ?? null;

        if (!nextAccessToken) {
          return null;
        }

        await tokenStorage.saveTokens(nextAccessToken, refreshTokenValue);
        return nextAccessToken;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const accessToken = await tokenStorage.getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      const nextAccessToken = await getFreshAccessToken();

      if (nextAccessToken) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
        return apiClient(originalRequest);
      }
    }

    if (error.response?.status === 401) {
      await tokenStorage.clearAuthStorage();

      if (unauthorizedHandler) {
        await unauthorizedHandler();
      }

      // TODO: if auth handling grows, move logout orchestration out of the interceptor layer.
    }

    return Promise.reject(error);
  }
);
