import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Компонент для защиты приватных роутов
 * Перенаправляет на страницу логина, если пользователь не авторизован
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const isAuth = isAuthenticated();

  if (!isAuth) {
    // Сохраняем текущую страницу, чтобы вернуться после логина
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
