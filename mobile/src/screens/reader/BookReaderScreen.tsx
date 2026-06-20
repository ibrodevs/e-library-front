import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createElement, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { ActivityIndicator, Animated, Modal, Platform, Pressable, SafeAreaView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../../components/common/AppButton';
import { AppScreen } from '../../components/common/AppScreen';
import { AppText } from '../../components/common/AppText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useReadingProgress } from '../../hooks/useReadingProgress';
import { useScreenProtection } from '../../hooks/useScreenProtection';
import { getBookFileUrl } from '../../services/api/bookApi';
import { tokenStorage } from '../../services/auth/tokenStorage';
import type { AppTheme } from '../../theme';
import { NativePdfReader as NativePdfView, type NativePdfReaderHandle } from './NativePdfReader';

type ReaderRouteParams = {
  bookId?: number | string;
  title?: string;
  pdfUrl?: string | null;
  cover_image_url?: string | null;
  initialPage?: number | null;
  totalPages?: number | null;
};

type WebPdfState = {
  error: string | null;
  isLoading: boolean;
  isRendered: boolean;
};

type ProgressPayload = {
  title: string;
  cover_image_url?: string;
  currentPage: number;
  totalPages?: number;
  progressPercent?: number;
};

type ReadingMode = 'scroll' | 'tap';

const PDF_ACCEPT_HEADER = 'application/pdf,*/*';
const SAVE_PROGRESS_DELAY_MS = 500;
const CONTROLS_AUTO_HIDE_MS = 3000;
const READING_MODE_STORAGE_KEY = 'reader:readingMode';

function logMobilePdf(event: string, payload: Record<string, unknown>) {
  if (__DEV__) {
    console.debug(`[mobile pdf] ${event}`, payload);
  }
}

function normalizePage(value: unknown): number | null {
  const page = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : null;
}

function normalizeTotalPages(value: unknown): number | undefined {
  const totalPages = normalizePage(value);
  return totalPages ?? undefined;
}

function getPdfErrorMessage(status: number): string {
  if (status === 401) {
    return 'Сессия истекла. Войдите снова.';
  }

  if (status === 403) {
    return 'Нет доступа к этой книге.';
  }

  if (status === 404) {
    return 'PDF файл не найден.';
  }

  if (status === 406) {
    return 'Сервер не принял формат запроса.';
  }

  if (status >= 500) {
    return 'Ошибка сервера при загрузке книги.';
  }

  return `Не удалось открыть PDF. Код ошибки: ${status}.`;
}

function getPdfDownloadErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || '');

  if (message.includes('PDF_DOWNLOAD_STATUS_401')) {
    return 'Сессия истекла. Войдите снова.';
  }

  if (message.includes('PDF_DOWNLOAD_STATUS_403')) {
    return 'Нет доступа к этой книге.';
  }

  if (message.includes('PDF_DOWNLOAD_STATUS_404')) {
    return 'PDF файл не найден.';
  }

  if (message.includes('PDF_DOWNLOAD_STATUS_406')) {
    return 'Сервер не принял формат запроса.';
  }

  if (message.includes('PDF_DOWNLOAD_STATUS_5')) {
    return 'Ошибка сервера при загрузке книги.';
  }

  if (message.includes('PDF_CACHE_INVALID')) {
    return 'Файл книги повреждён. Попробуйте скачать заново.';
  }

  if (message.toLowerCase().includes('cancel')) {
    return 'Загрузка книги отменена.';
  }

  if (error instanceof TypeError || message.toLowerCase().includes('network') || message.toLowerCase().includes('failed')) {
    return 'Ошибка сети.';
  }

  return message || 'Не удалось загрузить книгу.';
}

function formatFileSize(bytes?: number | null): string | null {
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0) {
    return null;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} КБ`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

function getProgressPercent(currentPage: number, totalPages?: number): number | undefined {
  if (!totalPages) {
    return undefined;
  }

  return Math.round((Math.min(currentPage, totalPages) / totalPages) * 100);
}

function normalizeLoadProgress(value: number): number | null {
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }

  const normalized = value > 1 ? value / 100 : value;
  return Math.max(0, Math.min(1, normalized));
}

function clearElement(element: any) {
  while (element?.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function getDevicePixelRatio(): number {
  const windowRef = (globalThis as any).window;
  const ratio = windowRef?.devicePixelRatio ?? 1;
  return Number.isFinite(ratio) && ratio > 0 ? Math.min(ratio, 2) : 1;
}

function requestReaderFrame(callback: () => void): number {
  const requestFrame = (globalThis as any).requestAnimationFrame;

  if (typeof requestFrame === 'function') {
    return requestFrame(callback);
  }

  return Number(setTimeout(callback, 16));
}

function cancelReaderFrame(frameId: number | null) {
  if (frameId == null) {
    return;
  }

  const cancelFrame = (globalThis as any).cancelAnimationFrame;

  if (typeof cancelFrame === 'function') {
    cancelFrame(frameId);
    return;
  }

  clearTimeout(frameId);
}

async function loadPdfJs(): Promise<any> {
  const pdfJs = await import('pdfjs-dist');

  try {
    if (pdfJs.GlobalWorkerOptions && !pdfJs.GlobalWorkerOptions.workerSrc) {
      pdfJs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfJs.version}/build/pdf.worker.min.mjs`;
    }
  } catch {
    // PDF.js can still use its fallback worker path if this assignment is blocked.
  }

  return pdfJs;
}

