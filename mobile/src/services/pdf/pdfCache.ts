import { Platform } from 'react-native';

export type PdfCacheResult = {
  cacheHit: boolean;
  fileSize?: number;
  path: string;
  uri: string;
};

export type PdfDownloadProgress = {
  percent: number | null;
  received: number;
  total: number | null;
};

export type PdfDownloadTask = {
  cancel: () => void;
  promise: Promise<PdfCacheResult>;
};

const PDF_CACHE_DIR_NAME = 'books';

function getBlobUtil(): any {
  // Native-only dependency. Keep it out of the web execution path.
  const moduleName = 'react-native' + '-blob-util';
  const nativeRequire = eval('require') as any;
  const blobUtilModule = nativeRequire(moduleName);
  return blobUtilModule.default ?? blobUtilModule;
}

function sanitizeBookId(bookId: number | string): string {
  return String(bookId).replace(/[^a-zA-Z0-9_-]/g, '_');
}

function normalizeFileUri(path: string): string {
  return path.startsWith('file://') ? path : `file://${path}`;
}

function getBookCachePath(blobUtil: any, bookId: number | string): string {
  return `${blobUtil.fs.dirs.CacheDir}/${PDF_CACHE_DIR_NAME}/book-${sanitizeBookId(bookId)}.pdf`;
}

async function ensureCacheDirectory(blobUtil: any): Promise<string> {
  const directory = `${blobUtil.fs.dirs.CacheDir}/${PDF_CACHE_DIR_NAME}`;
  const exists = await blobUtil.fs.exists(directory);

  if (!exists) {
    await blobUtil.fs.mkdir(directory);
  }

  return directory;
}

async function getFileSize(blobUtil: any, path: string): Promise<number | undefined> {
  try {
    const stat = await blobUtil.fs.stat(path);
    const size = Number(stat?.size);
    return Number.isFinite(size) && size > 0 ? size : undefined;
  } catch {
    return undefined;
  }
}

export async function getCachedPdf(bookId: number | string): Promise<PdfCacheResult | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  const blobUtil = getBlobUtil();
  const path = getBookCachePath(blobUtil, bookId);
  const exists = await blobUtil.fs.exists(path);

  if (!exists) {
    return null;
  }

  const fileSize = await getFileSize(blobUtil, path);

  if (!fileSize) {
    await blobUtil.fs.unlink(path).catch(() => undefined);
    return null;
  }

  return {
    cacheHit: true,
    fileSize,
    path,
    uri: normalizeFileUri(path),
  };
}

export async function getCachedPdfPath(bookId: number | string): Promise<string | null> {
  const cached = await getCachedPdf(bookId);
  return cached?.uri ?? null;
}

export function downloadPdfToCache({
  accessToken,
  bookId,
  onProgress,
  pdfUrl,
}: {
  accessToken: string;
  bookId: number | string;
  onProgress?: (progress: PdfDownloadProgress) => void;
  pdfUrl: string;
}): PdfDownloadTask {
  if (Platform.OS === 'web') {
    return {
      cancel: () => undefined,
      promise: Promise.reject(new Error('PDF cache is available only on native platforms.')),
    };
  }

  const blobUtil = getBlobUtil();
  let cancelled = false;
  let task: any = null;

  const promise = (async () => {
    await ensureCacheDirectory(blobUtil);

    const cached = await getCachedPdf(bookId);

    if (cached) {
      onProgress?.({
        percent: 100,
        received: cached.fileSize ?? 0,
        total: cached.fileSize ?? null,
      });
      return cached;
    }

    const path = getBookCachePath(blobUtil, bookId);
    const tempPath = `${path}.download`;

    await blobUtil.fs.unlink(tempPath).catch(() => undefined);

    const startedAt = Date.now();

    if (__DEV__) {
      console.debug('[reader pdf download start]', {
        bookId,
        cachePath: path,
      });
    }

    task = blobUtil
      .config({
        fileCache: true,
        path: tempPath,
      })
      .fetch('GET', pdfUrl, {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/pdf,*/*',
      })
      .progress({ interval: 250 }, (received: number, total: number) => {
        const normalizedReceived = Number(received) || 0;
        const normalizedTotal = Number(total) || 0;

        onProgress?.({
          percent: normalizedTotal > 0 ? Math.round((normalizedReceived / normalizedTotal) * 100) : null,
          received: normalizedReceived,
          total: normalizedTotal > 0 ? normalizedTotal : null,
        });
      });

    const response = await task;

    if (cancelled) {
      await blobUtil.fs.unlink(tempPath).catch(() => undefined);
      throw new Error('Загрузка книги отменена.');
    }

    const status = Number(response?.info?.()?.status);

    if (Number.isFinite(status) && status >= 400) {
      await blobUtil.fs.unlink(tempPath).catch(() => undefined);
      throw new Error(`PDF_DOWNLOAD_STATUS_${status}`);
    }

    const fileSize = await getFileSize(blobUtil, tempPath);

    if (!fileSize) {
      await blobUtil.fs.unlink(tempPath).catch(() => undefined);
      throw new Error('PDF_CACHE_INVALID');
    }

    await blobUtil.fs.unlink(path).catch(() => undefined);
    await blobUtil.fs.mv(tempPath, path);

    if (__DEV__) {
      console.debug('[reader pdf download finished]', {
        bookId,
        fileSize,
        durationMs: Date.now() - startedAt,
        cacheHit: false,
      });
    }

    return {
      cacheHit: false,
      fileSize,
      path,
      uri: normalizeFileUri(path),
    };
  })();

  return {
    cancel: () => {
      cancelled = true;
      task?.cancel?.();
    },
    promise,
  };
}

export async function downloadPdfToCacheInBackground({
  accessToken,
  bookId,
  onProgress,
  pdfUrl,
}: {
  accessToken: string;
  bookId: number | string;
  onProgress?: (progress: PdfDownloadProgress) => void;
  pdfUrl: string;
}): Promise<void> {
  const task = downloadPdfToCache({
    accessToken,
    bookId,
    onProgress,
    pdfUrl,
  });

  await task.promise;
}

export async function removeCachedPdf(bookId: number | string): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  const blobUtil = getBlobUtil();
  const path = getBookCachePath(blobUtil, bookId);

  await blobUtil.fs.unlink(path).catch(() => undefined);
  await blobUtil.fs.unlink(`${path}.download`).catch(() => undefined);
}

export const deleteCachedPdf = removeCachedPdf;

export async function clearPdfCache(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  const blobUtil = getBlobUtil();
  const directory = `${blobUtil.fs.dirs.CacheDir}/${PDF_CACHE_DIR_NAME}`;

  await blobUtil.fs.unlink(directory).catch(() => undefined);
}
