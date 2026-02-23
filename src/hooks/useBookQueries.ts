import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { queryKeys } from '../lib/queryClient';
import * as bookApi from '../api/bookApi';
import type { Book, BookQueryParams } from '../types/book';

// ==== BOOKS HOOKS ====

/**
 * Hook для получения списка книг с фильтрацией
 */
export const useBooks = (params?: BookQueryParams) => {
  const { i18n } = useTranslation();
  const language = params?.language || i18n.language;
  
  return useQuery({
    queryKey: queryKeys.books.list({ ...params, language }),
    queryFn: () => bookApi.fetchBooks({ ...params, language }),
    staleTime: 1000 * 60 * 5, // 5 минут - книги редко меняются
  });
};

/**
 * Hook для получения одной книги по ID
 * Использует кэш из каталога если доступен — не делает лишний запрос
 * staleTime: Infinity - данные книги не меняются
 */
export const useBook = (bookId: number) => {
  const queryClient = useQueryClient();

  // Берём данные из кэша списка (если перешли из каталога)
  const cachedBook = (() => {
    const booksQueries = queryClient.getQueriesData<Book[]>({ queryKey: queryKeys.books.lists() });
    for (const [, books] of booksQueries) {
      if (books) {
        const found = books.find((b) => b.id === bookId);
        if (found) return found;
      }
    }
    return undefined;
  })();

  return useQuery({
    queryKey: queryKeys.books.detail(bookId),
    queryFn: () => bookApi.fetchBookById(bookId),
    staleTime: Infinity,
    enabled: !!bookId,
    initialData: cachedBook,
  });
};

/**
 * Hook для получения метаданных книги для ридера
 * staleTime: Infinity - метаданные не меняются
 */
export const useBookMetadata = (bookId: number) => {
  return useQuery({
    queryKey: queryKeys.books.metadata(bookId),
    queryFn: () => bookApi.fetchBookMetadata(bookId),
    staleTime: Infinity,
    enabled: !!bookId,
  });
};

/**
 * Hook для prefetch книги при наведении (оптимизирован для медленных сервер)
 */
export const usePrefetchBook = () => {
  const queryClient = useQueryClient();

  return (bookId: number) => {
    // Только prefetch основной книги, на странице reader загружать сам себе
    queryClient.prefetchQuery({
      queryKey: queryKeys.books.detail(bookId),
      queryFn: () => bookApi.fetchBookById(bookId),
      staleTime: Infinity,
    });
    // Не prefetch страницы - дать PDF viewer загружаться спокойно
  };
};

/**
 * Hook для получения начальных данных книги из кэша списка
 */
export const useBookInitialData = (bookId: number): Book | undefined => {
  const queryClient = useQueryClient();
  
  // Пытаемся найти книгу в кэше списка книг
  const booksQueries = queryClient.getQueriesData<Book[]>({
    queryKey: queryKeys.books.lists(),
  });
  
  for (const [, books] of booksQueries) {
    if (books) {
      const book = books.find((b) => b.id === bookId);
      if (book) return book;
    }
  }
  
  return undefined;
};

// ==== CATEGORIES HOOKS ====

/**
 * Hook для получения списка категорий
 */
export const useCategories = (params?: BookQueryParams) => {
  const { i18n } = useTranslation();
  const language = params?.language || i18n.language;
  
  return useQuery({
    queryKey: queryKeys.categories.list({ ...params, language }),
    queryFn: () => bookApi.fetchCategories({ ...params, language }),
    staleTime: 1000 * 60 * 10, // 10 минут - категории редко меняются
  });
};

// ==== PAGES HOOKS ====

/**
 * Hook для получения конкретной страницы книги
 */
export const useBookPage = (bookId: number, pageNumber: number) => {
  return useQuery({
    queryKey: queryKeys.pages.page(bookId, pageNumber),
    queryFn: () => bookApi.fetchBookPage(bookId, pageNumber),
    staleTime: Infinity, // Страницы книги не меняются
    enabled: !!bookId && pageNumber > 0,
  });
};

/**
 * Hook для ленивой загрузки страниц (текущая + соседние)
 * ОТКЛЮЧЕН: Prefetch страниц замедляет загрузку на медленных серверах (Heroku)
 */
export const usePrefetchPages = () => {
  // No-op hook для совместимости с существующим кодом
  return () => {
    // prefetch отключен для оптимизации производительности
  };
};

// ==== UTILITY HOOKS ====

/**
 * Hook для инвалидации кэша книг (например, после обновления)
 */
export const useInvalidateBooks = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
  };
};

/**
 * Hook для получения данных книги из кэша (без запроса)
 */
export const useCachedBook = (bookId: number): Book | undefined => {
  const queryClient = useQueryClient();
  return queryClient.getQueryData<Book>(queryKeys.books.detail(bookId));
};
