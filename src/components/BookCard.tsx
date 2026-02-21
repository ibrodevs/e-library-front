import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaBook, FaCalendarAlt, FaClock } from 'react-icons/fa';
import type { StudentBook } from '../types/auth';

interface BookCardProps {
  book: StudentBook;
  onClick?: (book: StudentBook) => void;
}

/**
 * Компонент карточки книги студента с современным дизайном
 */
const BookCard: React.FC<BookCardProps> = ({ book, onClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Определяем цвет статуса
  const getStatusColor = () => {
    switch (book.status) {
      case 'overdue':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'returned':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getStatusText = () => {
    switch (book.status) {
      case 'overdue':
        return 'Просрочена';
      case 'returned':
        return 'Возвращена';
      default:
        return 'Активна';
    }
  };

  // Форматирование даты
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Дни до возврата
  const getDaysUntilReturn = () => {
    const today = new Date();
    const returnDate = new Date(book.returnDate);
    const diffTime = returnDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = getDaysUntilReturn();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03, y: -5 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick?.(book)}
      className="group relative bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border border-slate-100 dark:border-slate-700"
    >
      {/* Статус badge */}
      <div className="absolute top-3 right-3 z-10">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${getStatusColor()}`}
        >
          {getStatusText()}
        </span>
      </div>

      {/* Обложка книги */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
        {!imageError && book.coverImage ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700" />
            )}
            <img
              src={book.coverImage}
              alt={book.title}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center p-6">
              <FaBook className="text-5xl text-slate-400 dark:text-slate-500 mx-auto mb-3 opacity-50" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Нет обложки</p>
            </div>
          </div>
        )}

        {/* Градиент снизу */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Информация о книге */}
      <div className="p-4 space-y-3">
        {/* Название и автор */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {book.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1 flex items-center gap-1">
            <FaBook className="text-xs opacity-70" />
            {book.author}
          </p>
        </div>

        {/* Даты */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <FaCalendarAlt className="opacity-70" />
              Взята:
            </span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              {formatDate(book.borrowedDate)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <FaClock className="opacity-70" />
              Вернуть до:
            </span>
            <span
              className={`font-semibold ${
                daysLeft < 0
                  ? 'text-red-500'
                  : daysLeft <= 3
                  ? 'text-yellow-500'
                  : 'text-green-500'
              }`}
            >
              {formatDate(book.returnDate)}
            </span>
          </div>

          {/* Счетчик дней */}
          {book.status === 'active' && (
            <div className="pt-2">
              <div
                className={`px-3 py-1.5 rounded-lg text-center text-xs font-semibold ${
                  daysLeft < 0
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    : daysLeft <= 3
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                    : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                }`}
              >
                {daysLeft < 0
                  ? `Просрочено на ${Math.abs(daysLeft)} дн.`
                  : daysLeft === 0
                  ? 'Сегодня последний день'
                  : `Осталось ${daysLeft} дн.`}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hover эффект - подсветка снизу */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </motion.div>
  );
};

export default BookCard;
