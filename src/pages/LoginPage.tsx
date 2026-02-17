import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUser, FaLock, FaSpinner, FaBook } from 'react-icons/fa';
import { mockLogin, saveAuthToken, saveUserData } from '../utils/auth';

interface FormData {
  studentIdOrEmail: string;
  password: string;
}

interface FormErrors {
  studentIdOrEmail?: string;
  password?: string;
  general?: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/profile';
  const needsAuth = !!(location.state as any)?.from;

  const [formData, setFormData] = useState<FormData>({
    studentIdOrEmail: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Валидация email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Валидация формы
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Проверка поля студента/email
    if (!formData.studentIdOrEmail.trim()) {
      newErrors.studentIdOrEmail = 'Это поле обязательно';
    } else if (
      formData.studentIdOrEmail.includes('@') &&
      !isValidEmail(formData.studentIdOrEmail)
    ) {
      newErrors.studentIdOrEmail = 'Неверный формат email';
    }

    // Проверка пароля
    if (!formData.password) {
      newErrors.password = 'Введите пароль';
    } else if (formData.password.length < 4) {
      newErrors.password = 'Пароль должен быть не менее 4 символов';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обработка изменения полей
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Очищаем ошибку для этого поля
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // Обработка отправки формы
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Валидация
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Имитация API запроса
      const { token, user } = await mockLogin(
        formData.studentIdOrEmail,
        formData.password
      );

      // Сохраняем токен и данные пользователя
      saveAuthToken(token);
      saveUserData(user);

      // Редирект на страницу откуда пришел или на профиль
      navigate(from, { replace: true });
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Ошибка авторизации',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 overflow-hidden">
      {/* Анимированный фон с blob эффектами */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Blob 1 - Синий */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob-1" />
        
        {/* Blob 2 - Индиго */}
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob-2" />
        
        {/* Blob 3 - Циан */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob-3" />
        
        {/* Дополнительные декоративные элементы */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-float" />
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-2xl opacity-15 animate-pulse-slow" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Карточка логина */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
          {/* Логотип и заголовок */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg"
            >
              <FaBook className="text-white text-2xl" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Добро пожаловать
            </h1>
            <p className="text-slate-300">
              Войдите в личный кабинет студента
            </p>
          </div>

          {/* Сообщение о необходимости авторизации */}
          {needsAuth && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-blue-500/20 border border-blue-400/50 rounded-xl backdrop-blur-sm"
            >
              <p className="text-sm text-blue-100 text-center">
                ⚠️ Для просмотра и чтения книг необходимо войти в систему
              </p>
            </motion.div>
          )}

          {/* Форма */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Поле студенческого / Email */}
            <div>
              <label
                htmlFor="studentIdOrEmail"
                className="block text-sm font-medium text-slate-200 mb-2"
              >
                Номер студенческого / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-slate-400" />
                </div>
                <input
                  type="text"
                  id="studentIdOrEmail"
                  name="studentIdOrEmail"
                  value={formData.studentIdOrEmail}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 bg-white/5 border ${
                    errors.studentIdOrEmail
                      ? 'border-red-400 focus:ring-red-500'
                      : 'border-slate-600 focus:ring-blue-500'
                  } rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                  placeholder="STU001234 или student@su.edu.kg"
                />
              </div>
              {errors.studentIdOrEmail && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-400"
                >
                  {errors.studentIdOrEmail}
                </motion.p>
              )}
            </div>

            {/* Поле пароля */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-200 mb-2"
              >
                Пароль
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-slate-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 bg-white/5 border ${
                    errors.password
                      ? 'border-red-400 focus:ring-red-500'
                      : 'border-slate-600 focus:ring-blue-500'
                  } rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-400"
                >
                  {errors.password}
                </motion.p>
              )}
            </div>

            {/* Общая ошибка */}
            {errors.general && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl"
              >
                <p className="text-sm text-red-400 text-center">
                  {errors.general}
                </p>
              </motion.div>
            )}

            {/* Кнопка входа */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className={`w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-300 flex items-center justify-center gap-2 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Вход...</span>
                </>
              ) : (
                <span>Войти</span>
              )}
            </motion.button>

            {/* Дополнительные ссылки */}
            <div className="text-center">
              <Link
                to="/"
                className="text-sm text-slate-300 hover:text-white transition-colors"
              >
                ← Вернуться на главную
              </Link>
            </div>
          </form>

          {/* Подсказка для тестирования */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <p className="text-xs text-slate-300 text-center">
              <strong className="text-blue-400">Для тестирования:</strong> <br />
              Введите любой email или студенческий и пароль (мин. 4 символа)
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
