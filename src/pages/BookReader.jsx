import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaArrowLeft, FaSpinner, FaBook } from 'react-icons/fa';
import PDFReader from '../components/PDFReader';
import { getBooks } from '../api/books';

const BookReader = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Получаем книги с Heroku
        const response = await getBooks();
        const booksData = response.data;
        const books = Array.isArray(booksData) ? booksData : (booksData.results || booksData.value || booksData);
        
        // Находим книгу по ID
        const foundBook = books.find(b => b.id.toString() === bookId);
        
        if (!foundBook) {
          throw new Error('Book not found');
        }
        
        setBook(foundBook);
      } catch (err) {
        console.error('Error fetching book:', err);
        setError(err.message === 'Book not found' ? t('reader.errors.notFound') : t('reader.errors.fetchFailed'));
      } finally {
        setLoading(false);
      }
    };

    if (bookId) {
      fetchBook();
    }
  }, [bookId, t]);

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="text-4xl text-blue-400 mb-4 animate-spin mx-auto" />
          <p className="text-xl text-blue-300">{t('reader.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-2xl font-bold text-red-400 mb-4">
            {t('reader.errors.title')}
          </h3>
          <p className="text-gray-400 mb-6">
            {error || t('reader.errors.notFound')}
          </p>
          <button
            onClick={handleGoBack}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white transition-colors flex items-center gap-2 mx-auto"
          >
            <FaArrowLeft />
            {t('reader.actions.goBack')}
          </button>
        </div>
      </div>
    );
  }

  const pdfUrl = book.pdf_url || book.pdf_file;
  const HEROKU_BASE = 'https://su-library-back-d2d8d21af2e4.herokuapp.com';
  const fullPdfUrl = pdfUrl?.startsWith('http') 
    ? pdfUrl 
    : `${HEROKU_BASE}${pdfUrl}`;

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Заголовок с информацией о книге */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoBack}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors flex items-center gap-2"
              title={t('reader.actions.goBack')}
            >
              <FaArrowLeft />
              <span className="hidden md:inline">{t('reader.actions.goBack')}</span>
            </button>
            
            <div className="flex items-center gap-3">
              <FaBook className="text-blue-400 text-xl" />
              <div>
                <h1 className="text-white font-bold text-lg line-clamp-1">
                  {book.title}
                </h1>
                <p className="text-gray-400 text-sm">
                  {book.author} • {book.year}
                </p>
              </div>
            </div>
          </div>
          
          {book.category_name && (
            <div className="hidden md:block">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                {book.category_name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* PDF Reader */}
      <div className="flex-1 overflow-hidden">
        <PDFReader pdfUrl={fullPdfUrl} />
      </div>

      {/* Предупреждение о защите */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2">
        <p className="text-center text-gray-400 text-sm">
          {t('reader.copyright')}
        </p>
      </div>
    </div>
  );
};

export default BookReader;
