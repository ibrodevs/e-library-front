import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FaPaperPlane, FaUser, FaEnvelope, FaComment, FaArrowRight, FaMapMarkerAlt, FaPhone, FaClock } from "react-icons/fa";

const ContactSection = () => {
  const { t } = useTranslation();
  // Карта Университета Салымбекова
  const mapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2924.028544108504!2d74.5975975!3d42.8441282!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x389ec987f324329b%3A0x2cd99bcd0df5fc1f!2z0KHQsNC70LjQvNCx0LjQu9GM0L3QvtCz0L4g0KPQvdC40LLQtdGA0YHQuNGC0LXRgg!5e0!3m2!1sru!2skg!4v1712345678901!5m2!1sru!2skg";

  return (
    <div className="flex flex-col items-center justify-center gap-8 bg-slate-50 p-4 py-16 dark:bg-slate-950 md:flex-row md:p-8 md:py-20">
      {/* Левая часть - Карта Университета Салымбекова */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="relative h-[550px] w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800"
      >
        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          className="rounded-2xl"
          aria-label={t("contactsPage.map.university")}
        ></iframe>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/80 to-transparent p-4 pt-6">
          <div className="flex flex-col gap-2 text-white">
            <div className="flex items-start gap-3">
              <FaMapMarkerAlt className="text-red-400 text-xl mt-1" />
              <div>
                <p className="font-bold text-lg">{t("contactsPage.map.university")}</p>
                <p className="text-sm opacity-90">{t("contactsPage.map.address")}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <FaPhone className="text-blue-300 opacity-80" />
              <p className="text-sm">{t("contactsPage.map.phone")}</p>
            </div>

            <div className="flex items-center gap-3">
              <FaClock className="text-blue-300 opacity-80" />
              <p className="text-sm">{t("contactsPage.map.hours")}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Правая часть - Форма */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mb-6 flex items-center gap-3">
          <FaPaperPlane className="text-xl text-brand-600 dark:text-brand-400" />
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("contactsPage.form.title")}
          </h3>
        </div>

        <form className="space-y-5">
          <div className="relative">
            <FaUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t("contactsPage.form.namePlaceholder")}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 transition-colors focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-brand-900/40"
            />
          </div>

          <div className="relative">
            <FaEnvelope className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              placeholder={t("contactsPage.form.emailPlaceholder")}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 transition-colors focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-brand-900/40"
            />
          </div>

          <div className="relative">
            <FaComment className="pointer-events-none absolute left-4 top-4 text-slate-400" />
            <textarea
              placeholder={t("contactsPage.form.messagePlaceholder")}
              rows="4"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 transition-colors focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-brand-900/40"
            ></textarea>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-800"
          >
            {t("contactsPage.form.submit")}
            <FaArrowRight className="text-xs transition-transform group-hover:translate-x-1" />
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default ContactSection;