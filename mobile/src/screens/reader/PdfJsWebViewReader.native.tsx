import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { AppButton } from '../../components/common/AppButton';
import { AppText } from '../../components/common/AppText';
import { useAppTheme } from '../../hooks/useAppTheme';
import { tokenStorage } from '../../services/auth/tokenStorage';
import type { AppTheme } from '../../theme';

type ReadingMode = 'scroll' | 'tap';

type PdfJsWebViewReaderProps = {
  bookId: string;
  initialPage: number;
  onError: (message: string) => void;
  onLoaded: (totalPages: number) => void;
  onOpenStandardReader: () => void;
  onPageChange: (page: number) => void;
  onReaderPress: () => void;
  onReaderScroll: () => void;
  onRetry: () => void;
  pdfUrl: string;
  readingMode: ReadingMode;
  retryKey: number;
  targetPage: number;
};

type PdfJsMessage =
  | { type: 'documentLoaded'; totalPages: number; documentLoadedMs: number }
  | { type: 'firstPageRendered'; page: number; firstPageRenderedMs: number }
  | { type: 'pageChanged'; page: number; totalPages: number }
  | { type: 'readerPress' }
  | { type: 'readerScroll' }
  | { type: 'error'; code?: string; message?: string };

const PDF_ACCEPT_HEADER = 'application/pdf,*/*';

function logMobilePdfJs(event: string, payload: Record<string, unknown>) {
  if (__DEV__) {
    console.debug(`[mobile pdfjs] ${event}`, payload);
  }
}

function safeNumber(value: unknown, fallback: number) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? Math.floor(numberValue) : fallback;
}

