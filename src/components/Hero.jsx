import { motion, useInView, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch,
  FaArrowRight,
  FaBook,
  FaUserGraduate,
  FaUniversity,
  FaBookOpen,
} from 'react-icons/fa';

/**
 * Анимированный счётчик: плавно «докручивает» число при появлении в зоне видимости.
 * Поддерживает суффикс (например, "1000+").
 */
const CountUp = ({ value }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [display, setDisplay] = useState('0');

  const match = String(value).match(/^(\d+)(.*)$/);
  const target = match ? parseInt(match[1], 10) : 0;
  const suffix = match ? match[2] : String(value);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, target, {
      duration: 1.4,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v).toLocaleString('ru-RU')),
    });
    return () => controls.stop();
  }, [inView, target]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
};

// Декоративные обложки для парящего стека (без внешних картинок — чистые градиенты)
const covers = [
  {
    title: 'Algorithms',
    author: 'Cormen',
    gradient: 'from-blue-600 via-indigo-600 to-violet-700',
    rotate: -8,
    x: -88,
    y: 14,
    z: 0,
    delay: 0,
  },
  {
    title: 'Clean Code',
    author: 'R. Martin',
    gradient: 'from-sky-500 via-blue-600 to-indigo-700',
    rotate: 5,
    x: 70,
    y: -26,
    z: 1,
    delay: 0.6,
  },
  {
    title: 'Physics',
    author: 'Feynman',
    gradient: 'from-cyan-500 via-sky-600 to-blue-700',
    rotate: -2,
    x: -6,
    y: 0,
    z: 2,
    delay: 1.2,
  },
];

const LibraryHero = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const stats = [
    { icon: <FaBook />, value: '1000+', label: t('hero.stats.books') },
    { icon: <FaUserGraduate />, value: '500+', label: t('hero.stats.readers') },
    { icon: <FaUniversity />, value: '2025', label: t('hero.stats.year') },
  ];

  const tags = ['IT', 'Бизнес', 'Медицина', 'История'];

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/catalog?q=${encodeURIComponent(query.trim())}` : '/catalog');
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      {/* ─── Живой фон: дышащие градиентные пятна + сетка ─── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          aria-hidden
          className="absolute -top-40 right-[-10%] h-[34rem] w-[34rem] rounded-full bg-brand-500/20 blur-[120px] dark:bg-brand-500/15"
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="absolute -bottom-48 -left-24 h-[32rem] w-[32rem] rounded-full bg-indigo-500/15 blur-[120px] dark:bg-indigo-600/15"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        />
        <div
          className="absolute inset-0 opacity-[0.5] dark:opacity-[0.18]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(100,116,139,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(100,116,139,0.10) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
            maskImage: 'radial-gradient(ellipse 90% 70% at 30% 0%, #000 35%, transparent 100%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 90% 70% at 30% 0%, #000 35%, transparent 100%)',
          }}
        />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
        {/* ─── Левая колонка: контент ─── */}
        <div className="text-center lg:text-left">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-brand-200/80 bg-brand-50/80 px-4 py-1.5 text-sm font-medium text-brand-700 backdrop-blur-sm dark:border-brand-900 dark:bg-brand-950/50 dark:text-brand-300"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
            </span>
            {t('hero.badge')} · Salymbekov University
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl"
          >
            <span className="bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-600 bg-clip-text text-transparent dark:from-brand-300 dark:via-brand-400 dark:to-indigo-400">
              {t('hero.title')}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300 lg:mx-0"
          >
            {t('hero.subtitle')}
          </motion.p>

          {/* Поиск */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
            className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 p-2 shadow-lg shadow-slate-900/5 backdrop-blur-md transition focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-200/60 dark:border-slate-700/70 dark:bg-slate-800/70 dark:shadow-black/20 dark:focus-within:ring-brand-900/40 lg:mx-0"
          >
            <FaSearch className="ml-2 shrink-0 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('library.searchPlaceholder')}
              className="w-full bg-transparent px-2 py-2 text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white"
            />
            <button
              type="submit"
              className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition-all hover:shadow-lg hover:shadow-brand-600/30 active:scale-[0.98]"
            >
              {t('hero.startReading')}
              <FaArrowRight className="text-xs transition-transform group-hover:translate-x-0.5" />
            </button>
          </motion.form>

          {/* Популярные теги + кнопка каталога */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24 }}
            className="mt-5 flex flex-wrap items-center justify-center gap-2 lg:justify-start"
          >
            <span className="text-sm text-slate-400 dark:text-slate-500">
              {t('hero.popularLabel')}:
            </span>
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => navigate(`/catalog?q=${encodeURIComponent(tag)}`)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:text-brand-300"
              >
                {tag}
              </button>
            ))}
            <button
              onClick={() => navigate('/catalog')}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold text-brand-700 transition hover:gap-2.5 dark:text-brand-300"
            >
              {t('hero.catalog')}
              <FaArrowRight className="text-xs" />
            </button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.32 }}
            className="mt-6 text-sm text-slate-400 dark:text-slate-500"
          >
            {t('hero.trust')}
          </motion.p>
        </div>

        {/* ─── Правая колонка: парящий стек обложек ─── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative mx-auto hidden h-[26rem] w-full max-w-md lg:block"
          style={{ perspective: '1200px' }}
        >
          {/* Подсветка под стеком */}
          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/25 blur-[90px] dark:bg-brand-500/20" />

          {covers.map((c) => (
            <motion.div
              key={c.title}
              className="absolute left-1/2 top-1/2"
              style={{ zIndex: c.z }}
              initial={{ x: c.x, y: c.y, rotate: c.rotate }}
              animate={{ y: [c.y, c.y - 16, c.y] }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: c.delay,
              }}
            >
              <div
                className={`relative -ml-[5.5rem] -mt-[7.5rem] flex h-60 w-44 flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${c.gradient} p-5 text-white shadow-2xl shadow-slate-900/30 ring-1 ring-white/20`}
                style={{ transform: `rotate(${c.rotate}deg)` }}
              >
                {/* Корешок книги */}
                <div className="absolute inset-y-0 left-0 w-3 bg-black/20" />
                {/* Глянец */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/25" />
                <FaBookOpen className="relative text-2xl opacity-90" />
                <div className="relative">
                  <div className="text-lg font-bold leading-tight">{c.title}</div>
                  <div className="mt-1 text-xs font-medium text-white/70">{c.author}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ─── Статистика: широкая лента под hero ─── */}
      <div className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="grid grid-cols-1 divide-y divide-slate-200/70 overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 shadow-xl shadow-slate-900/5 backdrop-blur-md dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-black/20 sm:grid-cols-3 sm:divide-x sm:divide-y-0"
        >
          {stats.map(({ icon, value, label }) => (
            <div key={label} className="flex items-center gap-4 p-6 sm:p-7">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-lg text-brand-700 dark:from-brand-950/80 dark:to-brand-900/40 dark:text-brand-300">
                {icon}
              </span>
              <div>
                <div className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  <CountUp value={value} />
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default LibraryHero;
