import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReadingProgress } from '../../types/readingProgress';

const READING_PROGRESS_KEY = 'reading_progress';

function normalizeBookId(bookId: number | string): string {
  return String(bookId);
}

function getUpdatedAtValue(item: ReadingProgress): number {
  const timestamp = Date.parse(item.updatedAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function normalizeProgress(progress: ReadingProgress): ReadingProgress {
  const currentPage = Number.isFinite(progress.currentPage) ? Math.max(1, Math.floor(progress.currentPage)) : 1;
  const totalPages =
    typeof progress.totalPages === 'number' && Number.isFinite(progress.totalPages) && progress.totalPages > 0
      ? Math.floor(progress.totalPages)
      : undefined;
  const progressPercent =
    typeof progress.progressPercent === 'number' && Number.isFinite(progress.progressPercent)
      ? Math.max(0, Math.min(100, progress.progressPercent))
      : totalPages
        ? Math.round((Math.min(currentPage, totalPages) / totalPages) * 100)
        : undefined;

  return {
    ...progress,
    bookId: normalizeBookId(progress.bookId),
    currentPage,
    totalPages,
    progressPercent,
    updatedAt: progress.updatedAt || new Date().toISOString(),
  };
}

function dedupeProgress(items: ReadingProgress[]): ReadingProgress[] {
  const latestByBookId = new Map<string, ReadingProgress>();

  for (const item of items.map(normalizeProgress)) {
    const current = latestByBookId.get(item.bookId);

    if (!current || getUpdatedAtValue(item) >= getUpdatedAtValue(current)) {
      latestByBookId.set(item.bookId, item);
    }
  }

  return Array.from(latestByBookId.values()).sort(
    (left, right) => getUpdatedAtValue(right) - getUpdatedAtValue(left)
  );
}

async function readAll(): Promise<ReadingProgress[]> {
  const raw = await AsyncStorage.getItem(READING_PROGRESS_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as ReadingProgress[];
    return Array.isArray(parsed) ? dedupeProgress(parsed) : [];
  } catch {
    return [];
  }
}

async function writeAll(items: ReadingProgress[]): Promise<void> {
  await AsyncStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(dedupeProgress(items)));
}

export const readingProgressStorage = {
  async getProgress(bookId: number | string): Promise<ReadingProgress | null> {
    const items = await readAll();
    return items.find((item) => item.bookId === normalizeBookId(bookId)) ?? null;
  },

  async getAllProgress(): Promise<ReadingProgress[]> {
    const items = await readAll();
    await writeAll(items);
    return items;
  },

  async saveProgress(progress: Omit<ReadingProgress, 'updatedAt'> | ReadingProgress): Promise<ReadingProgress> {
    const items = await readAll();
    const nextProgress = normalizeProgress({
      ...progress,
      updatedAt: 'updatedAt' in progress ? progress.updatedAt : new Date().toISOString(),
    });

    await writeAll([
      nextProgress,
      ...items.filter((item) => item.bookId !== nextProgress.bookId),
    ]);

    return nextProgress;
  },

  async removeProgress(bookId: number | string): Promise<void> {
    const items = await readAll();
    await writeAll(items.filter((item) => item.bookId !== normalizeBookId(bookId)));
  },

  async clearProgress(): Promise<void> {
    await AsyncStorage.removeItem(READING_PROGRESS_KEY);
  },
};
