import { QueryClient } from '@tanstack/react-query';

// Создаем QueryClient с оптимизированными настройками
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Данные считаются свежими 5 минут по умолчанию
      staleTime: 1000 * 60 * 5, // 5 минут
      
      // Кэшируем данные 30 минут
      gcTime: 1000 * 60 * 30, // 30 минут (ранее cacheTime)
      
      // Повторные попытки при ошибке
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Не перезапрашивать при фокусе окна (можно включить по желанию)
      refetchOnWindowFocus: false,
      
      // Не перезапрашивать при переподключении к сети
      refetchOnReconnect: false,
      
      // Перезапрашивать при маунте компонента только если данные stale
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Query Keys для централизованного управления
export const queryKeys = {
  // Books
  books: {
    all: ['books'] as const,
    lists: () => [...queryKeys.books.all, 'list'] as const,
    list: (params?: Record<string, unknown>) => 
      [...queryKeys.books.lists(), params] as const,
    details: () => [...queryKeys.books.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.books.details(), id] as const,
    metadata: (id: number) => [...queryKeys.books.detail(id), 'metadata'] as const,
  },
  
  // Categories
  categories: {
    all: ['categories'] as const,
    list: (params?: Record<string, unknown>) => 
      [...queryKeys.categories.all, params] as const,
  },
  
  // Pages
  pages: {
    all: (bookId: number) => ['pages', bookId] as const,
    page: (bookId: number, pageNumber: number) => 
      [...queryKeys.pages.all(bookId), pageNumber] as const,
  },
} as const;
