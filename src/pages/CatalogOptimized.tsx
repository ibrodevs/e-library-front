import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaSearch,
  FaBook,
  FaBookOpen,
  FaChevronDown,
  FaTimes,
  FaLayerGroup,
} from 'react-icons/fa';
import { useBooks, useCategories, usePrefetchBook } from '../hooks/useBookQueries';
import { BookCardSkeleton } from '../components/skeletons/BookSkeleton';
import type { Book } from '../types/book';

/**
 * Карточка книги (светлая тема, prefetching).
 */
const BookCard: React.FC<{
  book: Book;
  onPrefetch: (bookId: number, pdfUrl?: string) => void;
  onClick: (book: Book) => void;
}> = ({ book, onPrefetch, onClick }) => {
  const { t } = useTranslation();
  const [imageLoaded, setImageLoaded] = useState(false);

  const prefetch = () => onPrefetch(book.id, book.pdf_file_url);

  return (
    <div
      className="group flex cursor-pointer flex-col h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700"
      onMouseEnter={prefetch}
      onTouchStart={prefetch}
      onFocus={prefetch}
      onClick={() => onClick(book)}
      tabIndex={0}
    >
      {/* Обложка */}
      <div className="relative aspect-[3/4] flex-shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800">
        {book.cover_image_url ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 animate-pulse bg-slate-200 dark:bg-slate-700" />
            )}
            <img
              src={book.cover_image_url}
              alt={book.title}
              className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <FaBook className="mb-2 text-5xl opacity-40" />
            <p className="text-xs">{t('library.noCover')}</p>
          </div>
        )}

        {/* Категория */}
        {book.category_name && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-brand-700 shadow-sm backdrop-blur-sm dark:bg-slate-900/90 dark:text-brand-300">
            {book.category_name}
          </span>
        )}
        {/* Год */}
        {book.year && (
          <span className="absolute right-3 top-3 rounded-full bg-slate-900/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {book.year}
          </span>
        )}
      </div>

      {/* Текст */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-base font-bold text-slate-900 transition-colors group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
          {book.title}
        </h3>
        {book.author && (
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <FaBook className="shrink-0 text-xs opacity-70" />
            <span className="line-clamp-1">{book.author}</span>
          </p>
        )}
        {book.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {book.description}
          </p>
        )}

        <div className="mt-auto pt-5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick(book);
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
          >
            <FaBookOpen className="text-xs" />
            <span>{t('library.actions.read')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  value: number;
  label: string;
}> = ({ icon, value, label }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
      {icon}
    </span>
    <div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  </div>
);

const CatalogOptimized: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(9);
  const filterRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data: books = [], isLoading, error } = useBooks({ language: i18n.language });
  const { data: categories = [] } = useCategories({ language: i18n.language });
  const prefetchBook = usePrefetchBook();

  const filteredBooks = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return books.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.description.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategory === 'all' || book.category?.toString() === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [books, searchQuery, selectedCategory]);

  const currentCategoryLabel = useMemo(() => {
    if (selectedCategory === 'all') return t('library.categories.all');
    const category = categories.find((cat) => cat.id.toString() === selectedCategory);
    return category ? category.name : t('library.categories.all');
  }, [selectedCategory, categories, t]);

  const handleBookClick = async (book: Book) => {
    await Promise.race([
      prefetchBook(book.id, book.pdf_file_url),
      new Promise((resolve) => window.setTimeout(resolve, 1200)),
    ]);
    navigate(`/read/${book.id}`);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setSelectedCategory('all');
  }, [i18n.language]);

  useEffect(() => {
    setVisibleCount(9);
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisibleCount((prev) => prev + 6);
      },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleCount, filteredBooks.length]);

  // Состояние загрузки
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              {t('library.title')}
            </h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">{t('library.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Ошибка
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="text-center">
          <div className="mb-4 text-5xl">⚠️</div>
          <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
            {t('library.errors.title')}
          </h3>
          <p className="mx-auto mb-6 max-w-md text-slate-500 dark:text-slate-400">
            {error instanceof Error ? error.message : t('library.errors.fetchFailed')}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-brand-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-800"
          >
            {t('library.actions.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {t('library.title')}
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">{t('library.subtitle')}</p>
        </div>

        {/* Поиск и фильтр */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('library.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 transition-colors focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-brand-900/40"
            />
          </div>

          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen((v) => !v)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 sm:w-auto"
            >
              <FaLayerGroup className="text-brand-600 dark:text-brand-400" />
              <span className="max-w-[10rem] truncate">{currentCategoryLabel}</span>
              <FaChevronDown
                className={`text-xs transition-transform duration-300 ${
                  isFilterOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {t('library.category')}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {filteredBooks.length} / {books.length}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700"
                  >
                    <FaTimes />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto py-1">
                  {[{ id: 'all', name: t('library.categories.all') }, ...categories].map(
                    (category) => {
                      const value = category.id.toString();
                      const active = selectedCategory === value;
                      return (
                        <button
                          key={value}
                          onClick={() => {
                            setSelectedCategory(value);
                            setIsFilterOpen(false);
                          }}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                            active
                              ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              active ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                          />
                          {category.name}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Активный фильтр */}
        {selectedCategory !== 'all' && (
          <div className="mb-6 flex items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {t('library.chosenCategory')}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
              {currentCategoryLabel}
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-brand-500 hover:text-brand-700 dark:hover:text-brand-200"
              >
                <FaTimes className="text-xs" />
              </button>
            </span>
          </div>
        )}

        {/* Статистика */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={<FaBook />} value={books.length} label={t('library.stats.totalBooks')} />
          <StatCard
            icon={<FaSearch />}
            value={filteredBooks.length}
            label={t('library.stats.foundBooks')}
          />
          <StatCard
            icon={<FaLayerGroup />}
            value={categories.length}
            label={t('library.stats.categoriesCount')}
          />
        </div>

        {/* Сетка книг */}
        {filteredBooks.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredBooks.slice(0, visibleCount).map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onPrefetch={prefetchBook}
                  onClick={handleBookClick}
                />
              ))}
            </div>
            {visibleCount < filteredBooks.length && (
              <div
                ref={loadMoreRef}
                className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              >
                {Array.from({
                  length: Math.min(4, filteredBooks.length - visibleCount),
                }).map((_, i) => (
                  <BookCardSkeleton key={i} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center">
            <div className="mb-4 text-5xl">📚</div>
            <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
              {t('library.noResults.title')}
            </h3>
            <p className="mx-auto max-w-md text-slate-500 dark:text-slate-400">
              {t('library.noResults.description')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogOptimized;
