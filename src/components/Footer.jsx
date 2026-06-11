import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaEnvelope, FaMapMarkerAlt, FaPhoneAlt, FaArrowRight } from 'react-icons/fa';
import logo from '../assets/logo2.png';

// Реальные внешние ресурсы (совпадают с навбаром)
const externalLibraries = [
  { key: 'geotar', url: 'https://edu.geotar.ru/guides/' },
  { key: 'bbk', url: 'https://biblioclub.ru/index.php?page=bbk_n&sel_node=3' },
  { key: 'research4life', url: 'https://www.research4life.org' },
  { key: 'ebsco', url: 'https://www.ebsco.com' },
  { key: 'scopus', url: 'https://www.scopus.com/sources' },
];

const LibraryFooter = () => {
  const { t } = useTranslation();

  // Только реальные внутренние маршруты
  const navLinks = [
    { to: '/', label: t('navbar.home') },
    { to: '/catalog', label: t('navbar.catalog') },
    { to: '/contacts', label: t('navbar.contacts') },
    { to: '/profile', label: t('profile.title', 'Профиль') },
  ];

  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Бренд */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700">
                <img src={logo} alt="Salymbekov University" className="h-7 w-7" />
              </span>
              <div className="leading-tight">
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  Salymbekov University
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {t('footer.libraryTitle')}
                </div>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {t('footer.description')}
            </p>

            <ul className="mt-6 space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-brand-600 dark:text-brand-400" />
                Бишкек, Кыргызстан
              </li>
              <li>
                <a
                  href="mailto:library@salymbekov.com"
                  className="flex items-center gap-2 transition-colors hover:text-brand-700 dark:hover:text-brand-300"
                >
                  <FaEnvelope className="text-brand-600 dark:text-brand-400" />
                  library@salymbekov.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+996312880000"
                  className="flex items-center gap-2 transition-colors hover:text-brand-700 dark:hover:text-brand-300"
                >
                  <FaPhoneAlt className="text-brand-600 dark:text-brand-400" />
                  +996 (312) 88-00-00
                </a>
              </li>
            </ul>
          </div>

          {/* Навигация + внешние ресурсы */}
          <div className="grid grid-cols-2 gap-8 lg:col-span-7">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {t('footer.nav.section1.title')}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {navLinks.map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-sm text-slate-500 transition-colors hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {t('navbar.extraLibrary')}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {externalLibraries.map(({ key, url }) => (
                  <li key={key}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300"
                    >
                      {t(`navbar.externalLibraries.${key}`)}
                      <FaArrowRight className="text-[10px] opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Низ */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 dark:border-slate-800 sm:flex-row">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('footer.legal.copyright', { year: new Date().getFullYear() })}
          </p>
          <Link
            to="/contacts"
            className="text-sm text-slate-500 transition-colors hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300"
          >
            {t('footer.legal.contacts')}
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default LibraryFooter;
