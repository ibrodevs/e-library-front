// Базовые типы для книг и категорий
export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  description: string;
  category: number;
  category_name?: string;
  cover_image_url?: string;
  year?: number;
  pdf_file_url?: string;
  total_pages?: number;
}

// Метаданные книги для ридера
export interface BookMetadata {
  id: number;
  title: string;
  author: string;
  description: string;
  cover_image_url?: string;
  pdf_file_url?: string;
  total_pages: number;
  year?: number;
}

// Данные страницы книги
export interface BookPage {
  pageNumber: number;
  imageUrl?: string;
  pdfUrl?: string;
}

// API Response типы
export interface BooksResponse {
  results?: Book[];
  data?: Book[];
  value?: Book[];
  count?: number;
}

export interface CategoriesResponse {
  results?: Category[];
  data?: Category[];
  value?: Category[];
}

// Query параметры
export interface BookQueryParams {
  language?: string;
  category?: string;
  search?: string;
}

// Тип для prefetch данных
export interface BookPrefetchData {
  book: Book;
  firstPageUrl?: string;
}
