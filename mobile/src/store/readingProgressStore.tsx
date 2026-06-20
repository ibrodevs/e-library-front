import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { readingProgressStorage } from '../services/readingProgress/readingProgressStorage';
import type { ReadingProgress } from '../types/readingProgress';

type SaveReadingProgressInput = Omit<ReadingProgress, 'updatedAt'> | ReadingProgress;

interface ReadingProgressContextValue {
  allProgress: ReadingProgress[];
  getProgress: (bookId?: number | string | null) => ReadingProgress | null;
  isLoading: boolean;
  refreshProgress: () => Promise<ReadingProgress[]>;
  removeProgress: (bookId: number | string) => Promise<void>;
  saveProgress: (progress: SaveReadingProgressInput) => Promise<ReadingProgress>;
}

const ReadingProgressContext = createContext<ReadingProgressContextValue | null>(null);

function normalizeBookId(bookId?: number | string | null): string | null {
  return bookId != null && String(bookId).trim() ? String(bookId) : null;
}

function getUpdatedAtValue(item: ReadingProgress): number {
  const timestamp = Date.parse(item.updatedAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function normalizeProgress(progress: SaveReadingProgressInput): ReadingProgress {
  const bookId = normalizeBookId(progress.bookId) ?? '';
  const currentPage = Number.isFinite(progress.currentPage) ? Math.max(1, Math.floor(progress.currentPage)) : 1;
  const totalPages =
    typeof progress.totalPages === 'number' && Number.isFinite(progress.totalPages) && progress.totalPages > 0
      ? Math.floor(progress.totalPages)
      : undefined;
  const progressPercent =
    typeof progress.progressPercent === 'number' && Number.isFinite(progress.progressPercent)
      ? Math.max(0, Math.min(100, Math.round(progress.progressPercent)))
      : totalPages
        ? Math.round((Math.min(currentPage, totalPages) / totalPages) * 100)
        : undefined;

  return {
    ...progress,
    bookId,
    currentPage,
    totalPages,
    progressPercent,
    updatedAt: 'updatedAt' in progress && progress.updatedAt ? progress.updatedAt : new Date().toISOString(),
  };
}

function dedupeProgress(items: ReadingProgress[]): ReadingProgress[] {
  const latestByBookId = new Map<string, ReadingProgress>();

  for (const item of items.map(normalizeProgress)) {
    if (!item.bookId) {
      continue;
    }

    const current = latestByBookId.get(item.bookId);

    if (!current || getUpdatedAtValue(item) >= getUpdatedAtValue(current)) {
      latestByBookId.set(item.bookId, item);
    }
  }

  return Array.from(latestByBookId.values()).sort((left, right) => getUpdatedAtValue(right) - getUpdatedAtValue(left));
}

export function ReadingProgressProvider({ children }: { children: ReactNode }) {
  const [allProgress, setAllProgress] = useState<ReadingProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProgress = useCallback(async () => {
    setIsLoading(true);

    try {
      const progress = await readingProgressStorage.getAllProgress();
      const nextProgress = dedupeProgress(progress);
      setAllProgress(nextProgress);
      return nextProgress;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProgress();
  }, [refreshProgress]);

  const getProgress = useCallback(
    (bookId?: number | string | null) => {
      const targetBookId = normalizeBookId(bookId);

      if (!targetBookId) {
        return null;
      }

      return allProgress.find((item) => item.bookId === targetBookId) ?? null;
    },
    [allProgress]
  );

  const saveProgress = useCallback(async (progress: SaveReadingProgressInput) => {
    const nextProgress = normalizeProgress(progress);

    if (!nextProgress.bookId) {
      throw new Error('Не указан идентификатор книги.');
    }

    setAllProgress((current) => dedupeProgress([nextProgress, ...current.filter((item) => item.bookId !== nextProgress.bookId)]));

    const savedProgress = await readingProgressStorage.saveProgress(nextProgress);

    setAllProgress((current) => dedupeProgress([savedProgress, ...current.filter((item) => item.bookId !== savedProgress.bookId)]));
    return savedProgress;
  }, []);

  const removeProgress = useCallback(async (bookId: number | string) => {
    const targetBookId = normalizeBookId(bookId);

    if (!targetBookId) {
      return;
    }

    setAllProgress((current) => current.filter((item) => item.bookId !== targetBookId));
    await readingProgressStorage.removeProgress(targetBookId);
  }, []);

  const value = useMemo(
    () => ({
      allProgress,
      getProgress,
      isLoading,
      refreshProgress,
      removeProgress,
      saveProgress,
    }),
    [allProgress, getProgress, isLoading, refreshProgress, removeProgress, saveProgress]
  );

  return <ReadingProgressContext.Provider value={value}>{children}</ReadingProgressContext.Provider>;
}

export function useReadingProgressStore() {
  const context = useContext(ReadingProgressContext);

  if (!context) {
    throw new Error('useReadingProgressStore must be used within ReadingProgressProvider');
  }

  return context;
}
