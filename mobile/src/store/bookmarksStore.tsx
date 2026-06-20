import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { bookmarkStorage, dedupeBookmarks } from '../services/bookmarks/bookmarkStorage';
import type { BookmarkItem, BookmarkStatus } from '../types/bookmark';

interface BookmarksContextValue {
  bookmarks: BookmarkItem[];
  byStatus: Record<BookmarkStatus, BookmarkItem[]>;
  isLoading: boolean;
  reload: () => Promise<void>;
  saveBookmark: (bookmark: Omit<BookmarkItem, 'updatedAt'>) => Promise<BookmarkItem>;
  removeBookmark: (bookId: number, status?: BookmarkStatus) => Promise<void>;
  statusByBookId: Record<number, BookmarkStatus>;
  getBookmarkStatus: (bookId: number) => BookmarkStatus | null;
}

const BookmarksContext = createContext<BookmarksContextValue | undefined>(undefined);

function buildByStatus(bookmarks: BookmarkItem[]): Record<BookmarkStatus, BookmarkItem[]> {
  return bookmarks.reduce<Record<BookmarkStatus, BookmarkItem[]>>(
    (accumulator, item) => {
      accumulator[item.status].push(item);
      return accumulator;
    },
    {
      liked: [],
      reading: [],
      planned: [],
      completed: [],
      dropped: [],
    }
  );
}

function buildStatusByBookId(bookmarks: BookmarkItem[]): Record<number, BookmarkStatus> {
  return bookmarks.reduce<Record<number, BookmarkStatus>>((accumulator, item) => {
    accumulator[item.bookId] = item.status;
    return accumulator;
  }, {});
}

export function BookmarksProvider({ children }: { children: React.ReactNode }) {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await bookmarkStorage.getAll();
      setBookmarks(dedupeBookmarks(items));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveBookmark = useCallback(async (bookmark: Omit<BookmarkItem, 'updatedAt'>) => {
    const nextBookmark: BookmarkItem = {
      ...bookmark,
      updatedAt: new Date().toISOString(),
    };

    setBookmarks((current) => {
      return dedupeBookmarks([
        nextBookmark,
        ...current.filter((item) => item.bookId !== bookmark.bookId),
      ]);
    });

    await bookmarkStorage.save(nextBookmark);
    return nextBookmark;
  }, []);

  const removeBookmark = useCallback(async (bookId: number, status?: BookmarkStatus) => {
    await bookmarkStorage.remove(bookId, status);
    setBookmarks((current) =>
      current.filter((item) => {
        if (item.bookId !== bookId) {
          return true;
        }

        return status ? item.status !== status : false;
      })
    );
  }, []);

  const byStatus = useMemo(() => buildByStatus(bookmarks), [bookmarks]);
  const statusByBookId = useMemo(() => buildStatusByBookId(bookmarks), [bookmarks]);

  const value = useMemo<BookmarksContextValue>(
    () => ({
      bookmarks,
      byStatus,
      isLoading,
      reload,
      saveBookmark,
      removeBookmark,
      statusByBookId,
      getBookmarkStatus: (bookId: number) => statusByBookId[bookId] ?? null,
    }),
    [bookmarks, byStatus, isLoading, reload, saveBookmark, removeBookmark, statusByBookId]
  );

  return <BookmarksContext.Provider value={value}>{children}</BookmarksContext.Provider>;
}

export function useBookmarks() {
  const context = useContext(BookmarksContext);

  if (!context) {
    throw new Error('useBookmarks must be used inside BookmarksProvider');
  }

  return context;
}
