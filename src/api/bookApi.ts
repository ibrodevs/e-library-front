import axios from 'axios';
import type { 
  Book, 
  Category, 
  BookMetadata, 
  BookPage,
  BookQueryParams,
  BooksResponse,
  CategoriesResponse 
} from '../types/book';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Axios instance для API
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==== BOOKS API ====

/**
 * Получить список всех книг с фильтрацией
 */
export const fetchBooks = async (params: BookQueryParams = {}): Promise<Book[]> => {
  const { data } = await apiClient.get<BooksResponse>('/books/', { params });
  
  // Обрабатываем разные форматы ответа API
  if (Array.isArray(data)) {
    return data;
  }
  
  return data.results || data.data || data.value || [];
};

/**
 * Получить одну книгу по ID
 */
export const fetchBookById = async (bookId: number): Promise<Book> => {
  const { data } = await apiClient.get<Book>(`/books/${bookId}/`);
  return data;
};

/**
 * Получить метаданные книги для ридера
 */
export const fetchBookMetadata = async (bookId: number): Promise<BookMetadata> => {
  const { data } = await apiClient.get<BookMetadata>(`/books/${bookId}/metadata/`);
  return data;
};

/**
 * Получить URL первой страницы книги (для prefetch)
 */
export const fetchFirstPageUrl = async (bookId: number): Promise<string> => {
  const { data } = await apiClient.get<{ url: string }>(`/books/${bookId}/pages/1/`);
  return data.url;
};

/**
 * Получить конкретную страницу книги
 */
export const fetchBookPage = async (
  bookId: number, 
  pageNumber: number
): Promise<BookPage> => {
  const { data } = await apiClient.get<BookPage>(
    `/books/${bookId}/pages/${pageNumber}/`
  );
  return data;
};

/**
 * Предзагрузка диапазона страниц (текущая + соседние)
 */
export const prefetchPages = async (
  bookId: number,
  currentPage: number,
  range: number = 1
): Promise<BookPage[]> => {
  const startPage = Math.max(1, currentPage - range);
  const endPage = currentPage + range;
  
  const pagePromises = [];
  for (let i = startPage; i <= endPage; i++) {
    pagePromises.push(fetchBookPage(bookId, i));
  }
  
  return Promise.all(pagePromises);
};

// ==== CATEGORIES API ====

/**
 * Получить список категорий
 */
export const fetchCategories = async (params: BookQueryParams = {}): Promise<Category[]> => {
  const { data } = await apiClient.get<CategoriesResponse>('/categories/', { params });
  
  // Обрабатываем разные форматы ответа
  if (Array.isArray(data)) {
    return data;
  }
  
  return data.results || data.data || data.value || [];
};

// ==== UTILITY FUNCTIONS ====

/**
 * Проверить доступность PDF файла
 */
export const checkPdfAvailability = async (pdfUrl: string): Promise<boolean> => {
  try {
    const response = await axios.head(pdfUrl);
    return response.status === 200;
  } catch {
    return false;
  }
};

export default {
  fetchBooks,
  fetchBookById,
  fetchBookMetadata,
  fetchFirstPageUrl,
  fetchBookPage,
  prefetchPages,
  fetchCategories,
  checkPdfAvailability,
};
