import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  FaSignOutAlt,
  FaUserGraduate,
  FaEnvelope,
  FaUsers,
  FaGraduationCap,
  FaSpinner,
} from 'react-icons/fa';
import ChangePasswordForm from '../components/ChangePasswordForm';
import { logout } from '../utils/auth';
import { getProfileApi, type ProfileResponse } from '../api/authApi';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const data = await getProfileApi();
        setProfile(data);
      } catch (err: any) {
        setError(
          err.response?.data?.detail || t('profile.errors.fetchFailed')
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [t]);

  // Выход из системы
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">{t('profile.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error || t('profile.errors.fetchFailed')}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {t('profile.retry')}
          </button>
        </div>
      </div>
    );
  }

  const fullName = `${profile.last_name} ${profile.first_name}`.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950">
      {/* Шапка профиля */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Информация о студенте */}
            <div className="flex items-center gap-4">
              {/* Аватар */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative"
              >
                <img
                  src={'https://ui-avatars.com/api/?name=' + encodeURIComponent(fullName) + '&background=3b82f6&color=fff&size=200'}
                  alt={fullName}
                  className="w-14 h-14 rounded-full border-2 border-blue-500 shadow-lg object-cover"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full" />
              </motion.div>

              {/* Имя и данные */}
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {fullName}
                  <FaUserGraduate className="text-blue-500 text-sm" />
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {profile.email}
                </p>
              </div>
            </div>

            {/* Кнопка выхода */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium shadow-lg shadow-red-500/30 transition-all"
            >
              <FaSignOutAlt />
              <span>{t('profile.logout')}</span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Основной контент */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Информация о пользователе */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
            <FaUserGraduate className="text-blue-500" />
            {t('profile.personalInfo')}
          </h2>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {/* Имя */}
              <div className="p-5 border-b md:border-r border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t('profile.fields.firstName')}</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{profile.first_name}</p>
              </div>
              {/* Фамилия */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t('profile.fields.lastName')}</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{profile.last_name}</p>
              </div>
              {/* Email */}
              <div className="p-5 border-b md:border-r border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-1">
                  <FaEnvelope className="text-blue-500 text-xs" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</p>
                </div>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{profile.email}</p>
              </div>
              {/* Группа */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-1">
                  <FaUsers className="text-indigo-500 text-xs" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('profile.fields.group')}</p>
                </div>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{profile.group}</p>
              </div>
              {/* Курс */}
              <div className="p-5 border-b md:border-r border-slate-100 dark:border-slate-700 md:border-b-0">
                <div className="flex items-center gap-2 mb-1">
                  <FaGraduationCap className="text-green-500 text-xs" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('profile.fields.course')}</p>
                </div>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{profile.course}</p>
              </div>
              {/* Пароль */}
              <div className="p-5">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t('profile.fields.password')}</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white tracking-widest">********</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Смена пароля */}
        <ChangePasswordForm />
      </main>
    </div>
  );
};

export default ProfilePage;
