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
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const warmedPdfUrls = new Set<string>();
const warmedBookBundles = new Set<number>();
const pdfBlobUrlCache = new Map<string, string>();
const pdfBlobRequestCache = new Map<string, Promise<string>>();
const FULL_PREFETCH_LIMIT_BYTES = 8 * 1024 * 1024;

const bookApiClient = axios.create({
  baseURL: API_BASE_URL,
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

export const buildBookFileUrl = (bookId: number): string =>
  `${API_ORIGIN}/api/book-file/${bookId}/`;

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
  result.forEach((book) => cacheSet(`book_${book.id}`, book));
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
  if (cached?.pdf_file_url) return cached;

  try {
    const { data } = await bookApiClient.get<Book>(`/books/${bookId}/`);
    const result = normalizeBook(data);
    if (!result.pdf_file_url) {
      result.pdf_file_url = buildBookFileUrl(bookId);
    }
    cacheSet(cacheKey, result);
    return result;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error(`Книга с ID ${bookId} не найдена`);
    }
    throw error;
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

/**
 * Прогреть бандл ридера и его зависимости ещё до перехода на страницу чтения.
 */
export const warmReaderBundle = async (bookId?: number): Promise<void> => {
  if (bookId && warmedBookBundles.has(bookId)) {
    return;
  }

  await Promise.allSettled([
    import('../pages/BookReaderOptimized'),
    import('react-pdf'),
  ]);

  if (bookId) {
    warmedBookBundles.add(bookId);
  }
};

/**
 * Прогреть первые байты PDF, чтобы первая страница стартовала быстрее.
 */
export const warmPdfUrl = async (pdfUrl?: string): Promise<void> => {
  if (!pdfUrl || warmedPdfUrls.has(pdfUrl)) {
    return;
  }

  warmedPdfUrls.add(pdfUrl);

  try {
    await fetch(pdfUrl, {
      method: 'GET',
      headers: {
        Range: 'bytes=0-65535',
      },
    });
  } catch {
    warmedPdfUrls.delete(pdfUrl);
  }
};

/**
 * Возвращает уже прогретый локальный blob URL, если он есть.
 */
export const getCachedPdfSource = (pdfUrl?: string): string | undefined => {
  if (!pdfUrl) {
    return undefined;
  }

  return pdfBlobUrlCache.get(pdfUrl);
};

/**
 * Скачивает небольшие PDF целиком в браузерный кэш для максимально быстрого открытия.
 */
export const prefetchPdfBlob = async (pdfUrl?: string): Promise<string | undefined> => {
  if (!pdfUrl) {
    return undefined;
  }

  const cachedSource = pdfBlobUrlCache.get(pdfUrl);
  if (cachedSource) {
    return cachedSource;
  }

  const inFlight = pdfBlobRequestCache.get(pdfUrl);
  if (inFlight) {
    return inFlight;
  }

  const request = (async () => {
    const headResponse = await fetch(pdfUrl, { method: 'HEAD' });
    if (!headResponse.ok) {
      throw new Error(`HEAD request failed for ${pdfUrl}`);
    }

    const contentLength = Number(headResponse.headers.get('content-length') || 0);
    if (contentLength && contentLength > FULL_PREFETCH_LIMIT_BYTES) {
      throw new Error(`PDF is too large for eager prefetch: ${contentLength} bytes`);
    }

    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error(`GET request failed for ${pdfUrl}`);
    }

    const blob = await pdfResponse.blob();
    if (blob.size > FULL_PREFETCH_LIMIT_BYTES) {
      throw new Error(`PDF blob is too large for eager prefetch: ${blob.size} bytes`);
    }

    const objectUrl = URL.createObjectURL(blob);
    pdfBlobUrlCache.set(pdfUrl, objectUrl);
    return objectUrl;
  })();

  pdfBlobRequestCache.set(pdfUrl, request);

  try {
    return await request;
  } finally {
    pdfBlobRequestCache.delete(pdfUrl);
  }
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
