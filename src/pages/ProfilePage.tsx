import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  FaSignOutAlt,
  FaUserGraduate,
  FaEnvelope,
  FaUsers,
  FaGraduationCap,
  FaSpinner,
  FaUser,
  FaLock,
} from 'react-icons/fa';
import ChangePasswordForm from '../components/ChangePasswordForm';
import { logout } from '../utils/auth';
import { getProfileApi, type ProfileResponse } from '../api/authApi';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const data = await getProfileApi();
        setProfile(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || t('profile.errors.fetchFailed'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [t]);

  // Выход из системы
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <FaSpinner className="mx-auto mb-4 animate-spin text-4xl text-brand-600 dark:text-brand-400" />
          <p className="text-slate-600 dark:text-slate-400">{t('profile.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <p className="mb-4 text-lg text-red-500">{error || t('profile.errors.fetchFailed')}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-brand-700"
          >
            {t('profile.retry')}
          </button>
        </div>
      </div>
    );
  }

  const fullName = `${profile.last_name} ${profile.first_name}`.trim();

  const fields = [
    {
      icon: <FaUser />,
      label: t('profile.fields.firstName'),
      value: profile.first_name,
      tint: 'from-brand-50 to-brand-100 text-brand-700 dark:from-brand-950/80 dark:to-brand-900/40 dark:text-brand-300',
    },
    {
      icon: <FaUser />,
      label: t('profile.fields.lastName'),
      value: profile.last_name,
      tint: 'from-brand-50 to-brand-100 text-brand-700 dark:from-brand-950/80 dark:to-brand-900/40 dark:text-brand-300',
    },
    {
      icon: <FaEnvelope />,
      label: 'Email',
      value: profile.email,
      tint: 'from-sky-50 to-sky-100 text-sky-700 dark:from-sky-950/80 dark:to-sky-900/40 dark:text-sky-300',
    },
    {
      icon: <FaUsers />,
      label: t('profile.fields.group'),
      value: profile.group,
      tint: 'from-indigo-50 to-indigo-100 text-indigo-700 dark:from-indigo-950/80 dark:to-indigo-900/40 dark:text-indigo-300',
    },
    {
      icon: <FaGraduationCap />,
      label: t('profile.fields.course'),
      value: profile.course,
      tint: 'from-emerald-50 to-emerald-100 text-emerald-700 dark:from-emerald-950/80 dark:to-emerald-900/40 dark:text-emerald-300',
    },
    {
      icon: <FaLock />,
      label: t('profile.fields.password'),
      value: '••••••••',
      tint: 'from-slate-100 to-slate-200 text-slate-600 dark:from-slate-800 dark:to-slate-700 dark:text-slate-300',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
      {/* ─── Градиентный баннер ─── */}
      <div className="relative h-44 overflow-hidden bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-600 sm:h-52">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <motion.div
          aria-hidden
          className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/15 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <main className="mx-auto -mt-20 max-w-5xl px-4 pb-16 sm:px-6">
        {/* ─── Карточка-шапка профиля ─── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/20 sm:p-8"
        >
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
              <motion.div whileHover={{ scale: 1.04 }} className="relative -mt-16 sm:-mt-20">
                <img
                  src={
                    'https://ui-avatars.com/api/?name=' +
                    encodeURIComponent(fullName) +
                    '&background=1d4ed8&color=fff&size=200'
                  }
                  alt={fullName}
                  className="h-28 w-28 rounded-2xl border-4 border-white object-cover shadow-xl dark:border-slate-900 sm:h-32 sm:w-32"
                />
                <span className="absolute bottom-1.5 right-1.5 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
              </motion.div>

              <div className="text-center sm:pb-1 sm:text-left">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {fullName}
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:border-brand-900 dark:bg-brand-950/50 dark:text-brand-300">
                    <FaUserGraduate className="text-[10px]" />
                    {t('profile.role')}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{profile.email}</span>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 font-medium text-white shadow-lg shadow-red-500/25 transition-all hover:bg-red-600"
            >
              <FaSignOutAlt />
              <span>{t('profile.logout')}</span>
            </motion.button>
          </div>
        </motion.div>

        {/* ─── Личные данные ─── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-10"
        >
          <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
            <FaUserGraduate className="text-brand-600 dark:text-brand-400" />
            {t('profile.personalInfo')}
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((field, i) => (
              <motion.div
                key={field.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.05 }}
                className="group flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${field.tint}`}
                >
                  {field.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {field.label}
                  </p>
                  <p className="truncate text-base font-semibold text-slate-900 dark:text-white">
                    {field.value}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ─── Смена пароля ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mt-10"
        >
          <ChangePasswordForm />
        </motion.div>
      </main>
    </div>
  );
};

export default ProfilePage;
