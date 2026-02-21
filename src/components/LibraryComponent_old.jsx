import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FaSearch, FaBook, FaFilter, FaBookOpen, FaChevronDown, FaSpinner, FaTimes } from "react-icons/fa";
import { getBooks } from "../api/books";
import { getCategories } from "../api/category";

const LibraryComponent = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hoveredBook, setHoveredBook] = useState(null);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const filterRef = useRef(null);

  // Загрузка данных с бэкенда (Heroku)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Используем готовые API функции которые берут с Heroku
        const booksResponse = await getBooks();
        const categoriesResponse = await getCategories();

        // Извлекаем данные из ответов
        let booksData = booksResponse.data;
        let categoriesData = categoriesResponse.data;

        // Обрабатываем разные форматы API ответов
        const books = Array.isArray(booksData) ? booksData : (booksData.results || booksData.value || booksData);
        const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData.results || categoriesData.value || categoriesData);
        
        setBooks(books);
        setCategories(categories);
      } catch (err) {
        setError(t('library.errors.fetchFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  // Получаем текущую переведенную категорию
  const currentCategoryLabel = useMemo(() => {
    if (selectedCategory === "all") {
      return t("library.categories.all");
    }
    const category = categories.find(cat => cat.id.toString() === selectedCategory);
    return category ? category.name : t("library.categories.all");
  }, [selectedCategory, categories, t]);

  // Фильтрация книг
  const filteredBooks = useMemo(() => {
    const result = books.filter(book => {
      const bookTitle = book.title || '';
      const bookAuthor = book.author || '';
      const bookDescription = book.description || '';
      
      const matchesSearch = bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          bookAuthor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          bookDescription.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesCategory = false;
      
      if (selectedCategory === "all") {
        matchesCategory = true;
      } else {
        // Получаем ID категории книги - это поле category в API
        const bookCategoryId = book.category;
        
        // Сравниваем как строки для единообразия
        matchesCategory = bookCategoryId?.toString() === selectedCategory;
      }
      
      const passes = matchesSearch && matchesCategory;
      
      return passes;
    });

    return result;
  }, [books, searchQuery, selectedCategory]);

  // Анимация появления карточек
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  const handleRead = (pdfUrl) => {
    if (pdfUrl && pdfUrl.startsWith('http')) {
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    } else if (pdfUrl) {
      const HEROKU_BASE = 'https://su-library-back-d2d8d21af2e4.herokuapp.com';
      const fullUrl = `${HEROKU_BASE}${pdfUrl}`;
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('PDF файл недоступен');
    }
  };

  // Закрытие фильтров при клике вне области
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Сбрасываем фильтр при изменении языка
  useEffect(() => {
    setSelectedCategory("all");
  }, [i18n.language]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="text-4xl text-blue-400 mb-4"
          >
            <FaSpinner />
          </motion.div>
          <p className="text-xl text-blue-300">{t('library.loading')}</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-2xl font-bold text-red-400 mb-4">
            {t('library.errors.title')}
          </h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white transition-colors"
          >
            {t('library.actions.retry')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4">
      {/* Анимированный фон */}
      <div className="fixed inset-0 -z-10">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, #1a1a2e 0%, #000 70%)",
              "radial-gradient(circle at 80% 20%, #16213e 0%, #000 70%)",
              "radial-gradient(circle at 40% 80%, #1f1f3d 0%, #000 70%)"
            ]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        
        {/* Анимированный код на фоне */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="text-green-400/20 text-xs font-mono absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
            animate={{
              y: [0, typeof window !== 'undefined' ? window.innerHeight + 100 : 1000],
              opacity: [0, 0.5, 0]
            }}
            transition={{
              duration: 15 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
          >
            {Math.random() > 0.5 ? "010101" : "101010"}
          </motion.div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Заголовок */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
              {t("library.title")}
            </span>
          </h1>
          <p className="text-xl text-blue-300 max-w-2xl mx-auto">
            {t("library.subtitle")}
          </p>
        </div>

        {/* Панель поиска и фильтров */}
        <div className="relative z-50 bg-gray-900/50 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Поиск */}
            <div className="relative flex-1 w-full">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400" />
              <input
                type="text"
                placeholder={t("library.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Улучшенная кнопка фильтров */}
            <div className="relative w-full lg:w-auto" ref={filterRef}>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="w-full lg:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-blue-600/25 border border-blue-400/30 hover:scale-105"
              >
                <FaFilter className="text-white" />
                <span className="font-semibold">{t("library.filters")}</span>
                <span
                  className={`transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : 'rotate-0'}`}
                >
                  <FaChevronDown className="text-white" />
                </span>
              </button>

              {/* Улучшенный выпадающий список фильтров */}
              {isFilterOpen && (
                <div className="absolute top-full right-0 mt-3 w-full lg:w-72 bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-blue-500/30 shadow-2xl shadow-blue-500/20 z-[9999] overflow-hidden animate-fade-in">
                  {/* Заголовок фильтра */}
                  <div className="p-4 border-b border-gray-700/50 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-white text-lg">{t("library.category")}</h3>
                        <p className="text-xs text-blue-300 mt-1">
                          {filteredBooks.length} из {books.length} книг
                        </p>
                      </div>
                      <button
                        onClick={() => setIsFilterOpen(false)}
                        className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <FaTimes className="text-gray-400 hover:text-white" />
                      </button>
                    </div>
                  </div>

                    {/* Список категорий с улучшенным скроллом */}
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {/* Опция "Все" */}
                      <button
                        onClick={() => {
                          setSelectedCategory("all");
                          setIsFilterOpen(false);
                        }}
                        className={`w-full text-left px-4 py-4 border-b border-gray-700/30 transition-all group ${
                          selectedCategory === "all"
                            ? "bg-blue-600/20 text-white border-l-4 border-l-blue-400"
                            : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            selectedCategory === "all" ? "bg-blue-400" : "bg-gray-500 group-hover:bg-blue-400"
                          }`} />
                          <span className="font-medium">{t("library.categories.all")}</span>
                        </div>
                      </button>
                      
                      {/* Категории с бэкенда */}
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedCategory(category.id.toString());
                            setIsFilterOpen(false);
                          }}
                          className={`w-full text-left px-4 py-4 border-b border-gray-700/30 transition-all group ${
                            selectedCategory === category.id.toString()
                              ? "bg-blue-600/20 text-white border-l-4 border-l-blue-400"
                              : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              selectedCategory === category.id.toString() ? "bg-blue-400" : "bg-gray-500 group-hover:bg-blue-400"
                            }`} />
                            <span className="font-medium">{category.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Отображение выбранной категории */}
          {selectedCategory !== "all" && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-blue-600/20 rounded-lg border border-blue-500/30 animate-fade-in">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-blue-300 font-medium">{t("library.chosenCategory")}</span>
                <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full text-sm font-medium shadow-lg shadow-blue-600/25">
                  {currentCategoryLabel}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedCategory("all");
                }}
                className="ml-auto px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg text-sm font-medium transition-all duration-200 border border-red-500/30 hover:border-red-500/50 flex items-center gap-2"
              >
                <FaTimes className="text-xs" />
                <span>{t("library.actionReset")}</span>
              </button>
            </div>
          )}
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-900/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 hover:border-blue-500/50 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <FaBook className="text-blue-400 text-2xl" />
              </div>
              <div>
                <div className="text-3xl font-bold text-white">{books.length}</div>
                <div className="text-blue-300">{t("library.stats.totalBooks")}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 hover:border-green-500/50 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <FaBookOpen className="text-green-400 text-2xl" />
              </div>
              <div>
                <div className="text-3xl font-bold text-white">{filteredBooks.length}</div>
                <div className="text-green-300">{t("library.stats.foundBooks")}</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 hover:border-purple-500/50 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <FaFilter className="text-purple-400 text-2xl" />
              </div>
              <div>
                <div className="text-3xl font-bold text-white">{categories.length}</div>
                <div className="text-purple-300">{t("library.stats.categoriesCount")}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Сетка книг */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="bg-gray-900/30 backdrop-blur-lg rounded-2xl overflow-hidden border border-gray-700 hover:border-blue-500/50 transition-all duration-300 group"
              onMouseEnter={() => setHoveredBook(book.id)}
              onMouseLeave={() => setHoveredBook(null)}
            >
              {/* Обложка книги */}
              <div className="relative h-64 overflow-hidden">
                {book.cover_image_url ? (
                  <img
                    src={book.cover_image_url}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // Скрываем изображение при ошибке и показываем заглушку
                      e.target.style.display = 'none';
                      const placeholder = e.target.parentElement.querySelector('.book-placeholder');
                      if (placeholder) {
                        placeholder.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                
                {/* Заглушка для книг без обложки */}
                <div 
                  className={`book-placeholder w-full h-full bg-gradient-to-br from-blue-600/30 to-purple-600/30 items-center justify-center ${book.cover_image_url ? 'hidden' : 'flex'}`}
                >
                  <div className="text-center">
                    <FaBook className="text-6xl text-blue-400 mb-4 mx-auto opacity-50" />
                    <p className="text-blue-300 text-sm opacity-70">{t("library.noCover")}</p>
                  </div>
                </div>

                {/* Градиентный оверлей */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Категория поверх изображения */}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-blue-500/80 backdrop-blur-sm text-blue-100 rounded-full text-sm font-medium">
                    {book.category_name}
                  </span>
                </div>
                
                {/* Год поверх изображения */}
                <div className="absolute top-4 right-4">
                  <span className="text-yellow-400 text-sm font-semibold bg-yellow-500/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                    {book.year}
                  </span>
                </div>
              </div>

              <div className="p-6">
                {/* Заголовок и автор */}
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors">
                  {book.title}
                </h3>
                <p className="text-blue-300 mb-4 flex items-center gap-2">
                  <FaBook className="text-sm opacity-70" />
                  {book.author}
                </p>

                {/* Описание */}
                <p className="text-gray-300 text-sm mb-6 line-clamp-3 group-hover:text-gray-200 transition-colors">
                  {book.description}
                </p>

                {/* Кнопка чтения */}
                <button
                  onClick={() => handleRead(book.pdf_url || book.pdf_file)}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 font-semibold group transform hover:scale-105"
                >
                  <FaBookOpen className="group-hover:scale-110 transition-transform" />
                  <span>{t("library.actions.read")}</span>
                </button>
              </div>

              {/* Анимированный эффект при наведении */}
              <div
                className={`h-1 bg-gradient-to-r from-cyan-400 to-blue-600 transition-all duration-300 ${
                  hoveredBook === book.id ? 'w-full' : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Сообщение если ничего не найдено */}
        {filteredBooks.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {t("library.noResults.title")}
            </h3>
            <p className="text-gray-400 max-w-md mx-auto">
              {t("library.noResults.description")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryComponent;