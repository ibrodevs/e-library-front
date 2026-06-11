import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaTelegram,
  FaFacebook,
  FaInstagram,
} from 'react-icons/fa';

const socials = [
  { icon: <FaTelegram />, name: 'Telegram', url: '#' },
  { icon: <FaFacebook />, name: 'Facebook', url: '#' },
  { icon: <FaInstagram />, name: 'Instagram', url: '#' },
  { icon: <FaEnvelope />, name: 'Email', url: '#' },
];

const ContactsHero = () => {
  const { t } = useTranslation();

  const contacts = [
    { icon: <FaMapMarkerAlt />, value: t('contactsPage.info.addressValue'), label: t('contactsPage.info.addressLabel') },
    { icon: <FaPhone />, value: t('contactsPage.info.phoneValue'), label: t('contactsPage.info.phoneLabel') },
    { icon: <FaEnvelope />, value: t('contactsPage.info.emailValue'), label: t('contactsPage.info.emailLabel') },
    { icon: <FaClock />, value: t('contactsPage.info.hoursValue'), label: t('contactsPage.info.hoursLabel') },
  ];

  return (
    <section className="bg-gradient-to-b from-white to-slate-50 py-16 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            {t('contactsPage.title')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            {t('contactsPage.subtitle')}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {contacts.map(({ icon, value, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-xl text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                {icon}
              </span>
              <div className="mt-4 font-semibold text-slate-900 dark:text-white">{value}</div>
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContactsHero;
