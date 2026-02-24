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

// Для книг - берем с Heroku (там уже есть данные)
const bookApiClient = axios.create({
  baseURL: 'https://su-library-back-d2d8d21af2e4.herokuapp.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==== ЛОКАЛЬНЫЙ КЭШ (localStorage) ====
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 часа

function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    return data as T;
  } catch {
    return null;
  }
}

function cacheSet(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // localStorage может быть переполнен — игнорируем
  }
}

// ==== BOOKS API ====

/** Нормализует поля книги — API может возвращать pdf_url или pdf_file вместо pdf_file_url */
const normalizeBook = (book: Book): Book => ({
  ...book,
  pdf_file_url: book.pdf_file_url || book.pdf_url || book.pdf_file || '',
  cover_image_url: book.cover_image_url || book.cover_image || '',
});

/**
 * Получить список всех книг с фильтрацией
 */
export const fetchBooks = async (params: BookQueryParams = {}): Promise<Book[]> => {
  const cacheKey = `books_${JSON.stringify(params)}`;

  // Возвращаем кэш мгновенно если он свежий
  const cached = cacheGet<Book[]>(cacheKey);
  if (cached) return cached;

  const { data } = await bookApiClient.get<BooksResponse>('/books/', { params });
  
  // Обрабатываем разные форматы ответа API
  let books: Book[];
  if (Array.isArray(data)) {
    books = data;
  } else {
    books = data.results || data.data || data.value || [];
  }
  
  const result = books.map(normalizeBook);
  cacheSet(cacheKey, result);
  return result;
};

/**
 * Получить одну книгу по ID
 * Использует кэш из каталога если доступен — не делает лишний запрос
 * staleTime: Infinity - данные книги не меняются
 */
export const fetchBookById = async (bookId: number): Promise<Book> => {
  const cacheKey = `book_${bookId}`;

  const cached = cacheGet<Book>(cacheKey);
  if (cached) return cached;

  // Сначала пробуем прямой эндпоинт /books/{id}/
  try {
    const { data } = await bookApiClient.get<Book>(`/books/${bookId}/`);
    const result = normalizeBook(data);
    cacheSet(cacheKey, result);
    return result;
  } catch (directError: any) {
    // Если прямой эндпоинт не работает — фоллбек: загружаем весь список
    try {
      const { data } = await bookApiClient.get<BooksResponse>('/books/', {
        params: { id: bookId },
      });

      let books: Book[] = [];
      if (Array.isArray(data)) {
        books = data;
      } else {
        books = data.results || data.data || data.value || [];
      }

      const book = books.find((b) => b.id === bookId);
      if (!book) throw new Error(`Book with ID ${bookId} not found`);
      const result = normalizeBook(book);
      cacheSet(cacheKey, result);
      return result;
    } catch (error: any) {
      if (error.response?.status === 404 || error.message?.includes('not found')) {
        throw new Error(`Книга с ID ${bookId} не найдена`);
      }
      throw error;
    }
  }
};

/**
 * Получить метаданные книги для ридера
 * NOTE: Heroku API не имеет эндпоинта /metadata, возвращаем сами данные книги
 */
export const fetchBookMetadata = async (bookId: number): Promise<BookMetadata> => {
  // На Heroku нету отдельного эндпоинта для метаданных
  // Используем данные из основной книги
  const book = await fetchBookById(bookId);
  return {
    id: book.id,
    title: book.title,
    author: book.author || '',
    description: book.description || '',
    cover_image_url: book.cover_image_url,
    pdf_file_url: book.pdf_file_url || '',
    total_pages: book.total_pages || 0,
    year: book.year,
  };
};

/**
 * Получить URL первой страницы книги (для prefetch)
 * NOTE: Heroku API не имеет эндпоинта /pages, возвращаем pdf_file_url из книги
 */
export const fetchFirstPageUrl = async (bookId: number): Promise<string> => {
  // На Heroku нету отдельного эндпоинта для страниц
  const book = await fetchBookById(bookId);
  return book.pdf_file_url || '';
};

/**
 * Получить конкретную страницу книги
 * NOTE: Heroku API не имеет эндпоинта /pages, возвращаем pdf_file_url
 */
export const fetchBookPage = async (
  bookId: number, 
  pageNumber: number
): Promise<BookPage> => {
  try {
    const book = await fetchBookById(bookId);
    // На Heroku нету отдельного эндпоинта для страниц PDF
    // Возвращаем pdf_file_url и пусть PDF reader сам разбирается со страницами
    return {
      pageNumber: pageNumber,
      pdfUrl: book.pdf_file_url || '',
    };
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error(`Страница ${pageNumber} книги ${bookId} не найдена`);
    }
    throw error;
  }
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
  const cacheKey = `categories_${JSON.stringify(params)}`;

  const cached = cacheGet<Category[]>(cacheKey);
  if (cached) return cached;

  const { data } = await bookApiClient.get<CategoriesResponse>('/categories/', { params });
  
  // Обрабатываем разные форматы ответа
  let result: Category[];
  if (Array.isArray(data)) {
    result = data;
  } else {
    result = data.results || data.data || data.value || [];
  }

  cacheSet(cacheKey, result);
  return result;
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
