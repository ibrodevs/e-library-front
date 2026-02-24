import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Document, Page, pdfjs } from 'react-pdf';
import { FaArrowLeft, FaChevronLeft, FaChevronRight, FaExpand, FaCompress, FaSearchPlus, FaSearchMinus, FaSearch, FaTimes } from 'react-icons/fa';
import { useBook, usePrefetchPages } from '../hooks/useBookQueries';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Настройка PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

const BookReaderOptimized: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfLoadProgress, setPdfLoadProgress] = useState(0);
  const [scale, setScale] = useState(1.0);

  // === Поиск ===
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ page: number; context: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightText, setHighlightText] = useState('');
  const [activeResultIndex, setActiveResultIndex] = useState<number>(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  // Загружаем полные данные книги
  const { data: book, isLoading, error } = useBook(Number(bookId));

  // Prefetch для оптимизации (отключен в текущей реализации)
  usePrefetchPages();

  // Поиск по тексту всех страниц PDF
  const searchInPDF = useCallback(async (query: string) => {
    if (!query.trim() || !book?.pdf_file_url) return;
    setIsSearching(true);
    setSearchResults([]);
    setActiveResultIndex(-1);
    try {
      const loadingTask = pdfjs.getDocument(book.pdf_file_url);
      const pdf = await loadingTask.promise;
      const results: Array<{ page: number; context: string }> = [];
      const lowerQuery = query.toLowerCase();

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = (textContent.items as any[]).map((item) => item.str).join(' ');
        const lowerText = pageText.toLowerCase();

        let idx = 0;
        while ((idx = lowerText.indexOf(lowerQuery, idx)) !== -1) {
          const start = Math.max(0, idx - 60);
          const end = Math.min(pageText.length, idx + lowerQuery.length + 60);
          const context =
            (start > 0 ? '…' : '') +
            pageText.slice(start, end) +
            (end < pageText.length ? '…' : '');
          results.push({ page: i, context });
          idx += lowerQuery.length;
          if (results.filter(r => r.page === i).length >= 3) break; // макс 3 совпадения на стр
        }
      }

      setSearchResults(results);
      setHighlightText(query);
    } catch (e) {
      console.error('Ошибка поиска:', e);
    } finally {
      setIsSearching(false);
    }
  }, [book?.pdf_file_url]);

  // Переход к результату
  const goToResult = (result: { page: number }, index: number) => {
    setCurrentPage(result.page);
    setActiveResultIndex(index);
  };

  // Рендерер текстового слоя — подсвечивает совпадения
  const customTextRenderer = useCallback(
    ({ str }: { str: string }) => {
      if (!highlightText) return str;
      const escaped = highlightText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      return str.replace(
        regex,
        '<mark style="background:#FBBF24;color:#000;border-radius:2px;padding:0 1px">$1</mark>'
      );
    },
    [highlightText]
  );

  // Открыть/закрыть панель поиска
  const toggleSearch = () => {
    setShowSearch(prev => {
      if (!prev) setTimeout(() => searchInputRef.current?.focus(), 50);
      else { setHighlightText(''); setSearchResults([]); setSearchQuery(''); }
      return !prev;
    });
  };

  // Обработка успешной загрузки PDF документа
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setTotalPages(numPages);
    setPdfLoadProgress(100);
  };

  // Обработка прогресса загрузки PDF
  const onLoadProgress = ({ loaded, total }: { loaded: number; total: number }) => {
    const progress = (loaded / total) * 100;
    setPdfLoadProgress(Math.round(progress));
  };

  // Навигация по страницам
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  // Полноэкранный режим
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  // Клавиатурная навигация
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPreviousPage();
      if (e.key === 'ArrowRight') goToNextPage();
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      if (e.key === 'Escape' && isFullscreen) toggleFullscreen();
      if (e.key === 'Escape' && showSearch) toggleSearch();
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); toggleSearch(); }
      if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomIn(); }
      if (e.key === '-') { e.preventDefault(); zoomOut(); }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
}, [currentPage, totalPages, isFullscreen, scale, showSearch]);

  // Показываем мгновенный UI с данными книги
  const displayBook = book;

  // Ошибка загрузки
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-2xl font-bold text-red-400 mb-4">Ошибка загрузки книги</h3>
          <p className="text-gray-400 mb-6">
            {error instanceof Error ? error.message : 'Не удалось загрузить книгу'}
          </p>
          <button
            onClick={() => navigate('/catalog')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
          >
            Вернуться к каталогу
          </button>
        </div>
      </div>
    );
  }

  // Лоадинг экран (только если нет initial data)
  if (isLoading && !displayBook) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-white">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Загрузка книги...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Шапка ридера */}
      <div className="bg-gray-900/95 backdrop-blur-lg border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        {/* Левая часть - навигация назад */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/catalog')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FaArrowLeft />
            <span className="hidden md:inline">{t('reader.back')}</span>
          </button>

          {/* Информация о книге */}
          <div className="hidden md:block">
            <h1 className="text-lg font-bold text-white line-clamp-1">
              {displayBook?.title || 'Загрузка...'}
            </h1>
            <p className="text-sm text-gray-400">{displayBook?.author || ''}</p>
          </div>
        </div>

        {/* Центр - навигация по страницам */}
        <div className="flex items-center gap-4">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FaChevronLeft />
          </button>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={totalPages || 1}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= totalPages) {
                  setCurrentPage(page);
                }
              }}
              className="w-16 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-center text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-400">/ {totalPages || '...'}</span>
          </div>

          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FaChevronRight />
          </button>
        </div>

        {/* Правая часть - поиск + зум + полноэкранный режим */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSearch}
            className={`p-2 rounded-lg transition-colors ${showSearch ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
            title="Поиск по книге (Ctrl+F)"
          >
            <FaSearch />
          </button>
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Уменьшить (−)"
          >
            <FaSearchMinus />
          </button>
          <span className="text-sm text-gray-400 w-12 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={zoomIn}
            disabled={scale >= 3.0}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Увеличить (+)"
          >
            <FaSearchPlus />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors hidden md:block"
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
        </div>
      </div>

      {/* Панель поиска */}
      {showSearch && (
        <div className="bg-gray-800 border-b border-gray-700 flex flex-col" style={{ maxHeight: '360px' }}>
          {/* Строка ввода */}
          <div className="flex items-center gap-2 px-4 py-3">
            <div className="flex-1 flex items-center gap-2 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 focus-within:border-blue-500 transition-colors">
              <FaSearch className="text-gray-400 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Введите слово для поиска..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') searchInPDF(searchQuery); }}
                className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSearchResults([]); setHighlightText(''); }} className="text-gray-500 hover:text-white">
                  <FaTimes size={12} />
                </button>
              )}
            </div>
            <button
              onClick={() => searchInPDF(searchQuery)}
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm text-white transition-colors whitespace-nowrap"
            >
              {isSearching ? 'Поиск...' : 'Найти'}
            </button>
            <button onClick={toggleSearch} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-400 hover:text-white transition-colors">
              <FaTimes />
            </button>
          </div>

          {/* Результаты */}
          {searchResults.length > 0 && (
            <div className="overflow-y-auto px-4 pb-3" style={{ maxHeight: '260px' }}>
              <p className="text-xs text-gray-400 mb-2">
                Найдено совпадений: <span className="text-blue-400 font-semibold">{searchResults.length}</span>
              </p>
              <div className="flex flex-col gap-1">
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToResult(result, idx)}
                    className={`text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      activeResultIndex === idx
                        ? 'bg-blue-600/40 border border-blue-500'
                        : 'bg-gray-900/60 hover:bg-gray-700 border border-transparent'
                    }`}
                  >
                    <span className="text-blue-400 font-semibold mr-2">Стр. {result.page}</span>
                    <span className="text-gray-300">{result.context}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isSearching && searchResults.length === 0 && highlightText && (
            <p className="px-4 pb-3 text-sm text-gray-500">Ничего не найдено по запросу «{highlightText}»</p>
          )}
        </div>
      )}

      {/* Основная область: PDF */}
      <div className="flex-1 overflow-auto bg-gray-900 relative flex items-center justify-center p-4">
        {/* PDF Viewer */}
        {displayBook?.pdf_file_url ? (
          <Document
            file={displayBook.pdf_file_url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadProgress={onLoadProgress}
            loading={
              <div className="flex flex-col items-center justify-center gap-4 text-white py-20">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
                <p className="text-gray-400 text-sm">
                  {pdfLoadProgress > 0 ? `Загрузка... ${pdfLoadProgress}%` : 'Загрузка книги...'}
                </p>
              </div>
            }
            error={
              <div className="text-center text-red-400">
                <p className="mb-4">Ошибка загрузки PDF</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Попробовать снова
                </button>
              </div>
            }
            className="flex justify-center"
          >
            <Page
              pageNumber={currentPage}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              customTextRenderer={customTextRenderer}
              className="shadow-2xl"
              width={Math.min(window.innerWidth - 32, 1200) * scale}
            />
          </Document>
        ) : (
          !isLoading && (
            <div className="text-center text-gray-400">
              <p className="text-lg mb-2">PDF-файл недоступен для этой книги</p>
              <button
                onClick={() => navigate('/catalog')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
              >
                Вернуться к каталогу
              </button>
            </div>
          )
        )}
      </div>

      {/* Прогресс бар внизу */}
      {totalPages > 0 && (
        <div className="h-1 bg-gray-800">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
            style={{ width: `${(currentPage / totalPages) * 100}%` }}
          />
        </div>
      )}

      {/* Футер с защитой авторских прав */}
      <div className="bg-gray-950/80 backdrop-blur-sm border-t border-gray-800 py-3 px-6 select-none">
        <p className="text-center text-gray-600 text-xs leading-relaxed">
          {t('reader.copyright')}
        </p>
      </div>
    </div>
  );
};

export default BookReaderOptimized;
