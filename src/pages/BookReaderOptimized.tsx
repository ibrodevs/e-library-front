import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Document, Page, pdfjs } from 'react-pdf';
import { FaArrowLeft, FaChevronLeft, FaChevronRight, FaExpand, FaCompress } from 'react-icons/fa';
import { useBook, useBookInitialData, usePrefetchPages } from '../hooks/useBookQueries';
import { PdfLoadingIndicator, CoverSkeleton } from '../components/skeletons/BookSkeleton';
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

  // Получаем начальные данные из кэша для мгновенного отображения
  const initialData = useBookInitialData(Number(bookId));

  // Загружаем полные данные книги
  const { data: book, isLoading, error } = useBook(Number(bookId));

  // Prefetch соседних страниц
  const prefetchSurroundingPages = usePrefetchPages(Number(bookId), currentPage);

  // Prefetch при изменении текущей страницы
  useEffect(() => {
    if (book && totalPages > 0) {
      prefetchSurroundingPages();
    }
  }, [currentPage, totalPages, book, prefetchSurroundingPages]);

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
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, totalPages, isFullscreen]);

  // Показываем мгновенный UI с данными из кэша (если есть)
  const displayBook = book || initialData;

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
    return <PdfLoadingIndicator progress={pdfLoadProgress} />;
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

        {/* Правая часть - полноэкранный режим */}
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors hidden md:block"
        >
          {isFullscreen ? <FaCompress /> : <FaExpand />}
        </button>
      </div>

      {/* Обложка книги (показываем, пока грузится PDF) */}
      {displayBook?.cover_image_url && pdfLoadProgress < 100 && (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-8">
          <div className="max-w-md w-full">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl mb-6">
              <img
                src={displayBook.cover_image_url}
                alt={displayBook.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">{displayBook.title}</h2>
              <p className="text-gray-400 mb-4">{displayBook.author}</p>
              <PdfLoadingIndicator progress={pdfLoadProgress} />
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer */}
      {displayBook?.pdf_file_url && (
        <div className="flex-1 overflow-auto bg-gray-900 flex items-center justify-center p-4">
          <Document
            file={displayBook.pdf_file_url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadProgress={onLoadProgress}
            loading={
              <div className="flex items-center justify-center">
                <PdfLoadingIndicator progress={pdfLoadProgress} />
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
              className="shadow-2xl"
              width={Math.min(window.innerWidth - 32, 1200)}
            />
          </Document>
        </div>
      )}

      {/* Прогресс бар внизу */}
      {totalPages > 0 && (
        <div className="h-1 bg-gray-800">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
            style={{ width: `${(currentPage / totalPages) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default BookReaderOptimized;
