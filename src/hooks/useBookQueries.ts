import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { queryKeys } from '../lib/queryClient';
import * as bookApi from '../api/bookApi';
import type { Book, Category, BookMetadata, BookPage, BookQueryParams } from '../types/book';

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
 * staleTime: Infinity - данные книги не меняются
 */
export const useBook = (bookId: number) => {
  return useQuery({
    queryKey: queryKeys.books.detail(bookId),
    queryFn: () => bookApi.fetchBookById(bookId),
    staleTime: Infinity, // Данные книги не меняются
    enabled: !!bookId,
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
 * Hook для prefetch книги при наведении
 */
export const usePrefetchBook = () => {
  const queryClient = useQueryClient();
  
  return (bookId: number) => {
    // Prefetch метаданных книги
    queryClient.prefetchQuery({
      queryKey: queryKeys.books.detail(bookId),
      queryFn: () => bookApi.fetchBookById(bookId),
      staleTime: Infinity,
    });
    
    // Prefetch первой страницы (если это PDF reader)
    queryClient.prefetchQuery({
      queryKey: queryKeys.pages.page(bookId, 1),
      queryFn: () => bookApi.fetchBookPage(bookId, 1),
      staleTime: Infinity,
    });
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
 */
export const usePrefetchPages = (bookId: number, currentPage: number) => {
  const queryClient = useQueryClient();
  
  // Prefetch предыдущей и следующей страницы
  const prefetchSurroundingPages = () => {
    if (currentPage > 1) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.pages.page(bookId, currentPage - 1),
        queryFn: () => bookApi.fetchBookPage(bookId, currentPage - 1),
        staleTime: Infinity,
      });
    }
    
    queryClient.prefetchQuery({
      queryKey: queryKeys.pages.page(bookId, currentPage + 1),
      queryFn: () => bookApi.fetchBookPage(bookId, currentPage + 1),
      staleTime: Infinity,
    });
  };
  
  return prefetchSurroundingPages;
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