function WebPdfPagesReader({
  bookId,
  initialPage,
  onLoaded,
  onPageChange,
  onReaderPress,
  onReaderScroll,
  onRetry,
  pdfUrl,
  retryKey,
}: {
  bookId: string | null;
  initialPage: number;
  onLoaded: (totalPages: number) => void;
  onPageChange: (page: number) => void;
  onReaderPress: () => void;
  onReaderScroll: () => void;
  onRetry: () => void;
  pdfUrl: string;
  retryKey: number;
}) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [readerState, setReaderState] = useState<WebPdfState>({
    error: null,
    isLoading: true,
    isRendered: false,
  });
  const containerRef = useRef<any>(null);
  const pagesHostRef = useRef<any>(null);
  const pagesRef = useRef<any[]>([]);
  const pdfDocumentRef = useRef<any>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const lastReportedPageRef = useRef(0);
  const hasRestoredPageRef = useRef(false);

  const reportPage = useCallback(
    (page: number) => {
      const nextPage = normalizePage(page) ?? 1;

      if (nextPage === lastReportedPageRef.current) {
        return;
      }

      lastReportedPageRef.current = nextPage;
      onPageChange(nextPage);
    },
    [onPageChange]
  );

  const detectCurrentPage = useCallback(() => {
    const container = containerRef.current;
    const pages = pagesRef.current;

    if (!container || !pages.length) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const targetY = containerRect.top + Math.min(containerRect.height * 0.35, 220);
    let bestDistance = Number.POSITIVE_INFINITY;
    let nextPage = lastReportedPageRef.current || 1;

    for (const pageElement of pages) {
      const pageRect = pageElement.getBoundingClientRect();

      if (pageRect.bottom < containerRect.top || pageRect.top > containerRect.bottom) {
        continue;
      }

      const distance = Math.abs(pageRect.top - targetY);

      if (distance < bestDistance) {
        bestDistance = distance;
        nextPage = Number(pageElement.dataset?.pageNumber) || nextPage;
      }
    }

    reportPage(nextPage);
  }, [reportPage]);

  const schedulePageDetection = useCallback(() => {
    onReaderScroll();

    if (scrollFrameRef.current != null) {
      return;
    }

    scrollFrameRef.current = requestReaderFrame(() => {
      scrollFrameRef.current = null;
      detectCurrentPage();
    });
  }, [detectCurrentPage, onReaderScroll]);

  const scrollToPage = useCallback(
    (page: number): boolean => {
      const container = containerRef.current;
      const pages = pagesRef.current;

      if (!container || !pages.length) {
        return false;
      }

      const targetPage = Math.max(1, Math.min(page, pages.length));
      const pageElement = pages[targetPage - 1];

      if (!pageElement) {
        return false;
      }

      const top = Math.max(0, pageElement.offsetTop - 12);

      if (typeof container.scrollTo === 'function') {
        container.scrollTo({ top, behavior: 'auto' });
      } else {
        container.scrollTop = top;
      }

      reportPage(targetPage);
      return true;
    },
    [reportPage]
  );

  useEffect(() => {
    let mounted = true;
    let hasRemoteSource = false;
    let cancelled = false;
    const AbortControllerCtor = (globalThis as any).AbortController;
    const abortController = typeof AbortControllerCtor === 'function' ? new AbortControllerCtor() : null;

    async function renderPdf() {
      const documentRef = (globalThis as any).document;
      const host = pagesHostRef.current;
      const container = containerRef.current;

      setReaderState({ error: null, isLoading: true, isRendered: false });
      pagesRef.current = [];
      lastReportedPageRef.current = 0;
      hasRestoredPageRef.current = false;

      if (host) {
        clearElement(host);
      }

      if (pdfDocumentRef.current?.destroy) {
        void pdfDocumentRef.current.destroy();
        pdfDocumentRef.current = null;
      }

      try {
        if (!documentRef || !host || !container) {
          throw new Error('Не удалось подготовить область чтения.');
        }

        const accessToken = await tokenStorage.getAccessToken();

        if (!accessToken) {
          throw new Error('Сессия истекла. Войдите снова.');
        }

        if (__DEV__) {
          console.debug('[reader pdf request]', {
            bookId,
            pdfUrl,
            hasToken: Boolean(accessToken),
            accept: PDF_ACCEPT_HEADER,
          });
        }

        const response = await fetch(pdfUrl, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: PDF_ACCEPT_HEADER,
          },
          signal: abortController?.signal,
        } as any);

        if (__DEV__) {
          console.debug('[reader pdf response]', {
            status: response.status,
            contentType: response.headers.get('content-type'),
          });
        }

        if (!response.ok) {
          throw new Error(getPdfErrorMessage(response.status));
        }

        const blob = await response.blob();

        if (!blob.size) {
          throw new Error('PDF файл не найден.');
        }

        const pdfJs = await loadPdfJs();
        const arrayBuffer = await blob.arrayBuffer();
        const loadingTask = pdfJs.getDocument({
          data: new Uint8Array(arrayBuffer),
          useSystemFonts: true,
        });
        const pdfDocument = await loadingTask.promise;

        if (cancelled) {
          await pdfDocument.destroy?.();
          return;
        }

        pdfDocumentRef.current = pdfDocument;
        const totalPages = pdfDocument.numPages;
        const containerWidth = Math.max(320, container.clientWidth || host.clientWidth || 720);
        const pageWidth = Math.max(300, Math.min(containerWidth - 8, 980));
        const outputScale = getDevicePixelRatio();

        for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
          if (cancelled) {
            return;
          }

          const pageWrapper = documentRef.createElement('div');
          pageWrapper.dataset.pageNumber = String(pageNumber);
          pageWrapper.style.width = '100%';
          pageWrapper.style.display = 'flex';
          pageWrapper.style.justifyContent = 'center';
          pageWrapper.style.padding = '0 4px 10px';
          pageWrapper.style.boxSizing = 'border-box';

          const canvas = documentRef.createElement('canvas');
          canvas.style.display = 'block';
          canvas.style.maxWidth = '100%';
          canvas.style.background = '#ffffff';
          canvas.style.border = '1px solid rgba(15, 23, 42, 0.10)';
          canvas.style.borderRadius = '2px';
          canvas.style.boxShadow = theme.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.32)' : '0 2px 8px rgba(15,23,42,0.08)';

          pageWrapper.appendChild(canvas);
          host.appendChild(pageWrapper);
          pagesRef.current.push(pageWrapper);

          const page = await pdfDocument.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1 });
          const scale = pageWidth / viewport.width;
          const scaledViewport = page.getViewport({ scale });
          const context = canvas.getContext('2d');

          if (!context) {
            throw new Error('Не удалось прочитать PDF.');
          }

          canvas.width = Math.floor(scaledViewport.width * outputScale);
          canvas.height = Math.floor(scaledViewport.height * outputScale);
          canvas.style.width = `${Math.floor(scaledViewport.width)}px`;
          canvas.style.height = `${Math.floor(scaledViewport.height)}px`;
          context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

          await page.render({
            canvasContext: context,
            viewport: scaledViewport,
          }).promise;

          page.cleanup?.();
        }

        if (mounted) {
          setReaderState({ error: null, isLoading: false, isRendered: true });
          onLoaded(totalPages);

          requestReaderFrame(() => {
            const restoredPage = Math.max(1, Math.min(initialPage, totalPages));

            if (restoredPage > 1) {
              hasRestoredPageRef.current = scrollToPage(restoredPage);
              return;
            }

            reportPage(1);
            detectCurrentPage();
          });
        }
      } catch (error) {
        if (cancelled || (error instanceof Error && error.name === 'AbortError')) {
          return;
        }

        if (mounted) {
          setReaderState({
            error:
              error instanceof TypeError
                ? 'Ошибка сети.'
                : error instanceof Error
                  ? error.message
                  : 'Не удалось прочитать PDF.',
            isLoading: false,
            isRendered: false,
          });
        }
      }
    }

    void renderPdf();

    return () => {
      mounted = false;
      cancelled = true;
      abortController?.abort?.();
      cancelReaderFrame(scrollFrameRef.current);
      scrollFrameRef.current = null;

      if (pagesHostRef.current) {
        clearElement(pagesHostRef.current);
      }

      pagesRef.current = [];

      if (pdfDocumentRef.current?.destroy) {
        void pdfDocumentRef.current.destroy();
        pdfDocumentRef.current = null;
      }
    };
  }, [bookId, detectCurrentPage, initialPage, onLoaded, pdfUrl, reportPage, retryKey, scrollToPage, theme.mode]);

  useEffect(() => {
    if (!readerState.isRendered || hasRestoredPageRef.current || initialPage <= 1) {
      return;
    }

    hasRestoredPageRef.current = scrollToPage(initialPage);
  }, [initialPage, readerState.isRendered, scrollToPage]);

  return createElement(
    'div' as any,
    {
      style: {
        height: '100%',
        position: 'relative',
        width: '100%',
        backgroundColor: theme.colors.background,
      },
    },
    createElement(
      'div' as any,
      {
        ref: containerRef,
        onClick: onReaderPress,
        onScroll: schedulePageDetection,
        style: {
          boxSizing: 'border-box',
          height: '100%',
          overflowX: 'hidden',
          overflowY: 'auto',
          padding: '76px 0 96px',
          width: '100%',
        },
      },
      createElement('div' as any, {
        ref: pagesHostRef,
        style: {
          minHeight: '100%',
          width: '100%',
        },
      })
    ),
    readerState.isLoading
      ? (
          <View style={styles.readerOverlay}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
            <AppText color={theme.colors.textSecondary}>Загрузка книги...</AppText>
          </View>
        )
      : null,
    readerState.error
      ? (
          <View style={styles.readerOverlay}>
            <Ionicons color={theme.colors.danger} name="alert-circle-outline" size={28} />
            <AppText style={styles.center} variant="title">
              Не удалось открыть книгу
            </AppText>
            <AppText color={theme.colors.textSecondary} style={styles.center}>
              {readerState.error}
            </AppText>
            <AppButton onPress={onRetry} title="Повторить" variant="secondary" />
          </View>
        )
      : null
  );
}