function buildPdfJsHtml({
  accessToken,
  backgroundColor,
  bookId,
  borderColor,
  initialPage,
  mutedColor,
  pdfUrl,
  primaryColor,
  readingMode,
  surfaceColor,
  textColor,
}: {
  accessToken: string;
  backgroundColor: string;
  bookId: string;
  borderColor: string;
  initialPage: number;
  mutedColor: string;
  pdfUrl: string;
  primaryColor: string;
  readingMode: ReadingMode;
  surfaceColor: string;
  textColor: string;
}) {
  const config = JSON.stringify({
    acceptHeader: PDF_ACCEPT_HEADER,
    accessToken,
    backgroundColor,
    bookId,
    borderColor,
    initialPage,
    mutedColor,
    pdfUrl,
    primaryColor,
    readingMode,
    surfaceColor,
    textColor,
  });

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=3, user-scalable=yes" />
  <style>
    html, body {
      background: ${backgroundColor};
      color: ${textColor};
      height: 100%;
      margin: 0;
      overflow: hidden;
      width: 100%;
      -webkit-tap-highlight-color: transparent;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    #scrollRoot {
      box-sizing: border-box;
      height: 100vh;
      overflow-x: hidden;
      overflow-y: auto;
      padding: 76px 0 96px;
      width: 100vw;
    }
    body.tap #scrollRoot {
      align-items: center;
      display: flex;
      justify-content: center;
      overflow: hidden;
      padding: 74px 8px 92px;
    }
    #pages {
      box-sizing: border-box;
      min-height: 100vh;
      width: 100%;
    }
    body.tap #pages {
      align-items: center;
      display: flex;
      justify-content: center;
      min-height: 0;
      height: 100%;
      width: 100%;
    }
    .page {
      align-items: center;
      box-sizing: border-box;
      display: flex;
      justify-content: center;
      min-height: 72vh;
      padding: 0 6px 10px;
      position: relative;
      width: 100%;
    }
    body.tap .page {
      height: 100%;
      min-height: 0;
      padding: 0;
    }
    .placeholder {
      align-items: center;
      background: ${surfaceColor};
      border: 1px solid ${borderColor};
      border-radius: 6px;
      box-sizing: border-box;
      color: ${mutedColor};
      display: flex;
      font-size: 13px;
      justify-content: center;
      min-height: 68vh;
      width: calc(100vw - 16px);
    }
    body.tap .placeholder {
      min-height: 240px;
      width: 100%;
    }
    canvas {
      background: #fff;
      border-radius: 3px;
      box-shadow: 0 4px 18px rgba(0,0,0,0.35);
      display: block;
      max-height: 100%;
      max-width: 100%;
    }
    #status {
      align-items: center;
      background: ${surfaceColor};
      border: 1px solid ${borderColor};
      border-radius: 14px;
      box-sizing: border-box;
      color: ${textColor};
      display: flex;
      flex-direction: column;
      gap: 10px;
      left: 50%;
      max-width: calc(100vw - 32px);
      min-width: 220px;
      padding: 16px;
      position: fixed;
      text-align: center;
      top: 50%;
      transform: translate(-50%, -50%);
      z-index: 20;
    }
    #status.hidden {
      display: none;
    }
    .spinner {
      animation: spin 0.9s linear infinite;
      border: 3px solid ${borderColor};
      border-top-color: ${primaryColor};
      border-radius: 999px;
      height: 28px;
      width: 28px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="scrollRoot"><div id="pages"></div></div>
  <div id="status"><div class="spinner"></div><div id="statusText">Opening PDF...</div></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script>
    (function () {
      var CONFIG = ${config};
      var startedAt = Date.now();
      var pdfDoc = null;
      var renderedPages = {};
      var renderingPages = {};
      var pageElements = {};
      var observer = null;
      var totalPages = 0;
      var currentPage = Math.max(1, Number(CONFIG.initialPage) || 1);
      var firstPageRendered = false;
      var detectFrame = 0;
      var activeMode = CONFIG.readingMode === 'tap' ? 'tap' : 'scroll';
      var root = document.getElementById('scrollRoot');
      var pagesHost = document.getElementById('pages');
      var status = document.getElementById('status');
      var statusText = document.getElementById('statusText');

      function post(message) {
        try {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          }
        } catch (error) {}
      }

      function showStatus(text) {
        if (!status || !statusText) {
          return;
        }
        statusText.textContent = text;
        status.className = '';
      }

      function hideStatus() {
        if (status) {
          status.className = 'hidden';
        }
      }

      function clearHost() {
        while (pagesHost && pagesHost.firstChild) {
          pagesHost.removeChild(pagesHost.firstChild);
        }
        pageElements = {};
        renderedPages = {};
        renderingPages = {};
        if (observer && observer.disconnect) {
          observer.disconnect();
        }
        observer = null;
      }

      function clampPage(page) {
        var value = Number(page) || 1;
        if (!totalPages) {
          return Math.max(1, Math.floor(value));
        }
        return Math.max(1, Math.min(totalPages, Math.floor(value)));
      }

      function reportPage(page) {
        currentPage = clampPage(page);
        post({ type: 'pageChanged', page: currentPage, totalPages: totalPages || currentPage });
      }

      function setModeClass() {
        document.body.className = activeMode;
      }

      function availableSinglePageSize() {
        return {
          width: Math.max(280, root.clientWidth - 16),
          height: Math.max(320, root.clientHeight - 170)
        };
      }

      async function renderCanvas(pageNumber, fitSinglePage) {
        var page = await pdfDoc.getPage(pageNumber);
        var viewport = page.getViewport({ scale: 1 });
        var maxWidth = Math.max(280, root.clientWidth - 12);
        var scale = maxWidth / viewport.width;

        if (fitSinglePage) {
          var bounds = availableSinglePageSize();
          scale = Math.min(bounds.width / viewport.width, bounds.height / viewport.height);
        }

        var scaledViewport = page.getViewport({ scale: Math.max(0.1, scale) });
        var outputScale = Math.min(window.devicePixelRatio || 1, 2);
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d', { alpha: false });

        if (!context) {
          throw new Error('Canvas is not available');
        }

        canvas.width = Math.floor(scaledViewport.width * outputScale);
        canvas.height = Math.floor(scaledViewport.height * outputScale);
        canvas.style.width = Math.floor(scaledViewport.width) + 'px';
        canvas.style.height = Math.floor(scaledViewport.height) + 'px';
        context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

        await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
        page.cleanup && page.cleanup();
        return { canvas: canvas, height: scaledViewport.height };
      }

      async function renderScrollPage(pageNumber) {
        if (!pdfDoc || activeMode !== 'scroll' || pageNumber < 1 || pageNumber > totalPages || renderedPages[pageNumber] || renderingPages[pageNumber]) {
          return;
        }

        renderingPages[pageNumber] = true;
        try {
          var result = await renderCanvas(pageNumber, false);
          var wrapper = pageElements[pageNumber];
          if (!wrapper || activeMode !== 'scroll') {
            return;
          }

          wrapper.innerHTML = '';
          wrapper.appendChild(result.canvas);
          wrapper.style.minHeight = Math.floor(result.height + 10) + 'px';
          renderedPages[pageNumber] = true;

          if (!firstPageRendered) {
            firstPageRendered = true;
            hideStatus();
            post({ type: 'firstPageRendered', page: pageNumber, firstPageRenderedMs: Date.now() - startedAt });
          }
        } catch (error) {
          post({ type: 'error', code: 'PAGE_RENDER_FAILED', message: error && error.message ? error.message : 'Page render failed' });
        } finally {
          delete renderingPages[pageNumber];
        }
      }

      async function renderSinglePage(pageNumber) {
        if (!pdfDoc || activeMode !== 'tap') {
          return;
        }

        var page = clampPage(pageNumber);
        showStatus('Opening page...');
        clearHost();

        try {
          var wrapper = document.createElement('div');
          wrapper.className = 'page';
          wrapper.setAttribute('data-page', String(page));
          wrapper.innerHTML = '<div class="placeholder">Page ' + page + '</div>';
          pagesHost.appendChild(wrapper);
          pageElements[page] = wrapper;

          var result = await renderCanvas(page, true);
          if (activeMode !== 'tap') {
            return;
          }

          wrapper.innerHTML = '';
          wrapper.appendChild(result.canvas);
          hideStatus();

          if (!firstPageRendered) {
            firstPageRendered = true;
            post({ type: 'firstPageRendered', page: page, firstPageRenderedMs: Date.now() - startedAt });
          }

          reportPage(page);
        } catch (error) {
          post({ type: 'error', code: 'SINGLE_PAGE_RENDER_FAILED', message: error && error.message ? error.message : 'Page render failed' });
        }
      }

      function queueRender(pageNumber) {
        var page = clampPage(pageNumber);
        if (!pdfDoc || activeMode !== 'scroll' || renderedPages[page] || renderingPages[page]) {
          return;
        }
        renderScrollPage(page);
      }

      function createScrollPlaceholders() {
        clearHost();
        setModeClass();
        observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              queueRender(Number(entry.target.getAttribute('data-page')));
            }
          });
        }, { root: root, rootMargin: '1300px 0px', threshold: 0.01 });

        for (var page = 1; page <= totalPages; page += 1) {
          var wrapper = document.createElement('div');
          wrapper.className = 'page';
          wrapper.setAttribute('data-page', String(page));
          wrapper.innerHTML = '<div class="placeholder">Page ' + page + '</div>';
          pagesHost.appendChild(wrapper);
          pageElements[page] = wrapper;
          observer.observe(wrapper);
        }
      }

      function scrollToPage(page) {
        var targetPage = clampPage(page);

        if (activeMode === 'tap') {
          renderSinglePage(targetPage);
          return;
        }

        var element = pageElements[targetPage];
        if (!element) {
          return;
        }
        root.scrollTo({ top: Math.max(0, element.offsetTop - 12), behavior: 'auto' });
        reportPage(targetPage);
        queueRender(targetPage);
        queueRender(targetPage + 1);
        queueRender(targetPage - 1);
      }

      function detectCurrentPage() {
        detectFrame = 0;
        if (!totalPages || activeMode !== 'scroll') {
          return;
        }
        var rootRect = root.getBoundingClientRect();
        var targetY = rootRect.top + Math.min(rootRect.height * 0.35, 220);
        var bestDistance = Infinity;
        var bestPage = currentPage || 1;

        for (var page = 1; page <= totalPages; page += 1) {
          var element = pageElements[page];
          if (!element) {
            continue;
          }
          var rect = element.getBoundingClientRect();
          if (rect.bottom < rootRect.top || rect.top > rootRect.bottom) {
            continue;
          }
          var distance = Math.abs(rect.top - targetY);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestPage = page;
          }
        }

        reportPage(bestPage);
      }

      function scheduleDetectPage() {
        if (activeMode !== 'scroll') {
          return;
        }
        post({ type: 'readerScroll' });
        if (detectFrame) {
          return;
        }
        detectFrame = requestAnimationFrame(detectCurrentPage);
      }

      function nextPage() {
        scrollToPage(currentPage + 1);
      }

      function prevPage() {
        scrollToPage(currentPage - 1);
      }

      function setReadingMode(mode) {
        var nextMode = mode === 'tap' ? 'tap' : 'scroll';
        if (activeMode === nextMode) {
          scrollToPage(currentPage);
          return;
        }

        activeMode = nextMode;
        setModeClass();
        firstPageRendered = false;

        if (activeMode === 'tap') {
          renderSinglePage(currentPage);
          return;
        }

        createScrollPlaceholders();
        setTimeout(function () {
          scrollToPage(currentPage);
        }, 80);
      }

      function handleExternalMessage(event) {
        var payload = null;
        try {
          payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        } catch (error) {
          return;
        }
        if (!payload || !payload.type) {
          return;
        }
        if (payload.type === 'goToPage' || payload.type === 'scrollToPage') {
          scrollToPage(payload.page);
        } else if (payload.type === 'nextPage') {
          nextPage();
        } else if (payload.type === 'prevPage') {
          prevPage();
        } else if (payload.type === 'setReadingMode') {
          setReadingMode(payload.mode);
        }
      }

      async function start() {
        try {
          if (!root || !pagesHost) {
            throw new Error('Reader container is not ready');
          }

          if (!window.pdfjsLib) {
            throw new Error('PDF.js is not loaded');
          }

          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          showStatus('Opening PDF...');
          setModeClass();

          var loadingTask = window.pdfjsLib.getDocument({
            url: CONFIG.pdfUrl,
            httpHeaders: {
              Authorization: 'Bearer ' + CONFIG.accessToken,
              Accept: CONFIG.acceptHeader
            },
            withCredentials: false,
            disableRange: false,
            disableStream: false,
            disableAutoFetch: false,
            rangeChunkSize: 262144,
            useSystemFonts: true
          });

          pdfDoc = await loadingTask.promise;
          totalPages = pdfDoc.numPages;
          currentPage = clampPage(CONFIG.initialPage);
          post({ type: 'documentLoaded', totalPages: totalPages, documentLoadedMs: Date.now() - startedAt });

          if (activeMode === 'tap') {
            renderSinglePage(currentPage);
            return;
          }

          createScrollPlaceholders();
          queueRender(currentPage);
          queueRender(currentPage + 1);
          queueRender(currentPage - 1);
          setTimeout(function () {
            scrollToPage(currentPage);
          }, 80);
        } catch (error) {
          showStatus('Unable to open PDF');
          post({ type: 'error', code: 'DOCUMENT_LOAD_FAILED', message: error && error.message ? error.message : 'Document load failed' });
        }
      }

      window.readerNextPage = nextPage;
      window.readerPrevPage = prevPage;
      window.readerGoToPage = scrollToPage;
      window.readerSetReadingMode = setReadingMode;

      root.addEventListener('scroll', scheduleDetectPage, { passive: true });
      root.addEventListener('click', function () {
        if (activeMode === 'scroll') {
          post({ type: 'readerPress' });
        }
      });
      document.addEventListener('message', handleExternalMessage);
      window.addEventListener('message', handleExternalMessage);
      start();
    })();
  </script>
