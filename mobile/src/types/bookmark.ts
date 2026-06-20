export type BookmarkStatus = 'liked' | 'reading' | 'planned' | 'completed' | 'dropped';

export interface BookmarkItem {
  bookId: number;
  title: string;
  author: string;
  cover_image_url?: string;
  category_name?: string;
  year?: number | string | null;
  status: BookmarkStatus;
  updatedAt: string;
}
