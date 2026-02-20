import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLock, FaEye, FaEyeSlash, FaCheck, FaTimes } from 'react-icons/fa';
import { changePasswordApi } from '../api/authApi';

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
}

const ChangePasswordForm: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Валидация формы
  const validateForm = (): boolean => {
    const newErrors: PasswordErrors = {};

    // Проверка текущего пароля
    if (!formData.currentPassword) {
      newErrors.currentPassword = t('profile.passwordForm.errors.required');
    }

    // Проверка нового пароля
    if (!formData.newPassword) {
      newErrors.newPassword = t('profile.passwordForm.errors.newRequired');
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = t('profile.passwordForm.errors.tooShort');
    } else if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = t('profile.passwordForm.errors.same');
    }

    // Проверка подтверждения пароля
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('profile.passwordForm.errors.confirmRequired');
    } else if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = t('profile.passwordForm.errors.mismatch');
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
    if (errors[name as keyof PasswordErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
    // Очищаем сообщение об успехе
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  // Отправка формы
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await changePasswordApi({
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
      });

      setSuccessMessage(t('profile.passwordForm.success'));
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Скрываем сообщение через 5 секунд
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error: any) {
      console.error('Change password error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
      });
      
      let errorMessage = t('profile.passwordForm.errors.general');
      
      // Первоприоритетно проверяем специфические ошибки авторизации
      if (error.response?.status === 401) {
        errorMessage = '❌ Не авторизованы. Попробуйте перезагрузить страницу и заново войти в систему.';
      } else if (error.response?.data) {
        const data = error.response.data;
        
        // Проверяем разные варианты полей ошибок
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.old_password?.[0]) {
          setErrors({ currentPassword: data.old_password[0] || t('profile.passwordForm.errors.incorrect') });
          return;
        } else if (data.current_password?.[0]) {
          setErrors({ currentPassword: data.current_password[0] || t('profile.passwordForm.errors.incorrect') });
          return;
        } else if (data.new_password?.[0]) {
          errorMessage = data.new_password[0];
        } else if (data.password?.[0]) {
          errorMessage = data.password[0];
        } else if (data.non_field_errors?.[0]) {
          errorMessage = data.non_field_errors[0];
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.error) {
          errorMessage = data.error;
        }
      }
      
      // Если 500 ошибка - значит проблема на бэкенде
      if (error.response?.status === 500) {
        errorMessage = '❌ Ошибка на сервере (500). Эндпоинт /api/profile/change-password/ не работает правильно.';
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Переключение видимости пароля
  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <FaLock className="text-blue-500 text-xl" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {t('profile.passwordForm.title')}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Текущий пароль */}
        <div>
          <label
            htmlFor="currentPassword"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
          >
            {t('profile.passwordForm.currentPassword')}
          </label>
          <div className="relative">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className={`w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-slate-900/50 border ${
                errors.currentPassword
                  ? 'border-red-400 focus:ring-red-500'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500'
              } rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all`}
              placeholder={t('profile.passwordForm.placeholders.current')}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('current')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <AnimatePresence>
            {errors.currentPassword && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2 text-sm text-red-500 flex items-center gap-1"
              >
                <FaTimes className="text-xs" />
                {errors.currentPassword}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Новый пароль */}
        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
          >
            {t('profile.passwordForm.newPassword')}
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className={`w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-slate-900/50 border ${
                errors.newPassword
                  ? 'border-red-400 focus:ring-red-500'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500'
              } rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all`}
              placeholder={t('profile.passwordForm.placeholders.new')}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('new')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <AnimatePresence>
            {errors.newPassword && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2 text-sm text-red-500 flex items-center gap-1"
              >
                <FaTimes className="text-xs" />
                {errors.newPassword}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Подтверждение пароля */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
          >
            {t('profile.passwordForm.confirmPassword')}
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-slate-900/50 border ${
                errors.confirmPassword
                  ? 'border-red-400 focus:ring-red-500'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500'
              } rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all`}
              placeholder={t('profile.passwordForm.placeholders.confirm')}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirm')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <AnimatePresence>
            {errors.confirmPassword && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2 text-sm text-red-500 flex items-center gap-1"
              >
                <FaTimes className="text-xs" />
                {errors.confirmPassword}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Сообщение об успехе */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg"
            >
              <p className="text-sm text-green-600 dark:text-green-400 text-center flex items-center justify-center gap-2">
                <FaCheck className="text-base" />
                {successMessage}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Кнопка отправки */}
        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
          whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
          className={`w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/30 transition-all duration-300 flex items-center justify-center gap-2 ${
            isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t('profile.passwordForm.saving')}</span>
            </>
          ) : (
            <>
              <FaLock />
              <span>{t('profile.passwordForm.changeButton')}</span>
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default ChangePasswordForm;
