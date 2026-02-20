import axios from 'axios';
import { getAuthToken, logout } from '../utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

console.log('🔧 API Configuration:', { baseURL: API_BASE_URL });

/**
 * Центральный Axios-клиент с JWT-авторизацией
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: добавляем Authorization header к каждому запросу
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    const storedTokens = localStorage.getItem('access_token');
    
    console.log('📤 OUTGOING REQUEST:', {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL || API_BASE_URL}${config.url || ''}`,
      hasToken: !!token,
      storedTokenExists: !!storedTokens,
      tokenLength: token?.length || 0,
    });
    
    if (!token) {
      console.error('❌ NO TOKEN FOUND!');
      console.log('localStorage content:', {
        access_token: localStorage.getItem('access_token') ? '✓ EXISTS' : '✗ MISSING',
        refresh_token: localStorage.getItem('refresh_token') ? '✓ EXISTS' : '✗ MISSING',
        user_data: localStorage.getItem('user_data') ? '✓ EXISTS' : '✗ MISSING',
      });
    } else {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Authorization header added');
      console.log('Token preview:', token.substring(0, 30) + '...');
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: обработка 401 ошибок (невалидный/истёкший токен)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('⚠️ 401 Unauthorized - logging out');
      logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
export { API_BASE_URL };