function NativePdfReaderShell({
  bookId,
  initialPage,
  nativePdfRef,
  onLoaded,
  onPageChange,
  onReaderPress,
  onRetry,
  pdfUrl,
  readingMode,
  retryKey,
}: {
  bookId: string;
  initialPage: number;
  nativePdfRef: RefObject<NativePdfReaderHandle | null>;
  onLoaded: (totalPages: number) => void;
  onPageChange: (page: number) => void;
  onReaderPress: () => void;
  onRetry: () => void;
  pdfUrl: string;
  readingMode: ReadingMode;
  retryKey: number;
}) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(true);
  const [isPdfLoaded, setIsPdfLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<number | null>(null);
  const mountedRef = useRef(true);
  const lastNativePageRef = useRef(initialPage);
  const sourceReadyAtRef = useRef<number | null>(null);
  const pdfSource = useMemo(() => {
    if (!accessToken) {
      return null;
    }

    return {
      uri: pdfUrl,
      cache: false as const,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: PDF_ACCEPT_HEADER,
      },
    };
  }, [accessToken, pdfUrl]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function prepareSource() {
      setError(null);
      setAccessToken(null);
      setIsPreparing(true);
      setIsPdfLoaded(false);
      setLoadingProgress(null);
      sourceReadyAtRef.current = null;

      try {
        const nextAccessToken = await tokenStorage.getAccessToken();

        if (!nextAccessToken) {
          throw new Error('Сессия истекла. Войдите снова.');
        }

        const sourceStartedAt = Date.now();

        if (mounted) {
          logMobilePdf('strategy=remote-direct', {
            bookId,
            cacheDisabledForFirstOpen: true,
            endpointType: 'book-file',
            hasAccessToken: Boolean(nextAccessToken),
            pdfUrlExists: Boolean(pdfUrl),
            readerType: 'react-native-pdf',
            sourceReadyMs: Date.now() - sourceStartedAt,
          });
          sourceReadyAtRef.current = Date.now();
          setAccessToken(nextAccessToken);
        }
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : String(loadError || '');

        logMobilePdf('prepare failed', {
          bookId,
          endpointType: 'book-file',
          hasAccessToken: false,
          message,
          pdfUrlExists: Boolean(pdfUrl),
          readerType: 'react-native-pdf',
        });

        if (mounted) {
          setError(message || 'Не удалось открыть книгу. Попробуйте ещё раз.');
        }
      } finally {
        if (mounted) {
          setIsPreparing(false);
        }
      }
    }

    void prepareSource();

    return () => {
      mounted = false;
    };
  }, [bookId, pdfUrl, retryKey]);

  if (error) {
    return (
      <View style={styles.readerState}>
        <Ionicons color={theme.colors.danger} name="alert-circle-outline" size={28} />
        <AppText style={styles.center} variant="title">
          Не удалось открыть книгу
        </AppText>
        <AppText color={theme.colors.textSecondary} style={styles.center}>
          {error}
        </AppText>
        <AppButton onPress={onRetry} title="Повторить" variant="secondary" />
      </View>
    );
  }

  if (isPreparing || !pdfSource) {
    return (
      <View style={styles.readerState}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <AppText color={theme.colors.textSecondary}>Подготовка книги...</AppText>
      </View>
    );
  }

  return (
    <View style={[styles.nativeReaderWrap, readingMode === 'tap' ? styles.nativeReaderWrapTap : null]}>
      <NativePdfView
        ref={nativePdfRef}
        initialPage={initialPage}
        onLoadComplete={(numberOfPages) => {
          if (!mountedRef.current) {
            return;
          }

          setIsPdfLoaded(true);
          setLoadingProgress(1);
          onLoaded(numberOfPages);
          lastNativePageRef.current = initialPage;
          logMobilePdf('native opened', {
            bookId,
            firstPageLoadedMs: sourceReadyAtRef.current ? Date.now() - sourceReadyAtRef.current : undefined,
            pages: numberOfPages,
            readerType: 'react-native-pdf',
          });
        }}
        onLoadProgress={(percent) => {
          const normalized = normalizeLoadProgress(percent);

          if (mountedRef.current && normalized != null) {
            setLoadingProgress(normalized);
          }
        }}
        onPageChanged={(page, numberOfPages) => {
          if (!mountedRef.current) {
            return;
          }

          lastNativePageRef.current = page;
          onLoaded(numberOfPages);
          onPageChange(page);
        }}
        onError={(pdfError: unknown) => {
          if (!mountedRef.current) {
            return;
          }

          const message = pdfError instanceof Error ? pdfError.message : String(pdfError || '');
          const normalized = message.toLowerCase();

          logMobilePdf('native failed', {
            bookId,
            endpointType: 'book-file',
            hasAccessToken: Boolean(accessToken),
            message,
            pdfUrlExists: Boolean(pdfUrl),
            readerType: 'react-native-pdf',
          });

          if (normalized.includes('401')) {
            setError('Сессия истекла. Войдите снова.');
          } else if (normalized.includes('403')) {
            setError('Нет доступа к этой книге.');
          } else if (normalized.includes('404')) {
            setError('PDF файл не найден.');
          } else if (normalized.includes('406')) {
            setError('Сервер не принял формат запроса.');
          } else if (normalized.includes('500')) {
            setError('Ошибка сервера при загрузке книги.');
          } else if (normalized.includes('network') || normalized.includes('failed')) {
            setError('Ошибка сети.');
          } else {
            setError('Не удалось открыть книгу. Попробуйте ещё раз.');
          }
        }}
        onPageSingleTap={readingMode === 'scroll' ? onReaderPress : undefined}
        readingMode={readingMode}
        renderActivityIndicator={() => (
          <View style={styles.readerState}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
            <AppText color={theme.colors.textSecondary}>Открываем книгу...</AppText>
          </View>
        )}
        source={pdfSource}
        style={[styles.nativePdf, readingMode === 'tap' ? styles.nativePdfTap : null]}
      />
      {!isPdfLoaded ? (
        <View pointerEvents="none" style={styles.readerLoadingOverlay}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <AppText color={theme.colors.textSecondary}>Открываем книгу...</AppText>
          {loadingProgress != null ? (
            <>
              <AppText color={theme.colors.textMuted} variant="bodySmall">
                Загрузка: {Math.round(loadingProgress * 100)}%
              </AppText>
              <View style={styles.loadProgressTrack}>
                <View style={[styles.loadProgressFill, { width: `${Math.round(loadingProgress * 100)}%` }]} />
              </View>
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function UnsupportedNativePdfReader({
  onRetry,
}: {
  onRetry: () => void;
}) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.readerState}>
      <Ionicons color={theme.colors.primary} name="document-text-outline" size={34} />
      <AppText style={styles.center} variant="title">
        PDF reader доступен для Android.
      </AppText>
      <AppText color={theme.colors.textSecondary} style={styles.center}>
        Откройте книгу в Android APK или web-preview.
      </AppText>
      <AppButton onPress={onRetry} title="Повторить" variant="secondary" />
    </View>
  );
}

export function BookReaderScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = (route.params ?? {}) as ReaderRouteParams;
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const bookId = params.bookId != null && String(params.bookId).trim() ? String(params.bookId) : null;
  const title = params.title?.trim() || 'Книга';
  const routeInitialPage = normalizePage(params.initialPage);
  const routeTotalPages = normalizeTotalPages(params.totalPages);
  const { isLoading: isProgressLoading, progress, saveProgress } = useReadingProgress(bookId);
  const [currentPage, setCurrentPage] = useState(routeInitialPage ?? 1);
  const [restorePage, setRestorePage] = useState(routeInitialPage ?? 1);
  const [detectedTotalPages, setDetectedTotalPages] = useState<number | undefined>(routeTotalPages);
  const [retryKey, setRetryKey] = useState(0);
  const [hasOpenedPdf, setHasOpenedPdf] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [modeModalVisible, setModeModalVisible] = useState(false);
  const [readingMode, setReadingMode] = useState<ReadingMode>('scroll');
  const [modeNotice, setModeNotice] = useState<string | null>(null);
  const controlsAnimation = useRef(new Animated.Value(1)).current;
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nativePdfHandleRef = useRef<NativePdfReaderHandle | null>(null);
  const restoredProgressRef = useRef(Boolean(routeInitialPage));

  const totalPages = routeTotalPages ?? detectedTotalPages ?? progress?.totalPages;
  const progressPercent = getProgressPercent(currentPage, totalPages);
  const pdfUrl = bookId ? getBookFileUrl(bookId) : params.pdfUrl ?? null;

  useScreenProtection(true);

  useEffect(() => {
    let mounted = true;

    async function restoreReadingMode() {
      try {
        const storedMode = await AsyncStorage.getItem(READING_MODE_STORAGE_KEY);

        if (!mounted) {
          return;
        }

        if (storedMode === 'scroll' || storedMode === 'tap') {
          setReadingMode(storedMode);
        }
      } catch {
        // Keep stable scroll mode if storage is unavailable.
      }
    }

    void restoreReadingMode();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    Animated.timing(controlsAnimation, {
      toValue: controlsVisible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [controlsAnimation, controlsVisible]);

  const clearAutoHideTimer = useCallback(() => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  }, []);

  const scheduleAutoHide = useCallback(() => {
    clearAutoHideTimer();
    autoHideTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, CONTROLS_AUTO_HIDE_MS);
  }, [clearAutoHideTimer]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    scheduleAutoHide();
  }, [scheduleAutoHide]);

  const hideControls = useCallback(() => {
    clearAutoHideTimer();
    setControlsVisible(false);
  }, [clearAutoHideTimer]);

  const toggleControls = useCallback(() => {
    setControlsVisible((visible) => {
      const nextVisible = !visible;

      if (nextVisible) {
        scheduleAutoHide();
      } else {
        clearAutoHideTimer();
      }

      return nextVisible;
    });
  }, [clearAutoHideTimer, scheduleAutoHide]);

  useEffect(() => {
    scheduleAutoHide();

    return () => {
      clearAutoHideTimer();
    };
  }, [clearAutoHideTimer, scheduleAutoHide]);

  useEffect(() => {
    const nextInitialPage = routeInitialPage ?? 1;
    restoredProgressRef.current = Boolean(routeInitialPage);
    setCurrentPage(nextInitialPage);
    setRestorePage(nextInitialPage);
    setDetectedTotalPages(routeTotalPages);
    setHasOpenedPdf(false);
  }, [bookId, routeInitialPage, routeTotalPages]);

  useEffect(() => {
    if (routeInitialPage || !progress?.currentPage || restoredProgressRef.current) {
      return;
    }

    restoredProgressRef.current = true;
    setCurrentPage(progress.currentPage);
    setRestorePage(progress.currentPage);
  }, [progress?.currentPage, routeInitialPage]);

  const progressPayload = useMemo<ProgressPayload | null>(() => {
    if (!bookId || isProgressLoading) {
      return null;
    }

    if (!routeInitialPage && progress?.currentPage && !restoredProgressRef.current) {
      return null;
    }

    return {
      title,
      cover_image_url: params.cover_image_url ?? undefined,
      currentPage,
      totalPages,
      progressPercent,
    };
  }, [
    bookId,
    currentPage,
    isProgressLoading,
    params.cover_image_url,
    progress?.currentPage,
    progressPercent,
    routeInitialPage,
    title,
    totalPages,
  ]);

  const saveCurrentProgress = useCallback(async () => {
    if (!progressPayload) {
      return;
    }

    await saveProgress(progressPayload);
  }, [progressPayload, saveProgress]);

  useEffect(() => {
    if (!progressPayload) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      void saveCurrentProgress();
    }, SAVE_PROGRESS_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, [progressPayload, saveCurrentProgress]);

  const handleBack = useCallback(() => {
    void saveCurrentProgress();
    navigation.goBack();
  }, [navigation, saveCurrentProgress]);

  const handlePdfLoaded = useCallback((nextTotalPages: number) => {
    setDetectedTotalPages(nextTotalPages);
    setHasOpenedPdf(true);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    hideControls();
  }, [hideControls]);

  const handleSelectReadingMode = useCallback(async (mode: ReadingMode) => {
    setReadingMode(mode);
    setModeNotice(null);
    setModeModalVisible(false);
    showControls();

    if (mode === 'tap') {
      nativePdfHandleRef.current?.setPage(currentPage);
    }

    try {
      await AsyncStorage.setItem(READING_MODE_STORAGE_KEY, mode);
    } catch {
      // Reading mode is a UI preference; the selected mode remains active in memory.
    }
  }, [currentPage, showControls]);

  const goToTapPage = useCallback(
    (direction: -1 | 1) => {
      if (readingMode !== 'tap') {
        return;
      }

      const upperBound = totalPages ?? currentPage + 1;
      const nextPage = Math.max(1, Math.min(currentPage + direction, upperBound));

      if (nextPage === currentPage) {
        showControls();
        return;
      }

      nativePdfHandleRef.current?.setPage(nextPage);
      setCurrentPage(nextPage);
      hideControls();
    },
    [currentPage, hideControls, readingMode, showControls, totalPages]
  );

  const progressText = totalPages ? `Страница ${currentPage} из ${totalPages}` : `Страница ${currentPage}`;
  const topOverlayStyle = {
    opacity: controlsAnimation,
    transform: [
      {
        translateY: controlsAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [-72, 0],
        }),
      },
    ],
  };
  const bottomOverlayStyle = {
    opacity: controlsAnimation,
    transform: [
      {
        translateY: controlsAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [82, 0],
        }),
      },
    ],
  };

  if (!bookId && !params.pdfUrl) {
    return (
      <AppScreen contentContainerStyle={styles.content}>
        <ReaderHeader onBack={handleBack} title={title} />
        <View style={styles.readerState}>
          <Ionicons color={theme.colors.danger} name="alert-circle-outline" size={28} />
          <AppText style={styles.center} variant="title">
            Не удалось открыть книгу
          </AppText>
          <AppText color={theme.colors.textSecondary} style={styles.center}>
            Не указан идентификатор книги.
          </AppText>
        </View>
      </AppScreen>
    );
  }

  if (!pdfUrl) {
    return (
      <AppScreen contentContainerStyle={styles.content}>
        <ReaderHeader onBack={handleBack} title={title} />
        <View style={styles.readerState}>
          <Ionicons color={theme.colors.warning} name="document-outline" size={28} />
          <AppText style={styles.center} variant="title">
            Файл книги недоступен
          </AppText>
          <AppText color={theme.colors.textSecondary} style={styles.center}>
            Для этой книги не найден PDF-файл.
          </AppText>
        </View>
      </AppScreen>
    );
  }

  const resolvedPdfUrl = pdfUrl;

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <View style={styles.viewerShell}>
        {Platform.OS === 'web' ? (
          <WebPdfPagesReader
            bookId={bookId ?? ''}
            initialPage={restorePage}
            onLoaded={handlePdfLoaded}
            onPageChange={handlePageChange}
            onReaderPress={toggleControls}
            onReaderScroll={() => undefined}
            onRetry={() => setRetryKey((value) => value + 1)}
            pdfUrl={resolvedPdfUrl}
            retryKey={retryKey}
          />
        ) : Platform.OS === 'android' || Platform.OS === 'ios' ? (
          <NativePdfReaderShell
            bookId={bookId ?? ''}
            initialPage={restorePage}
            nativePdfRef={nativePdfHandleRef}
            onLoaded={handlePdfLoaded}
            onPageChange={handlePageChange}
            onReaderPress={toggleControls}
            onRetry={() => setRetryKey((value) => value + 1)}
            pdfUrl={resolvedPdfUrl}
            readingMode={readingMode}
            retryKey={retryKey}
          />
        ) : (
          <UnsupportedNativePdfReader onRetry={() => setRetryKey((value) => value + 1)} />
        )}
      </View>

      {Platform.OS !== 'web' && readingMode === 'tap' ? (
        <View pointerEvents="box-none" style={styles.tapZones}>
          <Pressable onPress={() => goToTapPage(-1)} style={[styles.tapZone, styles.tapZoneLeft]} />
          <Pressable onPress={toggleControls} style={[styles.tapZone, styles.tapZoneCenter]} />
          <Pressable onPress={() => goToTapPage(1)} style={[styles.tapZone, styles.tapZoneRight]} />
        </View>
      ) : null}

      <Animated.View
        pointerEvents={controlsVisible ? 'box-none' : 'none'}
        style={[
          styles.topOverlay,
          { paddingTop: Math.max(insets.top, theme.spacing.sm) },
          topOverlayStyle,
        ]}
      >
        <ReaderHeader
          onBack={handleBack}
          onModePress={() => {
            setModeModalVisible(true);
            showControls();
          }}
          readingMode={readingMode}
          title={title}
        />
      </Animated.View>

      <Animated.View
        pointerEvents={controlsVisible ? 'box-none' : 'none'}
        style={[
          styles.bottomOverlay,
          { paddingBottom: Math.max(insets.bottom, theme.spacing.sm) },
          bottomOverlayStyle,
        ]}
      >
        <View style={styles.progressCopy}>
          <AppText color={theme.colors.textSecondary} variant="bodySmall">
            {progressText}
          </AppText>
          <AppText color={theme.colors.textMuted} variant="caption">
            {progressPercent != null ? `${progressPercent}% сохранено` : hasOpenedPdf ? 'Прогресс сохранён' : ''}
          </AppText>
        </View>
        {Platform.OS === 'web' ? (
          <Pressable onPress={() => setRetryKey((value) => value + 1)} style={({ pressed }) => [styles.retryButton, pressed ? styles.pressed : null]}>
            <Ionicons color={theme.colors.primary} name="refresh-outline" size={18} />
          </Pressable>
        ) : null}
      </Animated.View>

      <ReadingModeModal
        modeNotice={modeNotice}
        onClose={() => setModeModalVisible(false)}
        onSelect={handleSelectReadingMode}
        selectedMode={readingMode}
        visible={modeModalVisible}
      />
    </AppScreen>
  );
}

