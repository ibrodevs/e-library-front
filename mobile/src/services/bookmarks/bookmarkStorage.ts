import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BookmarkItem, BookmarkStatus } from '../../types/bookmark';

const BOOKMARKS_KEY = 'bookmarks';

function getUpdatedAtValue(item: BookmarkItem): number {
  const timestamp = Date.parse(item.updatedAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function dedupeBookmarks(bookmarks: BookmarkItem[]): BookmarkItem[] {
  const latestByBookId = new Map<string, BookmarkItem>();

  for (const bookmark of bookmarks) {
    const key = String(bookmark.bookId);
    const current = latestByBookId.get(key);

    if (!current || getUpdatedAtValue(bookmark) >= getUpdatedAtValue(current)) {
      latestByBookId.set(key, bookmark);
    }
  }

  return Array.from(latestByBookId.values()).sort(
    (left, right) => getUpdatedAtValue(right) - getUpdatedAtValue(left)
  );
}

async function readBookmarks(): Promise<BookmarkItem[]> {
  const raw = await AsyncStorage.getItem(BOOKMARKS_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as BookmarkItem[];
    return Array.isArray(parsed) ? dedupeBookmarks(parsed) : [];
  } catch {
    return [];
  }
}

async function writeBookmarks(bookmarks: BookmarkItem[]): Promise<void> {
  await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

export const bookmarkStorage = {
  async getAll(): Promise<BookmarkItem[]> {
    const bookmarks = await readBookmarks();
    await writeBookmarks(bookmarks);
    return bookmarks;
  },

  async getByStatus(status: BookmarkStatus): Promise<BookmarkItem[]> {
    const bookmarks = await readBookmarks();
    return bookmarks.filter((bookmark) => bookmark.status === status);
  },

  async save(bookmark: Omit<BookmarkItem, 'updatedAt'> | BookmarkItem): Promise<BookmarkItem> {
    const bookmarks = await readBookmarks();
    const nextBookmark: BookmarkItem = {
      ...bookmark,
      updatedAt: 'updatedAt' in bookmark ? bookmark.updatedAt : new Date().toISOString(),
    };

    const nextBookmarks = dedupeBookmarks([
      nextBookmark,
      ...bookmarks.filter((item) => item.bookId !== bookmark.bookId),
    ]);

    await writeBookmarks(nextBookmarks);
    return nextBookmark;
  },

  async remove(bookId: number, status?: BookmarkStatus): Promise<void> {
    const bookmarks = await readBookmarks();
    const nextBookmarks = bookmarks.filter((item) => {
      if (item.bookId !== bookId) {
        return true;
      }

      return status ? item.status !== status : false;
    });

    await writeBookmarks(nextBookmarks);
  },
};