</body>
</html>`;
}

export function PdfJsWebViewReader({
  bookId,
  initialPage,
  onError,
  onLoaded,
  onOpenStandardReader,
  onPageChange,
  onReaderPress,
  onReaderScroll,
  onRetry,
  pdfUrl,
  readingMode,
  retryKey,
  targetPage,
}: PdfJsWebViewReaderProps) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const webViewRef = useRef<WebView>(null);
  const mountedRef = useRef(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const [htmlKey, setHtmlKey] = useState(0);
  const lastPostedPageRef = useRef(0);
  const lastPostedModeRef = useRef<ReadingMode | null>(null);
  const initialReadingModeRef = useRef(readingMode);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadToken() {
      setIsLoadingToken(true);
      setError(null);
      setAccessToken(null);

      try {
        const token = await tokenStorage.getAccessToken();

        if (!token) {
          throw new Error('Session expired. Sign in again.');
        }

        if (mounted) {
          setAccessToken(token);
          logMobilePdfJs('start', { bookId, endpointType: 'book-file' });
        }
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Unable to read auth token.';

        if (mounted) {
          setError(message);
          onError(message);
        }
      } finally {
        if (mounted) {
          setIsLoadingToken(false);
        }
      }
    }

    void loadToken();

    return () => {
      mounted = false;
    };
  }, [bookId, onError, retryKey]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    setHtmlKey((value) => value + 1);
    lastPostedPageRef.current = 0;
    lastPostedModeRef.current = initialReadingModeRef.current;
  }, [accessToken, pdfUrl, retryKey]);

  useEffect(() => {
    if (!accessToken || lastPostedModeRef.current === readingMode) {
      return;
    }

    lastPostedModeRef.current = readingMode;
    webViewRef.current?.postMessage(JSON.stringify({ type: 'setReadingMode', mode: readingMode }));
  }, [accessToken, readingMode]);

  useEffect(() => {
    if (!accessToken || targetPage < 1 || targetPage === lastPostedPageRef.current) {
      return;
    }

    lastPostedPageRef.current = targetPage;
    webViewRef.current?.postMessage(JSON.stringify({ type: 'goToPage', page: targetPage }));
  }, [accessToken, targetPage]);

  const html = useMemo(() => {
    if (!accessToken) {
      return null;
    }

    return buildPdfJsHtml({
      accessToken,
      backgroundColor: theme.colors.readerBackground,
      bookId,
      borderColor: theme.colors.border,
      initialPage: Math.max(1, initialPage),
      mutedColor: theme.colors.textMuted,
      pdfUrl,
      primaryColor: theme.colors.primary,
      readingMode: initialReadingModeRef.current,
      surfaceColor: theme.colors.readerSurface,
      textColor: theme.colors.textPrimary,
    });
  }, [accessToken, bookId, initialPage, pdfUrl, theme]);

  const setSafeError = useCallback(
    (message: string) => {
      if (!mountedRef.current) {
        return;
      }

      setError(message);
      onError(message);
    },
    [onError]
  );

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let message: PdfJsMessage | null = null;

      try {
        message = JSON.parse(event.nativeEvent.data) as PdfJsMessage;
      } catch {
        return;
      }

      if (!message) {
        return;
      }

      if (message.type === 'documentLoaded') {
        onLoaded(safeNumber(message.totalPages, 1));
        logMobilePdfJs('documentLoadedMs', {
          bookId,
          documentLoadedMs: message.documentLoadedMs,
          totalPages: message.totalPages,
        });
        return;
      }

      if (message.type === 'firstPageRendered') {
        logMobilePdfJs('firstPageRenderedMs', {
          bookId,
          firstPageRenderedMs: message.firstPageRenderedMs,
          page: message.page,
        });
        return;
      }

      if (message.type === 'pageChanged') {
        const page = safeNumber(message.page, 1);
        lastPostedPageRef.current = page;
        logMobilePdfJs('pageChanged', { bookId, page });
        onLoaded(safeNumber(message.totalPages, page));
        onPageChange(page);
        return;
      }

      if (message.type === 'readerScroll') {
        onReaderScroll();
        return;
      }

      if (message.type === 'readerPress') {
        onReaderPress();
        return;
      }

      if (message.type === 'error') {
        const messageText = message.message || 'Unable to open PDF in WebView.';
        logMobilePdfJs('error', {
          bookId,
          code: message.code,
          message: messageText,
        });
        setSafeError(messageText);
      }
    },
    [bookId, onLoaded, onPageChange, onReaderPress, onReaderScroll, setSafeError]
  );

  const retry = useCallback(() => {
    setError(null);
    setHtmlKey((value) => value + 1);
    lastPostedPageRef.current = 0;
    lastPostedModeRef.current = initialReadingModeRef.current;
    onRetry();
  }, [onRetry, readingMode]);

  if (isLoadingToken || !html) {
    return (
      <View style={styles.state}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <AppText color={theme.colors.textSecondary}>Opening book...</AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.state}>
        <Ionicons color={theme.colors.danger} name="alert-circle-outline" size={28} />
        <AppText style={styles.center} variant="title">
          Не удалось открыть книгу
        </AppText>
        <AppText color={theme.colors.textSecondary} style={styles.center}>
          Проверьте интернет или попробуйте ещё раз.
        </AppText>
        <AppButton onPress={retry} title="Retry" variant="secondary" />
        <AppButton onPress={onOpenStandardReader} title="Open with standard reader" />
      </View>
    );
  }

  return (
    <WebView
      key={htmlKey}
      ref={webViewRef}
      allowFileAccess
      allowsInlineMediaPlayback
      allowUniversalAccessFromFileURLs
      domStorageEnabled
      javaScriptEnabled
      mixedContentMode="always"
      onError={(event) => {
        const message = event.nativeEvent.description || 'WebView failed to load.';
        logMobilePdfJs('webview error', { bookId, message });
        setSafeError(message);
      }}
      onHttpError={(event) => {
        const statusCode = event.nativeEvent.statusCode;

        if (statusCode >= 400) {
          const message = `PDF request failed with status ${statusCode}.`;
          logMobilePdfJs('http error', { bookId, statusCode });
          setSafeError(message);
        }
      }}
      onMessage={handleMessage}
      originWhitelist={['*']}
      setSupportMultipleWindows={false}
      source={{ html, baseUrl: 'https://mobile-pdf-reader.local' }}
      style={styles.webView}
    />
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    webView: {
      flex: 1,
      backgroundColor: theme.colors.readerBackground,
    },
    state: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.md,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.readerSurface,
    },
    center: {
      textAlign: 'center',
    },
  });
}
