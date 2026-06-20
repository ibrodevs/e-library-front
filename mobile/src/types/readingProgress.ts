export interface ReadingProgress {
  bookId: string;
  title?: string;
  cover_image_url?: string;
  currentPage: number;
  totalPages?: number;
  progressPercent?: number;
  updatedAt: string;
}
