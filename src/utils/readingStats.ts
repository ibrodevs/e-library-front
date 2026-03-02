// ─── Reading Stats Utility ───────────────────────────────────────────────────
// All data stored in localStorage per user email.

export interface BookReadRecord {
  bookId: number;
  bookTitle: string;
  bookAuthor?: string;
  coverUrl?: string;
  readAt: string;          // ISO date string
  pagesRead: number;
  totalPages: number;
  timeSpentSeconds: number;
}

export interface UserReadingStats {
  userEmail: string;
  userName: string;
  userGroup?: string;
  booksRead: BookReadRecord[];
  totalTimeSeconds: number;
  lastActive: string;
}

const STATS_KEY_PREFIX = 'readingStats_';

function getKey(email: string): string {
  return STATS_KEY_PREFIX + email;
}

/** Load stats for a given user email */
export function loadStats(email: string): UserReadingStats | null {
  try {
    const raw = localStorage.getItem(getKey(email));
    if (!raw) return null;
    return JSON.parse(raw) as UserReadingStats;
  } catch {
    return null;
  }
}

/** Save stats for a given user */
export function saveStats(stats: UserReadingStats): void {
  try {
    localStorage.setItem(getKey(stats.userEmail), JSON.stringify(stats));
  } catch {
    // localStorage full — ignore
  }
}

/** Create a fresh stats object for a new user */
export function createStats(email: string, name: string, group?: string): UserReadingStats {
  return {
    userEmail: email,
    userName: name,
    userGroup: group,
    booksRead: [],
    totalTimeSeconds: 0,
    lastActive: new Date().toISOString(),
  };
}

/** Mark a book as read (or update existing record) */
export function recordBookRead(
  email: string,
  name: string,
  group: string,
  bookId: number,
  bookTitle: string,
  bookAuthor: string,
  coverUrl: string,
  pagesRead: number,
  totalPages: number,
  timeSpentSeconds: number
): UserReadingStats {
  const stats = loadStats(email) ?? createStats(email, name, group);
  stats.userGroup = group || stats.userGroup;

  const existing = stats.booksRead.findIndex((b) => b.bookId === bookId);
  const record: BookReadRecord = {
    bookId,
    bookTitle,
    bookAuthor,
    coverUrl,
    readAt: new Date().toISOString(),
    pagesRead,
    totalPages,
    timeSpentSeconds,
  };

  if (existing !== -1) {
    // Update — take the better stats
    const prev = stats.booksRead[existing];
    record.pagesRead = Math.max(prev.pagesRead, pagesRead);
    record.timeSpentSeconds = prev.timeSpentSeconds + timeSpentSeconds;
    stats.booksRead[existing] = record;
  } else {
    stats.booksRead.unshift(record); // newest first
  }

  stats.totalTimeSeconds =
    stats.booksRead.reduce((sum, b) => sum + b.timeSpentSeconds, 0);
  stats.lastActive = new Date().toISOString();
  stats.userName = name;
  if (group) stats.userGroup = group;

  saveStats(stats);
  return stats;
}

/** Check if a book has already been counted as "read" */
export function isBookRead(email: string, bookId: number): boolean {
  const stats = loadStats(email);
  if (!stats) return false;
  return stats.booksRead.some((b) => b.bookId === bookId);
}

/** Format seconds into human-readable string (e.g. "1ч 23м") */
export function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}с`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}м`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}ч ${rem}м` : `${h}ч`;
}

/** Get ALL users' stats from localStorage (for leaderboard) */
export function getAllUsersStats(): UserReadingStats[] {
  const results: UserReadingStats[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STATS_KEY_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) results.push(JSON.parse(raw));
      }
    }
  } catch {
    // ignore
  }
  return results.sort((a, b) => b.booksRead.length - a.booksRead.length);
}
