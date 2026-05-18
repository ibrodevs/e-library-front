import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '../assets/logo2.png';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isAuthenticated, getUserData, logout } from '../utils/auth';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';

export default function HeroNavbar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExtraLibrariesOpen, setIsExtraLibrariesOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const isRTL = i18n.dir() === 'rtl';
  const isAuth = isAuthenticated();
  const userData = getUserData();

  const externalLibraries = [
    {
      key: 'geotar',
      url: 'https://edu.geotar.ru/guides/',
    },
    {
      key: 'bbk',
      url: 'https://biblioclub.ru/index.php?page=bbk_n&sel_node=3',
    },
    {
      key: 'research4life',
      url: 'https://www.research4life.org',
    },
    {
      key: 'studentConsultant',
      url: 'https://www.studentlibrary.ru/cgi-bin/mb4x?usr_data=access(2med,NH6KP3JA9H2NWENS-X061,ISBN9785970474907,1,wyd0smqujaa,ru,ru)',
    },
    {
      key: 'ebsco',
      url: 'https://www.ebsco.com',
    },
    {
      key: 'scopus',
      url: 'https://www.scopus.com/sources',
    },
  ];

  // Прокрутка вверх при изменении маршрута
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsExtraLibrariesOpen(false);
    window.scrollTo(0, 0);
  };

  return (
    <>
      <motion.nav
        className={`fixed w-full z-50 bg-gradient-to-r from-blue-500 to-blue-700 text-white py-4 px-4 md:px-8 flex items-center justify-center gap-8 shadow-xl transition-all duration-300 ${isScrolled ? 'py-3' : 'py-6'
          }`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Логотип слева */}
        <div className="flex items-center absolute left-4 md:left-8">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Logo" className={`h-10 mr-2 md:h-12 md:mr-3 transition-all duration-300 ${isScrolled ? 'h-8 md:h-10' : 'h-10 md:h-12'
              }`} />
          </Link>
        </div>

        {/* Навигационные ссылки (центр) */}
        <div className="hidden md:flex space-x-2 lg:space-x-3">
          <Link
            to="/"
            className="relative text-white text-base lg:text-lg font-medium py-2 px-2 lg:px-3 rounded-lg  transition-all group"
            onClick={() => window.scrollTo(0, 0)}
          >
            <span className="relative z-10 flex items-center">
              {t('navbar.home')}
              <svg className={`w-4 h-4 ${isRTL ? 'mr-2' : 'ml-2'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
            <span className={`absolute bottom-1 ${isRTL ? 'right-3' : 'left-3'} w-0 h-0.5 bg-gradient-to-r from-white to-blue-600 transition-all duration-500 group-hover:w-[calc(100%-1.5rem)]`}></span>
          </Link>

          {/* Каталог - только для авторизованных */}
          {isAuth && (
            <Link
              to="/catalog"
              className="relative text-white text-base lg:text-lg font-medium py-2 px-2 lg:px-3 rounded-lg  transition-all group"
              onClick={() => window.scrollTo(0, 0)}
            >
              <span className="relative z-10 flex items-center">
                {t('navbar.catalog')}
                <svg className={`w-4 h-4 ${isRTL ? 'mr-2' : 'ml-2'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
              <span className={`absolute bottom-1 ${isRTL ? 'right-3' : 'left-3'} w-0 h-0.5 bg-gradient-to-r from-white to-blue-600 transition-all duration-500 group-hover:w-[calc(100%-1.5rem)]`}></span>
            </Link>
          )}

          <div className="relative group">
            <button
              type="button"
              className="relative text-white text-base lg:text-lg font-medium py-2 px-2 lg:px-3 rounded-lg transition-all group"
            >
              <span className="relative z-10 flex items-center">
                {t('navbar.extraLibrary')}
                <svg
                  className={`w-4 h-4 ${isRTL ? 'mr-2' : 'ml-2'} transition-transform duration-300 group-hover:rotate-180`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>

              <span className={`absolute bottom-1 ${isRTL ? 'right-3' : 'left-3'} w-0 h-0.5 bg-gradient-to-r from-white to-blue-600 transition-all duration-500 group-hover:w-[calc(100%-1.5rem)]`}></span>
            </button>

            <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 bg-white text-gray-800 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 z-50 border border-blue-100">
              {externalLibraries.map((library) => (
                <a
                  key={library.key}
                  href={library.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-3 text-sm font-medium hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  {t(`navbar.externalLibraries.${library.key}`)}
                </a>
              ))}
            </div>
          </div>

          <Link
            to="/contacts"
            className="relative text-white text-base lg:text-lg font-medium py-2 px-2 lg:px-3 rounded-lg  transition-all group"
            onClick={() => window.scrollTo(0, 0)}
          >
            <span className="relative z-10 flex items-center">
              {t('navbar.contacts')}
              <svg className={`w-4 h-4 ${isRTL ? 'mr-2' : 'ml-2'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
            <span className={`absolute bottom-1 ${isRTL ? 'right-3' : 'left-3'} w-0 h-0.5 bg-gradient-to-r from-white to-blue-600 transition-all duration-500 group-hover:w-[calc(100%-1.5rem)]`}></span>
          </Link>
        </div>

        {/* Правый блок: Кнопка входа/профиля + Выход + Языки + Бургер */}
        <div className="flex items-center space-x-2 md:space-x-4 absolute right-4 md:right-8">
          {/* Профиль или Вход */}
          {isAuth ? (
            <>
              <Link
                to="/profile"
                className="flex relative text-white text-sm md:text-base lg:text-lg font-medium py-2 px-2 md:px-3 rounded-lg transition-all items-center gap-2 bg-white/10 hover:bg-white/20 whitespace-nowrap"
                onClick={() => window.scrollTo(0, 0)}
              >
                <img
                  src={'https://ui-avatars.com/api/?name=' + encodeURIComponent((userData?.first_name || '') + ' ' + (userData?.last_name || '')) + '&background=3b82f6&color=fff&size=48'}
                  alt="Avatar"
                  className="w-6 h-6 rounded-full border border-white/50"
                />
                <span className="relative z-10 hidden sm:inline">
                  {userData?.first_name || t('profile.personalInfo')}
                </span>
              </Link>

              {/* Кнопка выхода */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="hidden md:flex relative text-white text-sm md:text-base font-medium py-2 px-2 md:px-3 rounded-lg transition-all items-center gap-2 bg-red-500/20 hover:bg-red-500/30 whitespace-nowrap"
                title={t('profile.logout')}
              >
                <FaSignOutAlt className="text-sm" />
                <span className="hidden lg:inline">{t('profile.logout')}</span>
              </motion.button>
            </>
          ) : (
            <Link
              to="/login"
              className="flex relative text-white text-sm md:text-base lg:text-lg font-medium py-2 px-2 md:px-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all whitespace-nowrap"
              onClick={() => window.scrollTo(0, 0)}
            >
              <span className="relative z-10 flex items-center gap-2">
                <FaUser className="text-sm" />
                <span className="hidden sm:inline">{t('login.submit')}</span>
              </span>
            </Link>
          )}

          {/* Выбор языка с флагами */}
          <div className="hidden md:flex space-x-2 lg:space-x-3">
            <motion.button
              onClick={() => changeLanguage('ru')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-1 rounded-full ${i18n.language === 'ru' ? 'ring-2 ring-white' : ''}`}
              title="Русский"
            >
              <img
                src="https://flagcdn.com/w40/ru.png"
                alt="Russian"
                className="w-6 h-5 lg:w-8 lg:h-6 object-cover rounded"
              />
            </motion.button>

            <motion.button
              onClick={() => changeLanguage('kg')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-1 rounded-full ${i18n.language === 'kg' ? 'ring-2 ring-white' : ''}`}
              title="Кыргызча"
            >
              <img
                src="https://flagcdn.com/w40/kg.png"
                alt="Kyrgyz"
                className="w-6 h-5 lg:w-8 lg:h-6 object-cover rounded"
              />
            </motion.button>

            <motion.button
              onClick={() => changeLanguage('en')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-1 rounded-full ${i18n.language === 'en' ? 'ring-2 ring-white' : ''}`}
              title="English"
            >
              <img
                src="https://flagcdn.com/w40/gb.png"
                alt="English"
                className="w-6 h-5 lg:w-8 lg:h-6 object-cover rounded"
              />
            </motion.button>
          </div>

          {/* Бургер-меню (мобильная версия) */}
          <button
            className="md:hidden focus:outline-none"
            onClick={toggleMenu}
          >
            <div className="w-8 flex flex-col space-y-2">
              <motion.span
                animate={{
                  rotate: isMenuOpen ? 45 : 0,
                  y: isMenuOpen ? 8 : 0
                }}
                className="h-1 bg-white rounded-full"
              ></motion.span>
              <motion.span
                animate={{ opacity: isMenuOpen ? 0 : 1 }}
                className="h-1 bg-white rounded-full"
              ></motion.span>
              <motion.span
                animate={{
                  rotate: isMenuOpen ? -45 : 0,
                  y: isMenuOpen ? -8 : 0
                }}
                className="h-1 bg-white rounded-full"
              ></motion.span>
            </div>
          </button>
        </div>
      </motion.nav>

      {/* Мобильное меню (появляется при клике) */}
      <motion.div
        className="md:hidden bg-blue-600 shadow-lg fixed w-full z-40 mt-16"
        initial={{ opacity: 0, height: 0 }}
        animate={{
          opacity: isMenuOpen ? 1 : 0,
          height: isMenuOpen ? 'auto' : 0
        }}
        transition={{ duration: 0.3 }}
        style={{ overflow: 'hidden' }}
      >
        <div className="flex flex-col px-8 py-4 space-y-6">
          <Link
            to="/"
            className="relative text-white text-xl font-medium py-3 px-4 rounded-lg hover:bg-blue-900/30 transition-all group"
            onClick={closeMenu}
          >
            <span className="relative z-10 flex items-center">
              {t('navbar.home')}
              <svg className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
            <span className={`absolute bottom-2 ${isRTL ? 'right-4' : 'left-4'} w-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500 group-hover:w-[calc(100%-2rem)]`}></span>
          </Link>

          {/* Каталог - только для авторизованных */}
          {isAuth && (
            <Link
              to="/catalog"
              className="relative text-white text-xl font-medium py-3 px-4 rounded-lg hover:bg-blue-900/30 transition-all group"
              onClick={closeMenu}
            >
              <span className="relative z-10 flex items-center">
                {t('navbar.catalog')}
                <svg className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
              <span className={`absolute bottom-2 ${isRTL ? 'right-4' : 'left-4'} w-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500 group-hover:w-[calc(100%-2rem)]`}></span>
            </Link>
          )}

          <div className="text-white">
            <button
              type="button"
              className="relative w-full text-left text-white text-xl font-medium py-3 px-4 rounded-lg hover:bg-blue-900/30 transition-all group"
              onClick={() => setIsExtraLibrariesOpen(!isExtraLibrariesOpen)}
            >
              <span className="relative z-10 flex items-center justify-between">
                {t('navbar.extraLibrary')}
                <svg
                  className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'} transition-transform duration-300 ${isExtraLibrariesOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
              <span className={`absolute bottom-2 ${isRTL ? 'right-4' : 'left-4'} w-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500 group-hover:w-[calc(100%-2rem)]`}></span>
            </button>

            {isExtraLibrariesOpen && (
              <div className="mt-2 flex flex-col rounded-lg bg-white/10 py-2">
                {externalLibraries.map((library) => (
                  <a
                    key={library.key}
                    href={library.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mx-2 px-4 py-2 rounded-lg text-base font-medium hover:bg-white/20 transition-all"
                    onClick={closeMenu}
                  >
                    {t(`navbar.externalLibraries.${library.key}`)}
                  </a>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/contacts"
            className="relative text-white text-xl font-medium py-3 px-4 rounded-lg hover:bg-blue-900/30 transition-all group"
            onClick={closeMenu}
          >
            <span className="relative z-10 flex items-center">
              {t('navbar.contacts')}
              <svg className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
            <span className={`absolute bottom-2 ${isRTL ? 'right-4' : 'left-4'} w-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500 group-hover:w-[calc(100%-2rem)]`}></span>
          </Link>

          {/* Профиль или Вход */}
          {isAuth ? (
            <Link
              to="/profile"
              className="relative text-white text-xl font-medium py-3 px-4 rounded-lg bg-white/10 hover:bg-white/20 transition-all flex items-center gap-3"
              onClick={closeMenu}
            >
              <img
                src={'https://ui-avatars.com/api/?name=' + encodeURIComponent((userData?.first_name || '') + ' ' + (userData?.last_name || '')) + '&background=3b82f6&color=fff&size=48'}
                alt="Avatar"
                className="w-8 h-8 rounded-full border border-white/50"
              />
              <span>{userData?.first_name || t('profile.personalInfo')}</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="relative text-white text-xl font-medium py-3 px-4 rounded-lg bg-white/10 hover:bg-white/20 transition-all flex items-center gap-3"
              onClick={closeMenu}
            >
              <FaUser />
              <span>{t('login.submit')}</span>
            </Link>
          )}

          <div className="flex space-x-4 pt-2">
            <button
              onClick={() => {
                changeLanguage('ru');
                setIsMenuOpen(false);
              }}
              className={`p-1 rounded-full ${i18n.language === 'ru' ? 'ring-2 ring-white' : ''}`}
              title="Русский"
            >
              <img
                src="https://flagcdn.com/w40/ru.png"
                alt="Russian"
                className="w-8 h-6 object-cover rounded"
              />
            </button>
            <button
              onClick={() => {
                changeLanguage('kg');
                setIsMenuOpen(false);
              }}
              className={`p-1 rounded-full ${i18n.language === 'kg' ? 'ring-2 ring-white' : ''}`}
              title="Кыргызча"
            >
              <img
                src="https://flagcdn.com/w40/kg.png"
                alt="Kyrgyz"
                className="w-8 h-6 object-cover rounded"
              />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Добавляем отступ для контента, чтобы он не скрывался под фиксированным навбаром */}
      <div className={`pt-24 ${isScrolled ? 'pt-20' : 'pt-24'}`}></div>
    </>
  );
}
