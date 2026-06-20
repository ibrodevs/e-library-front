import { useCallback, useMemo } from 'react';
import { useReadingProgressStore } from '../store/readingProgressStore';
import type { ReadingProgress } from '../types/readingProgress';

export function useReadingProgress(bookId?: number | string | null) {
  const normalizedBookId = bookId != null && String(bookId).trim() ? String(bookId) : null;
  const {
    getProgress,
    isLoading,
    refreshProgress,
    removeProgress: removeStoredProgress,
    saveProgress: saveStoredProgress,
  } = useReadingProgressStore();
  const progress = getProgress(normalizedBookId);

  const reload = useCallback(async () => {
    const nextProgress = await refreshProgress();

    if (!normalizedBookId) {
      return null;
    }

    return nextProgress.find((item) => item.bookId === normalizedBookId) ?? null;
  }, [normalizedBookId, refreshProgress]);

  const saveProgress = useCallback(
    async (nextProgress: Omit<ReadingProgress, 'bookId' | 'updatedAt'> & { bookId?: number | string }) => {
      const targetBookId = nextProgress.bookId != null ? String(nextProgress.bookId) : normalizedBookId;

      if (!targetBookId) {
        return null;
      }

      return saveStoredProgress({
        ...nextProgress,
        bookId: targetBookId,
      });
    },
    [normalizedBookId, saveStoredProgress]
  );

  const removeProgress = useCallback(async () => {
    if (!normalizedBookId) {
      return;
    }

    await removeStoredProgress(normalizedBookId);
  }, [normalizedBookId, removeStoredProgress]);

  return useMemo(
    () => ({
      progress,
      isLoading,
      reload,
      saveProgress,
      removeProgress,
    }),
    [isLoading, progress, reload, removeProgress, saveProgress]
  );
}
