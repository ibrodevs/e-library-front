import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  FaSignOutAlt,
  FaUserGraduate,
  FaEnvelope,
  FaUsers,
  FaGraduationCap,
  FaSpinner,
  FaBook,
  FaClock,
  FaTrophy,
  FaBookOpen,
} from 'react-icons/fa';
import ChangePasswordForm from '../components/ChangePasswordForm';
import { logout } from '../utils/auth';
import { getProfileApi, type ProfileResponse } from '../api/authApi';
import { loadStats, formatTime, type UserReadingStats } from '../utils/readingStats';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readingStats, setReadingStats] = useState<UserReadingStats | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const data = await getProfileApi();
        setProfile(data);
        // Load reading stats from localStorage
        const stats = loadStats(data.email);
        setReadingStats(stats);
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

        {/* Reading Stats */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FaTrophy className="text-yellow-500" />
              Моя статистика чтения
            </h2>
            <Link
              to="/leaderboard"
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
            >
              Таблица лидеров
            </Link>
          </div>

          {readingStats && readingStats.booksRead.length > 0 ? (
            <>
              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <ReadingStatCard
                  icon={<FaBook className="text-green-500" />}
                  label="Книг прочитано"
                  value={String(readingStats.booksRead.length)}
                  bg="bg-green-50 dark:bg-green-900/20"
                  border="border-green-200 dark:border-green-700"
                />
                <ReadingStatCard
                  icon={<FaBookOpen className="text-blue-500" />}
                  label="Страниц прочитано"
                  value={String(readingStats.booksRead.reduce((s, b) => s + b.pagesRead, 0))}
                  bg="bg-blue-50 dark:bg-blue-900/20"
                  border="border-blue-200 dark:border-blue-700"
                />
                <ReadingStatCard
                  icon={<FaClock className="text-purple-500" />}
                  label="Время чтения"
                  value={formatTime(readingStats.totalTimeSeconds)}
                  bg="bg-purple-50 dark:bg-purple-900/20"
                  border="border-purple-200 dark:border-purple-700"
                />
              </div>

              {/* Recently read books */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Последние прочитанные книги</h3>
                </div>
                <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                  {readingStats.booksRead.slice(0, 5).map((book) => (
                    <li key={book.bookId} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt={book.bookTitle} className="w-10 h-14 object-cover rounded shadow-sm flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-14 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center flex-shrink-0">
                          <FaBook className="text-slate-400" />
                        </div>
                      )}
                      <div className="flex-grow min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{book.bookTitle}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{book.bookAuthor}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><FaBookOpen className="text-blue-400" />{book.pagesRead} стр.</span>
                        <span className="flex items-center gap-1"><FaClock className="text-purple-400" />{formatTime(book.timeSpentSeconds)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-10 text-center">
              <FaBook className="text-5xl text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">Вы ещё не читали книг</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">Откройте каталог и начните читать!</p>
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
              >
                <FaBook /> Открыть каталог
              </Link>
            </div>
          )}
        </motion.section>
      </main>
    </div>
  );
};

// ─── Sub-component ─────────────────────────────────────────────────────────────
function ReadingStatCard({
  icon, label, value, bg, border,
}: { icon: React.ReactNode; label: string; value: string; bg: string; border: string }) {
  return (
    <div className={`${bg} border ${border} rounded-xl p-4 flex flex-col items-center text-center gap-2`}>
      <div className="text-2xl">{icon}</div>
      <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

export default ProfilePage;
