import axios from 'axios';
import { getAuthToken, logout } from '../utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL;

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
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
export { API_BASE_URL };
