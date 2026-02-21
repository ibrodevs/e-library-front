import { useState, useEffect, useMemo } from 'react';
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';
import { FaChevronLeft, FaChevronRight, FaSearchPlus, FaSearchMinus, FaSpinner, FaExpand, FaCompress } from 'react-icons/fa';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Настройка worker для PDF.js v7
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const PDFReader = ({ pdfUrl }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageWidth, setPageWidth] = useState(null);

  // Мемоизируем options для предотвращения ненужных перезагрузок
  const options = useMemo(() => ({}), []);

  useEffect(() => {
    // Блокируем контекстное меню для предотвращения сохранения
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // Блокируем горячие клавиши для сохранения и добавляем навигацию
    const handleKeyDown = (e) => {
      // Ctrl+S или Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        return false;
      }
      // Ctrl+P или Cmd+P
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        return false;
      }
      // Стрелки для навигации
      if (e.key === 'ArrowLeft') {
        previousPage();
      }
      if (e.key === 'ArrowRight') {
        nextPage();
      }
      // + и - для зуммирования
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomIn();
      }
      if (e.key === '-') {
        e.preventDefault();
        zoomOut();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [pageNumber, numPages]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error) => {
    setError('Не удалось загрузить PDF файл');
    setLoading(false);
  };

  const changePage = (offset) => {
    setPageNumber(prevPageNumber => {
      const newPage = prevPageNumber + offset;
      if (newPage < 1) return 1;
      if (newPage > numPages) return numPages;
      return newPage;
    });
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const fitToWidth = () => {
    if (pageWidth) {
      const containerWidth = window.innerWidth - 100;
      setScale(containerWidth / pageWidth);
    }
  };
  const resetZoom = () => setScale(1.2);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-2xl font-bold text-red-400 mb-4">Ошибка загрузки</h3>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Улучшенная панель управления */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Навигация по страницам */}
            <div className="flex items-center gap-3">
              <button
                onClick={previousPage}
                disabled={pageNumber <= 1}
                className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl text-white transition-all duration-200 shadow-lg hover:shadow-blue-500/50 hover:scale-105 disabled:hover:scale-100"
                title="Предыдущая страница (←)"
              >
                <FaChevronLeft className="text-lg" />
              </button>
              
              <div className="flex items-center gap-2 px-5 py-2 bg-gray-700/50 backdrop-blur-sm rounded-xl border border-gray-600">
                <input
                  type="number"
                  min="1"
                  max={numPages || 1}
                  value={pageNumber}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= numPages) {
                      setPageNumber(page);
                    }
                  }}
                  className="w-16 bg-gray-800 text-white text-center rounded-lg px-2 py-1 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-white font-medium">/ {numPages || '...'}</span>
              </div>
              
              <button
                onClick={nextPage}
                disabled={pageNumber >= numPages}
                className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl text-white transition-all duration-200 shadow-lg hover:shadow-blue-500/50 hover:scale-105 disabled:hover:scale-100"
                title="Следующая страница (→)"
              >
                <FaChevronRight className="text-lg" />
              </button>
            </div>

            {/* Управление масштабом */}
            <div className="flex items-center gap-2">
              <button
                onClick={zoomOut}
                disabled={scale <= 0.5}
                className="p-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl text-white transition-all duration-200 shadow-lg hover:shadow-purple-500/50"
                title="Уменьшить (-)"
              >
                <FaSearchMinus />
              </button>
              
              <button
                onClick={resetZoom}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-white min-w-[90px] text-center font-medium transition-all duration-200"
                title="Сбросить масштаб"
              >
                {Math.round(scale * 100)}%
              </button>
              
              <button
                onClick={zoomIn}
                disabled={scale >= 3.0}
                className="p-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl text-white transition-all duration-200 shadow-lg hover:shadow-purple-500/50"
                title="Увеличить (+)"
              >
                <FaSearchPlus />
              </button>

              <button
                onClick={fitToWidth}
                className="p-3 bg-green-600 hover:bg-green-700 rounded-xl text-white transition-all duration-200 shadow-lg hover:shadow-green-500/50 ml-2"
                title="По ширине экрана"
              >
                <FaExpand />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Контейнер для PDF с улучшенным фоном */}
      <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-800 to-gray-900 p-6 pb-12">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FaSpinner className="text-5xl text-blue-400 mb-4 animate-spin mx-auto" />
              <p className="text-white text-xl">Загрузка PDF...</p>
            </div>
          </div>
        )}
        
        <div className="pdf-container max-w-7xl mx-auto flex justify-center mb-8">
          <Document
            file={pdfUrl}
            onLoadSuccess={(pdf) => {
              onDocumentLoadSuccess(pdf);
              // Получаем ширину первой страницы
              pdf.getPage(1).then(page => {
                const viewport = page.getViewport({ scale: 1 });
                setPageWidth(viewport.width);
              });
            }}
            onLoadError={onDocumentLoadError}
            loading={null}
            options={options}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-2xl rounded-lg overflow-hidden border-4 border-gray-700"
            />
          </Document>
        </div>
      </div>

      {/* Защита от копирования - прозрачный оверлей */}
      <style>{`
        .pdf-container {
          position: relative;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        
        .react-pdf__Page {
          position: relative;
        }
        
        .react-pdf__Page__canvas {
          display: block;
          user-select: none;
        }
        
        /* Запрет на выделение текста */
        .react-pdf__Page__textContent {
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
        }
      `}</style>
    </div>
  );
};

export default PDFReader;
