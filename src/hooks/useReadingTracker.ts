import { useEffect, useRef, useState, useCallback } from 'react';
import { recordBookRead, isBookRead, formatTime } from '../utils/readingStats';

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_READ_TIME_SEC = 20;      // seconds on page to count as "read"
const PAGE_READ_INTERACTIONS = 3;   // minimum user interactions needed
const SAVE_INTERVAL_MS = 10_000;    // auto-save every 10 seconds

export interface ReadingTrackerState {
  pagesRead: number;
  timeOnCurrentPageSec: number;
  totalTimeSec: number;
  currentPageRead: boolean;    // true when current page satisfies criteria
  bookMarkedAsRead: boolean;   // true when book is saved
  justMarkedPage: boolean;     // pulse flag for toast notification
}

interface UseReadingTrackerOptions {
  bookId: number;
  bookTitle: string;
  bookAuthor?: string;
  coverUrl?: string;
  currentPage: number;
  totalPages: number;
  userEmail?: string;
  userName?: string;
  userGroup?: string;
  enabled?: boolean;
}

export function useReadingTracker({
  bookId,
  bookTitle,
  bookAuthor = '',
  coverUrl = '',
  currentPage,
  totalPages,
  userEmail,
  userName,
  userGroup = '',
  enabled = true,
}: UseReadingTrackerOptions): ReadingTrackerState {
  // ── Per-page tracking ──────────────────────────────────────────────────────
  const pageTimerRef = useRef<number>(0);          // seconds on current page
  const interactionCountRef = useRef<number>(0);   // interactions on current page
  const readPagesRef = useRef<Set<number>>(new Set());  // which page numbers are read

  // ── Session tracking (total) ───────────────────────────────────────────────
  const sessionTimerRef = useRef<number>(0);       // total seconds this session

  // ── Stable refs ──────────────────────────────────────────────────────────
  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;

  // ── State ─────────────────────────────────────────────────────────────────
  const [state, setState] = useState<ReadingTrackerState>({
    pagesRead: 0,
    timeOnCurrentPageSec: 0,
    totalTimeSec: 0,
    currentPageRead: false,
    bookMarkedAsRead: false,
    justMarkedPage: false,
  });

  // Keep bookMarkedAsRead accurate from localStorage on mount
  const [bookMarkedAsRead, setBookMarkedAsRead] = useState(
    userEmail ? isBookRead(userEmail, bookId) : false
  );

  // ── Save book record ───────────────────────────────────────────────────────
  const saveRecord = useCallback(() => {
    if (!userEmail || !userName || !enabled) return;
    if (readPagesRef.current.size === 0 && sessionTimerRef.current < PAGE_READ_TIME_SEC) return;

    recordBookRead(
      userEmail,
      userName,
      userGroup,
      bookId,
      bookTitle,
      bookAuthor,
      coverUrl,
      readPagesRef.current.size,
      totalPages,
      sessionTimerRef.current
    );
    setBookMarkedAsRead(true);
  }, [userEmail, userName, userGroup, bookId, bookTitle, bookAuthor, coverUrl, totalPages, enabled]);

  // ── Reset page timer when page changes ────────────────────────────────────
  useEffect(() => {
    pageTimerRef.current = 0;
    interactionCountRef.current = 0;
    setState((prev) => ({ ...prev, timeOnCurrentPageSec: 0, currentPageRead: false, justMarkedPage: false }));
  }, [currentPage]);

  // ── Main tick: 1-second interval ──────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !userEmail) return;

    const tick = () => {
      pageTimerRef.current += 1;
      sessionTimerRef.current += 1;

      const timeMet = pageTimerRef.current >= PAGE_READ_TIME_SEC;
      const interactionMet = interactionCountRef.current >= PAGE_READ_INTERACTIONS;
      const alreadyRead = readPagesRef.current.has(currentPageRef.current);

      if (timeMet && interactionMet && !alreadyRead) {
        readPagesRef.current.add(currentPageRef.current);
        setState((prev) => ({
          ...prev,
          pagesRead: readPagesRef.current.size,
          timeOnCurrentPageSec: pageTimerRef.current,
          totalTimeSec: sessionTimerRef.current,
          currentPageRead: true,
          justMarkedPage: true,
        }));

        // Clear "justMarkedPage" after 3 seconds (toast auto-dismiss signal)
        setTimeout(() => {
          setState((prev) => ({ ...prev, justMarkedPage: false }));
        }, 3000);
      } else {
        setState((prev) => ({
          ...prev,
          timeOnCurrentPageSec: pageTimerRef.current,
          totalTimeSec: sessionTimerRef.current,
          pagesRead: readPagesRef.current.size,
          bookMarkedAsRead,
        }));
      }
    };

    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [enabled, userEmail, bookMarkedAsRead]);

  // ── Auto-save every SAVE_INTERVAL_MS ──────────────────────────────────────
  useEffect(() => {
    if (!enabled || !userEmail) return;

    const autoSave = setInterval(() => {
      saveRecord();
    }, SAVE_INTERVAL_MS);

    return () => clearInterval(autoSave);
  }, [enabled, userEmail, saveRecord]);

  // ── Save on unmount (user leaves reader) ──────────────────────────────────
  useEffect(() => {
    return () => {
      saveRecord();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── User interaction listeners ─────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !userEmail) return;

    let throttleFlag = false;

    const handleInteraction = () => {
      if (throttleFlag) return;
      throttleFlag = true;
      interactionCountRef.current += 1;
      setTimeout(() => { throttleFlag = false; }, 300); // throttle 300ms
    };

    window.addEventListener('mousemove', handleInteraction, { passive: true });
    window.addEventListener('click', handleInteraction, { passive: true });
    window.addEventListener('keydown', handleInteraction, { passive: true });
    window.addEventListener('scroll', handleInteraction, { passive: true });
    window.addEventListener('touchstart', handleInteraction, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [enabled, userEmail]);

  return {
    pagesRead: state.pagesRead,
    timeOnCurrentPageSec: state.timeOnCurrentPageSec,
    totalTimeSec: state.totalTimeSec,
    currentPageRead: state.currentPageRead,
    bookMarkedAsRead,
    justMarkedPage: state.justMarkedPage,
  };
}

export { formatTime };