function ReaderHeader({
  onBack,
  onModePress,
  readingMode,
  title,
}: {
  onBack: () => void;
  onModePress?: () => void;
  readingMode?: ReadingMode;
  title: string;
}) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}>
        <Ionicons color={theme.colors.primary} name="chevron-back" size={18} />
        <AppText color={theme.colors.primary} variant="label">
          Назад
        </AppText>
      </Pressable>
      <AppText numberOfLines={1} style={styles.headerTitle} variant="title">
        {title}
      </AppText>
      {onModePress ? (
        <Pressable onPress={onModePress} style={({ pressed }) => [styles.modeButton, pressed ? styles.pressed : null]}>
          <AppText color={theme.colors.textSecondary} variant="caption">
            {readingMode === 'tap' ? 'Тап' : 'Скролл'}
          </AppText>
          <Ionicons color={theme.colors.primary} name="ellipsis-horizontal" size={18} />
        </Pressable>
      ) : null}
    </View>
  );
}

function ReadingModeModal({
  modeNotice,
  onClose,
  onSelect,
  selectedMode,
  visible,
}: {
  modeNotice: string | null;
  onClose: () => void;
  onSelect: (mode: ReadingMode) => void;
  selectedMode: ReadingMode;
  visible: boolean;
}) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const options: Array<{ disabled?: boolean; label: string; mode: ReadingMode }> = [
    { label: 'Скролл', mode: 'scroll' },
    { label: 'Тап по краям', mode: 'tap' },
  ];

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.modalBackdrop}>
        <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modeSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <AppText variant="h2">Режим чтения</AppText>
              <Pressable onPress={onClose} style={({ pressed }) => [styles.sheetCloseButton, pressed ? styles.pressed : null]}>
                <Ionicons color={theme.colors.textPrimary} name="close" size={18} />
              </Pressable>
            </View>

            <View style={styles.modeOptions}>
              {options.map((option) => {
                const active = option.mode === selectedMode && !option.disabled;

                return (
                  <Pressable
                    key={option.mode}
                    onPress={() => onSelect(option.mode)}
                    style={({ pressed }) => [
                      styles.modeOption,
                      active ? styles.modeOptionActive : null,
                      option.disabled ? styles.modeOptionDisabled : null,
                      pressed && !option.disabled ? styles.pressed : null,
                    ]}
                  >
                    <View style={styles.modeOptionCopy}>
                      <AppText color={active ? theme.colors.primary : option.disabled ? theme.colors.textMuted : theme.colors.textPrimary} variant="body">
                        {option.label}
                      </AppText>
                      {option.disabled ? (
                        <AppText color={theme.colors.textMuted} variant="caption">
                          Временно недоступен
                        </AppText>
                      ) : null}
                    </View>
                    {active ? <Ionicons color={theme.colors.primary} name="checkmark" size={18} /> : null}
                  </Pressable>
                );
              })}
            </View>

            {modeNotice ? (
              <AppText color={theme.colors.textMuted} style={styles.center} variant="bodySmall">
                {modeNotice}
              </AppText>
            ) : null}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    content: {
      flex: 1,
      backgroundColor: theme.colors.readerBackground,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    backButton: {
      minHeight: 40,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingRight: theme.spacing.xs,
    },
    headerTitle: {
      flex: 1,
      color: theme.colors.textPrimary,
    },
    modeButton: {
      minHeight: 36,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      backgroundColor: theme.colors.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    viewerShell: {
      flex: 1,
      minHeight: 360,
      overflow: 'hidden',
      backgroundColor: theme.colors.readerBackground,
    },
    nativeReaderWrap: {
      flex: 1,
      backgroundColor: theme.colors.readerBackground,
    },
    nativeReaderWrapTap: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 0,
      paddingBottom: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    nativePdf: {
      flex: 1,
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.readerBackground,
    },
    nativePdfTap: {
      alignSelf: 'stretch',
      backgroundColor: theme.colors.readerBackground,
    },
    tapZones: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: 10,
    },
    tapZone: {
      position: 'absolute',
      top: 0,
      bottom: 0,
    },
    tapZoneCenter: {
      top: '30%',
      bottom: '30%',
      left: '36%',
      right: '36%',
    },
    tapZoneLeft: {
      left: 0,
      width: '22%',
    },
    tapZoneRight: {
      right: 0,
      width: '22%',
    },
    readerState: {
      flex: 1,
      minHeight: 360,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.readerSurface,
    },
    readerOverlay: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.readerSurface,
    },
    readerLoadingOverlay: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.readerSurface,
    },
    loadProgressTrack: {
      width: '72%',
      maxWidth: 320,
      height: 6,
      borderRadius: theme.radius.pill,
      overflow: 'hidden',
      backgroundColor: theme.colors.surfaceMuted,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    loadProgressFill: {
      height: '100%',
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.primary,
    },
    center: {
      textAlign: 'center',
    },
    topOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 20,
      minHeight: 62,
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      justifyContent: 'flex-end',
      backgroundColor: theme.colors.readerSurface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    bottomOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 20,
      minHeight: 68,
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      backgroundColor: theme.colors.readerSurface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderLeftWidth: 0,
      borderRightWidth: 0,
      borderBottomWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    progressCopy: {
      flex: 1,
      gap: 1,
    },
    retryButton: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceMuted,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'flex-end',
    },
    modalSafeArea: {
      justifyContent: 'flex-end',
    },
    modeSheet: {
      borderTopLeftRadius: theme.radius.xl,
      borderTopRightRadius: theme.radius.xl,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.lg,
      backgroundColor: theme.colors.readerSurface,
      borderTopWidth: 1,
      borderColor: theme.colors.border,
      gap: theme.spacing.md,
    },
    sheetHandle: {
      alignSelf: 'center',
      width: 42,
      height: 4,
      borderRadius: theme.radius.pill,
      backgroundColor: theme.colors.border,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sheetCloseButton: {
      width: 36,
      height: 36,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceMuted,
    },
    modeOptions: {
      gap: theme.spacing.xs,
    },
    modeOption: {
      minHeight: 54,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    modeOptionActive: {
      borderColor: theme.colors.primaryBorder,
      backgroundColor: theme.colors.primarySoft,
    },
    modeOptionDisabled: {
      opacity: 0.72,
    },
    modeOptionCopy: {
      flex: 1,
      gap: 2,
    },
    pressed: {
      opacity: 0.78,
    },
  });
}
