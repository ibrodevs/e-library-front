import { apiClient } from './client';
import { API_BASE_URL, DEFAULT_LANGUAGE } from '../../constants/config';
import type { Book, BookQueryParams, Category } from '../../types/book';

interface ListResponse<T> {
  results?: T[];
  data?: T[];
  value?: T[];
}

function normalizeList<T>(payload: T[] | ListResponse<T>): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload.results ?? payload.data ?? payload.value ?? [];
}

function normalizeBook(input: any): Book {
  return {
    id: Number(input?.id ?? 0),
    category: input?.category ?? null,
    category_name: input?.category_name ?? input?.category?.name ?? input?.category?.title ?? undefined,
    year: input?.year ?? null,
    cover_image: input?.cover_image ?? null,
    cover_image_url: input?.cover_image_url ?? input?.cover_image ?? null,
    title: input?.title ?? '',
    author: input?.author ?? '',
    description: input?.description ?? '',
    is_active: Boolean(input?.is_active ?? true),
    created_at: input?.created_at ?? undefined,
    translations: input?.translations,
    pdf_file_url: input?.pdf_file_url ?? input?.pdf_file ?? input?.file_url ?? null,
    total_pages: input?.total_pages != null ? Number(input.total_pages) : null,
  };
}

function normalizeCategory(input: any): Category {
  return {
    id: input?.id != null ? Number(input.id) : undefined,
    name: input?.name ?? input?.title ?? '',
    title: input?.title ?? input?.name ?? '',
    description: input?.description ?? undefined,
    translations: input?.translations,
  };
}

export async function getBooks(language = DEFAULT_LANGUAGE): Promise<Book[]> {
  const { data } = await apiClient.get<ListResponse<any> | any[]>('/books/', {
    params: { language },
  });

  return normalizeList(data).map(normalizeBook).filter((book) => Boolean(book.id));
}

export async function getCategories(language = DEFAULT_LANGUAGE): Promise<Category[]> {
  const { data } = await apiClient.get<ListResponse<any> | any[]>('/categories/', {
    params: { language },
  });

  return normalizeList(data).map(normalizeCategory).filter((category) => Boolean(category.id));
}

export async function fetchBookById(bookId: number): Promise<Book> {
  const { data } = await apiClient.get<any>(`/books/${bookId}/`);
  return normalizeBook(data);
}

export function getBookFileUrl(bookId: number | string): string {
  return `${API_BASE_URL}/book-file/${encodeURIComponent(String(bookId))}/`;
}

export { getBooks as fetchBooks, getCategories as fetchCategories };
