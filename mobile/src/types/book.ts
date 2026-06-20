export interface Category {
  id?: number;
  name?: string;
  title?: string;
  description?: string;
  translations?: unknown;
}

export interface Book {
  id: number;
  category?: number | string | Category | null;
  category_name?: string;
  year?: number | string | null;
  cover_image?: string | null;
  cover_image_url?: string | null;
  title?: string;
  author?: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  translations?: unknown;
  pdf_file_url?: string | null;
  total_pages?: number | null;
}

export interface BookQueryParams {
  language?: string;
  category?: string;
  search?: string;
}
