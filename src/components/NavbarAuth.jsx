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
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const isRTL = i18n.dir() === 'rtl';
  const isAuth = isAuthenticated();
  const userData = getUserData();

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
    window.scrollTo(0, 0);
  };

  return (
    <>
      <motion.nav 
        className={`fixed w-full z-50 bg-gradient-to-r from-blue-500 to-blue-700 text-white py-4 px-4 md:px-8 flex items-center justify-center gap-8 shadow-xl transition-all duration-300 ${
          isScrolled ? 'py-3' : 'py-6'
        }`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Логотип слева */}
        <div className="flex items-center absolute left-4 md:left-8">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Logo" className={`h-10 mr-2 md:h-12 md:mr-3 transition-all duration-300 ${
              isScrolled ? 'h-8 md:h-10' : 'h-10 md:h-12'
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
                  src={userData?.avatar || 'https://ui-avatars.com/api/?name=User'}
                  alt="Avatar"
                  className="w-6 h-6 rounded-full border border-white/50"
                />
                <span className="relative z-10 hidden sm:inline">
                  {userData?.firstName || 'Профиль'}
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
                <span className="hidden sm:inline">Войти</span>
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
                src={userData?.avatar || 'https://ui-avatars.com/api/?name=User'}
                alt="Avatar"
                className="w-8 h-8 rounded-full border border-white/50"
              />
              <span>{userData?.firstName || 'Профиль'}</span>
            </Link>
          ) : (
            <Link 
              to="/login" 
              className="relative text-white text-xl font-medium py-3 px-4 rounded-lg bg-white/10 hover:bg-white/20 transition-all flex items-center gap-3"
              onClick={closeMenu}
            >
              <FaUser />
              <span>Войти</span>
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
