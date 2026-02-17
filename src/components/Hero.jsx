import { motion, useAnimation, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FaBook, FaSearch, FaUserGraduate, FaCalendarAlt, FaArrowRight, FaBookOpen, FaBookReader } from "react-icons/fa";

const LibraryHero = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  const [glitch, setGlitch] = useState(false);

  const stats = [
    { icon: <FaBook className="text-yellow-400" />, value: 1000, label: t("hero.stats.books"), suffix: "+" },
    { icon: <FaUserGraduate className="text-blue-400" />, value: 500, label: t("hero.stats.readers"), suffix: "+" },
    { icon: <FaCalendarAlt className="text-red-400" />, value: 2025, label: t("hero.stats.year"), suffix: "" }
  ];
  const [activeStat, setActiveStat] = useState(0);
  const statControls = useAnimation();

  const title = t("hero.title");
  const [displayedTitle, setDisplayedTitle] = useState("");

  useEffect(() => {
    const handleMouseMove = (e) => {
      x.set(e.clientX - window.innerWidth / 2);
      y.set(e.clientY - window.innerHeight / 2);
    };
    window.addEventListener("mousemove", handleMouseMove);

    const glitchInterval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 200);
    }, 5000);

    let i = 0;
    const typing = setInterval(() => {
      if (i < title.length) {
        setDisplayedTitle(title.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typing);
      }
    }, 100);

    const statInterval = setInterval(() => {
      statControls.start({
        opacity: 0,
        y: 20,
        transition: { duration: 0.3 }
      }).then(() => {
        setActiveStat((prev) => (prev + 1) % stats.length);
        statControls.start({
          opacity: 1,
          y: 0,
          transition: { duration: 0.5 }
        });
      });
    }, 3000);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(glitchInterval);
      clearInterval(typing);
      clearInterval(statInterval);
    };
  }, [title]);

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "radial-gradient(circle at 30% 50%, #1a1a2e 0%, #000 70%)",
            "radial-gradient(circle at 70% 50%, #16213e 0%, #000 70%)",
            "radial-gradient(circle at 50% 30%, #1f1f3d 0%, #000 70%)"
          ]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />

      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="text-green-400/30 text-xs font-mono absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`
          }}
          animate={{
            y: [0, window.innerHeight + 100],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 5
          }}
        >
          {Math.random() > 0.5 ? "0010110" : "1011001"}
        </motion.div>
      ))}

      {[
        { icon: <FaBookOpen className="text-purple-400" size={36} />, name: t("hero.books") },
        { icon: <FaSearch className="text-emerald-400" size={36} />, name: t("hero.search") },
        { icon: <FaBookReader className="text-amber-400" size={36} />, name: t("hero.reading") }
      ].map((item, i) => (
        <motion.div
          key={i}
          className="absolute flex flex-col items-center"
          style={{
            left: `${20 + i * 30}%`,
            top: `${30 + Math.random() * 40}%`
          }}
          animate={{
            y: [0, -40, 0],
            rotateZ: [0, 5, -5, 0],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 5 + i * 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {item.icon}
          <motion.span className="text-white/80 mt-2 text-sm">{item.name}</motion.span>
        </motion.div>
      ))}

      <motion.div className="h-full flex flex-col justify-center items-center relative z-10 px-4" style={{ rotateX, rotateY }}>
        <motion.div className="relative">
          <motion.h1
            className="text-5xl md:text-8xl font-extrabold text-center mb-8"
            animate={
              glitch
                ? {
                    x: [0, 10, -10, 0],
                    y: [0, -5, 5, 0],
                    textShadow: [
                      "0 0 10px #3b82f6",
                      "0 0 20px #ec4899",
                      "0 0 10px #10b981",
                      "0 0 5px #ffffff"
                    ]
                  }
                : {
                    textShadow: "0 0 10px rgba(59, 130, 246, 0.5)"
                  }
            }
            transition={{ duration: 0.3 }}
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
              {displayedTitle}
              <motion.span
                className="ml-2 inline-block w-3 h-16 bg-white"
                animate={{ opacity: [0, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
              />
            </span>
          </motion.h1>

          {glitch && (
            <motion.div
              className="absolute inset-0 bg-white/10 mix-blend-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="text-xl md:text-3xl text-blue-300 mb-12 max-w-2xl text-center"
        >
          {t("hero.subtitle")}
        </motion.p>

        <div className="relative h-24 w-full max-w-lg mb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStat}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center gap-4"
            >
              <div className="text-4xl">{stats[activeStat].icon}</div>
              <div>
                <div className="text-4xl font-bold text-white">
                  {stats[activeStat].value}
                  <span className="text-yellow-400">{stats[activeStat].suffix}</span>
                </div>
                <div className="text-lg text-blue-300">{stats[activeStat].label}</div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.8 }}
          className="flex flex-wrap justify-center gap-6"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full font-bold text-white overflow-hidden group"
          >
            <span className="relative z-10 flex items-center gap-2">
              {t("hero.startReading")} <FaArrowRight />
            </span>
            <motion.span
              className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20"
              transition={{ duration: 0.3 }}
            />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/catalog')}
            className="relative px-8 py-4 bg-transparent border-2 border-blue-400 rounded-full font-bold text-blue-300 overflow-hidden group"
          >
            <span className="relative z-10 flex items-center gap-2">
              {t("hero.catalog")}
            </span>
            <motion.span
              className="absolute inset-0 bg-blue-400 opacity-0 group-hover:opacity-10"
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-0 w-full">
        <svg viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            fill="rgba(59, 130, 246, 0.2)"
          />
        </svg>
      </div>
    </div>
  );
};

export default LibraryHero;
