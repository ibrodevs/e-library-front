import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaUser, FaSignOutAlt, FaChevronDown, FaBars, FaTimes } from 'react-icons/fa';
import logo from '../assets/logo2.png';
import { isAuthenticated, getUserData, logout } from '../utils/auth';
import ThemeToggle from './ThemeToggle';

const LANGUAGES = [
  { code: 'ru', label: 'Рус', flag: 'https://flagcdn.com/w40/ru.png' },
  { code: 'kg', label: 'Кырг', flag: 'https://flagcdn.com/w40/kg.png' },
  { code: 'en', label: 'Eng', flag: 'https://flagcdn.com/w40/gb.png' },
];

const EXTERNAL_LIBRARIES = [
  { key: 'geotar', url: 'https://edu.geotar.ru/guides/' },
  { key: 'bbk', url: 'https://biblioclub.ru/index.php?page=bbk_n&sel_node=3' },
  { key: 'research4life', url: 'https://www.research4life.org' },
  {
    key: 'studentConsultant',
    url: 'https://www.studentlibrary.ru/cgi-bin/mb4x?usr_data=access(2med,NH6KP3JA9H2NWENS-X061,ISBN9785970474907,1,wyd0smqujaa,ru,ru)',
  },
  { key: 'ebsco', url: 'https://www.ebsco.com' },
  { key: 'scopus', url: 'https://www.scopus.com/sources' },
];

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExtraOpen, setIsExtraOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isAuth = isAuthenticated();
  const userData = getUserData();

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsMenuOpen(false);
    setIsExtraOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const changeLanguage = (lng) => i18n.changeLanguage(lng);
  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsExtraOpen(false);
  };

  const navLinkClass = ({ isActiveLike }) =>
    `relative px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActiveLike
        ? 'text-brand-700 dark:text-brand-300'
        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
    }`;

  const isActive = (path) => location.pathname === path;

  const NavLink = ({ to, children }) => (
    <Link to={to} className={navLinkClass({ isActiveLike: isActive(to) })}>
      {children}
      {isActive(to) && (
        <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-600 dark:bg-brand-400" />
      )}
    </Link>
  );

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
          isScrolled
            ? 'border-slate-200 bg-white/90 backdrop-blur-md shadow-sm dark:border-slate-800 dark:bg-slate-900/90'
            : 'border-transparent bg-white dark:bg-slate-900'
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
          {/* Логотип + вордмарк */}
          <Link to="/" className="flex items-center gap-3" onClick={closeMenu}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 shadow-sm">
              <img src={logo} alt="Salymbekov University" className="h-7 w-7" />
            </span>
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Salymbekov University
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t('navbar.libraryTagline', 'Электронная библиотека')}
              </span>
            </span>
          </Link>

          {/* Десктоп-навигация */}
          <div className="hidden items-center gap-1 md:flex">
            <NavLink to="/">{t('navbar.home')}</NavLink>
            {isAuth && <NavLink to="/catalog">{t('navbar.catalog')}</NavLink>}

            {/* Внешние библиотеки */}
            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                {t('navbar.extraLibrary')}
                <FaChevronDown className="text-xs transition-transform duration-300 group-hover:rotate-180" />
              </button>
              <div className="invisible absolute left-1/2 top-full w-72 -translate-x-1/2 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  {EXTERNAL_LIBRARIES.map((lib) => (
                    <a
                      key={lib.key}
                      href={lib.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block border-b border-slate-100 px-4 py-2.5 text-sm text-slate-700 transition-colors last:border-b-0 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                    >
                      {t(`navbar.externalLibraries.${lib.key}`)}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <NavLink to="/contacts">{t('navbar.contacts')}</NavLink>
          </div>

          {/* Правый блок */}
          <div className="flex items-center gap-2">
            {/* Языки */}
            <div className="hidden items-center gap-1 md:flex">
              {LANGUAGES.map((lng) => (
                <button
                  key={lng.code}
                  onClick={() => changeLanguage(lng.code)}
                  title={lng.label}
                  className={`overflow-hidden rounded transition ${
                    i18n.language === lng.code
                      ? 'ring-2 ring-brand-600 ring-offset-1 ring-offset-white dark:ring-offset-slate-900'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={lng.flag} alt={lng.label} className="h-5 w-7 object-cover" />
                </button>
              ))}
            </div>

            <span className="hidden h-6 w-px bg-slate-200 dark:bg-slate-700 md:block" />

            <ThemeToggle className="hidden md:inline-flex" />

            {/* Профиль / Вход */}
            {isAuth ? (
              <div className="hidden items-center gap-2 md:flex">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <img
                    src={
                      'https://ui-avatars.com/api/?name=' +
                      encodeURIComponent(
                        (userData?.first_name || '') + ' ' + (userData?.last_name || '')
                      ) +
                      '&background=1d4ed8&color=fff&size=48'
                    }
                    alt="Avatar"
                    className="h-6 w-6 rounded-full"
                  />
                  <span className="max-w-[8rem] truncate">
                    {userData?.first_name || t('profile.personalInfo')}
                  </span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  title={t('profile.logout')}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                >
                  <FaSignOutAlt />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-800 md:inline-flex"
              >
                <FaUser className="text-xs" />
                {t('login.submit')}
              </Link>
            )}

            {/* Бургер */}
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-label="Меню"
            >
              {isMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </nav>

        {/* Мобильное меню */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:hidden"
            >
              <div className="space-y-1 px-4 py-4">
                <Link to="/" onClick={closeMenu} className="block rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                  {t('navbar.home')}
                </Link>
                {isAuth && (
                  <Link to="/catalog" onClick={closeMenu} className="block rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                    {t('navbar.catalog')}
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => setIsExtraOpen((v) => !v)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {t('navbar.extraLibrary')}
                  <FaChevronDown className={`text-sm transition-transform ${isExtraOpen ? 'rotate-180' : ''}`} />
                </button>
                {isExtraOpen && (
                  <div className="ml-3 space-y-1 border-l border-slate-200 pl-3 dark:border-slate-700">
                    {EXTERNAL_LIBRARIES.map((lib) => (
                      <a
                        key={lib.key}
                        href={lib.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={closeMenu}
                        className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                      >
                        {t(`navbar.externalLibraries.${lib.key}`)}
                      </a>
                    ))}
                  </div>
                )}

                <Link to="/contacts" onClick={closeMenu} className="block rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                  {t('navbar.contacts')}
                </Link>

                <div className="my-3 h-px bg-slate-200 dark:bg-slate-800" />

                {isAuth ? (
                  <div className="flex items-center gap-2">
                    <Link to="/profile" onClick={closeMenu} className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">
                      <img
                        src={'https://ui-avatars.com/api/?name=' + encodeURIComponent((userData?.first_name || '') + ' ' + (userData?.last_name || '')) + '&background=1d4ed8&color=fff&size=48'}
                        alt="Avatar"
                        className="h-7 w-7 rounded-full"
                      />
                      {userData?.first_name || t('profile.personalInfo')}
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        closeMenu();
                        navigate('/login');
                      }}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-red-600 dark:border-slate-700 dark:text-red-400"
                    >
                      <FaSignOutAlt />
                    </button>
                  </div>
                ) : (
                  <Link to="/login" onClick={closeMenu} className="flex items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white">
                    <FaUser className="text-xs" />
                    {t('login.submit')}
                  </Link>
                )}

                <div className="flex items-center justify-between pt-3">
                  <div className="flex items-center gap-2">
                    {LANGUAGES.map((lng) => (
                      <button
                        key={lng.code}
                        onClick={() => changeLanguage(lng.code)}
                        className={`overflow-hidden rounded ${
                          i18n.language === lng.code ? 'ring-2 ring-brand-600' : 'opacity-60'
                        }`}
                      >
                        <img src={lng.flag} alt={lng.label} className="h-6 w-8 object-cover" />
                      </button>
                    ))}
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Отступ под фиксированный навбар */}
      <div className="h-16" />
    </>
  );
}
