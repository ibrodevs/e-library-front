import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  FaSignOutAlt,
  FaHistory,
  FaStar,
  FaUserGraduate,
  FaCalendarAlt,
} from 'react-icons/fa';
import ChangePasswordForm from '../components/ChangePasswordForm';
import { getUserData, logout } from '../utils/auth';
import type { VisitHistory, RecommendedBook } from '../types/auth';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const userData = getUserData();

  // Мок-данные истории посещений
  const mockVisitHistory: VisitHistory[] = [
    {
      id: '1',
      date: '2026-02-17',
      action: t('profile.actions.visit'),
      description: t('profile.visitDescriptions.readingRoom3'),
    },
    {
      id: '2',
      date: '2026-02-15',
      action: t('profile.actions.borrow'),
      description: t('profile.mockBooks.javascript.title'),
    },
    {
      id: '3',
      date: '2026-02-10',
      action: t('profile.actions.return'),
      description: t('profile.mockBooks.databases.title'),
    },
    {
      id: '4',
      date: '2026-02-05',
      action: t('profile.actions.visit'),
      description: t('profile.visitDescriptions.computerLab'),
    },
  ];

  // Мок-данные рекомендованных учебников
  const mockRecommendedBooks: RecommendedBook[] = [
    {
      id: '1',
      title: t('profile.recommendedBooksData.sicp.title'),
      author: t('profile.recommendedBooksData.sicp.author'),
      coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop',
      subject: t('profile.recommendedBooksData.sicp.subject'),
      rating: 4.8,
    },
    {
      id: '2',
      title: t('profile.recommendedBooksData.ai.title'),
      author: t('profile.recommendedBooksData.ai.author'),
      coverImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop',
      subject: t('profile.recommendedBooksData.ai.subject'),
      rating: 4.9,
    },
    {
      id: '3',
      title: t('profile.recommendedBooksData.networks.title'),
      author: t('profile.recommendedBooksData.networks.author'),
      coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop',
      subject: t('profile.recommendedBooksData.networks.subject'),
      rating: 4.7,
    },
  ];

  // Выход из системы
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!userData) {
    return null; // ProtectedRoute уже перенаправит на логин
  }

  const fullName = `${userData.lastName} ${userData.firstName} ${userData.middleName || ''}`.trim();

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
                  src={userData.avatar || 'https://ui-avatars.com/api/?name=' + fullName}
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
                  {userData.studentId} • {userData.department}
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
        {/* Смена пароля */}
        <ChangePasswordForm />

        <div className="grid mt-8 grid-cols-1 lg:grid-cols-2 gap-8">
          {/* История посещений */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <FaHistory className="text-indigo-500" />
              {t('profile.visitHistory')}
            </h2>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {mockVisitHistory.map((visit) => (
                  <motion.div
                    key={visit.id}
                    whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                    className="p-4 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-500/10 rounded-lg mt-1">
                        <FaCalendarAlt className="text-indigo-500 text-sm" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              {visit.action}
                            </h3>
                            {visit.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                {visit.description}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap ml-4">
                            {new Date(visit.date).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Рекомендованные учебники */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <FaStar className="text-yellow-500" />
              {t('profile.recommendedBooks')}
            </h2>

            <div className="space-y-4">
              {mockRecommendedBooks.map((book) => (
                <motion.div
                  key={book.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer"
                >
                  <div className="flex gap-4">
                    {/* Обложка */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
                        {book.coverImage && (
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    </div>

                    {/* Информация */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2 mb-1">
                        {book.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {book.author}
                      </p>
                      <div className="flex items-center gap-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          {book.subject}
                        </span>
                        {book.rating && (
                          <div className="flex items-center gap-1 text-yellow-500">
                            <FaStar className="text-xs" />
                            <span className="text-sm font-semibold">{book.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
