import React from 'react';

/**
 * Skeleton для карточки книги
 */
export const BookCardSkeleton: React.FC = () => {
  return (
    <div className="bg-gray-900/30 backdrop-blur-lg rounded-2xl overflow-hidden border border-gray-700 animate-pulse">
      {/* Обложка */}
      <div className="relative h-64 bg-gradient-to-br from-gray-800 to-gray-700">
        <div className="absolute top-4 left-4 w-20 h-6 bg-gray-600 rounded-full" />
        <div className="absolute top-4 right-4 w-12 h-6 bg-gray-600 rounded-lg" />
      </div>

      {/* Контент */}
      <div className="p-6 space-y-4">
        {/* Заголовок */}
        <div className="space-y-2">
          <div className="h-6 bg-gray-700 rounded w-3/4" />
          <div className="h-6 bg-gray-700 rounded w-1/2" />
        </div>

        {/* Автор */}
        <div className="h-4 bg-gray-700 rounded w-1/3" />

        {/* Описание */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-700 rounded w-full" />
          <div className="h-3 bg-gray-700 rounded w-full" />
          <div className="h-3 bg-gray-700 rounded w-2/3" />
        </div>

        {/* Кнопка */}
        <div className="h-12 bg-gradient-to-r from-gray-700 to-gray-600 rounded-xl" />
      </div>

      {/* Прогресс бар */}
      <div className="h-1 w-0 bg-gradient-to-r from-cyan-400 to-blue-600" />
    </div>
  );
};

/**
 * Сетка скелетонов для каталога
 */
export const BookGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, index) => (
        <BookCardSkeleton key={index} />
      ))}
    </div>
  );
};

/**
 * Skeleton компонент с анимацией мерцания
 */
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%] ${className}`}
      style={{
        animation: 'shimmer 2s infinite',
      }}
    />
  );
};

/**
 * Skeleton для обложки книги
 */
export const CoverSkeleton: React.FC = () => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-700 to-gray-600 animate-pulse relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
    </div>
  );
};

/**
 * Skeleton для индикатора прогресса загрузки
 */
export const ProgressSkeleton: React.FC<{ progress?: number }> = ({ progress = 0 }) => {
  return (
    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

/**
 * Индикатор загрузки PDF
 */
export const PdfLoadingIndicator: React.FC<{ progress?: number }> = ({ progress }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <div className="text-center space-y-6 max-w-md">
        {/* Анимированная иконка книги */}
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl animate-pulse" />
          <div className="absolute inset-2 bg-black rounded-xl flex items-center justify-center">
            <svg
              className="w-12 h-12 text-blue-400 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        </div>

        {/* Текст загрузки */}
        <div>
          <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Загрузка книги
          </h3>
          <p className="text-gray-400">Пожалуйста, подождите...</p>
        </div>

        {/* Прогресс */}
        {progress !== undefined && (
          <div className="w-full space-y-2">
            <ProgressSkeleton progress={progress} />
            <p className="text-sm text-gray-500">{Math.round(progress)}%</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Добавим CSS для shimmer анимации
export const shimmerAnimation = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`;
