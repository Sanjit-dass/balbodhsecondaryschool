import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslate } from '../../hooks/useTranslate';
import { COLORS } from '../../constants/schoolData';

const HeroSlider = () => {
  const { t } = useTranslate();
  const videoRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const [soundOn, setSoundOn] = useState(false);

  // ✅ PLAY / STOP VIDEO BASED ON ROUTE
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (location.pathname === "/") {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [location.pathname]);

  // ✅ SOUND TOGGLE
  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = soundOn;
    setSoundOn(!soundOn);
  };

  return (
    <div className="relative h-screen overflow-hidden bg-black">

      {/* ================= VIDEO ================= */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover scale-105"
        autoPlay
        muted={!soundOn}
        loop
        playsInline
        preload="auto"
      >
        <source src="/videos/Balbodh.mp4" type="video/mp4" />
      </video>

      {/* ================= OVERLAY (PREMIUM LIGHT LOOK) ================= */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/40 to-black/60" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

      {/* ================= SOUND BUTTON ================= */}
      <button
        onClick={toggleSound}
        className="absolute top-4 md:top-6 right-4 md:right-6 z-20 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold
                   bg-white/10 backdrop-blur-md
                   border border-white/30
                   text-white hover:bg-white/20 transition-all duration-300 shadow-lg"
      >
        {soundOn ? t('🔊 Sound ON') : t('🔇 Sound OFF')}
      </button>

      {/* ================= CENTER CONTENT ================= */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 flex items-center justify-center px-4 md:px-6"
      >
        {/* GLASS CARD */}
        <div className="text-center text-white max-w-5xl p-6 md:p-8 lg:p-10 rounded-2xl md:rounded-3xl
                         backdrop-blur-xl  bg-white/8 border border-white/10 shadow-2xl">


          {/* BADGE */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xs md:text-sm tracking-widest uppercase text-white/80 mb-3 md:mb-4 font-bold"
            style={{ color: COLORS.accent }}
          >
            {t('Welcome to Excellence')}
          </motion.p>

          {/* TITLE */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-4 md:mb-6 leading-tight text-white"
          >
            {t('Welcome to')} <br />
            <span className="drop-shadow-2xl" style={{ color: COLORS.accent }}>
              {t('Bal Bodh Secondary School')}
            </span>
          </motion.h1>

          {/* SUBTITLE */}
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-base md:text-lg lg:text-xl xl:text-2xl text-white/95 mb-6 md:mb-8 lg:mb-10 font-medium"
          >
            {t('Empowering Future Leaders with Quality Education')}
          </motion.p>

          {/* BUTTONS */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-3 md:gap-5 justify-center"
          >

            {/* EXPLORE MORE */}
            <button
              onClick={() => navigate("/about")}
              className="px-6 py-3 md:px-8 md:py-4 rounded-full font-bold text-sm md:text-base
                         text-black transition-all duration-300 shadow-xl hover:shadow-2xl active:scale-95"
              style={{ backgroundColor: COLORS.accent }}
            >
              {t('Explore More')}
            </button>

            {/* ADMISSION */}
            <button
              onClick={() => navigate("/Admissions")}
              className="px-6 py-3 md:px-8 md:py-4 rounded-full font-bold text-sm md:text-base
                         border border-white/40
                         bg-white/10 backdrop-blur-md
                         text-white hover:bg-white hover:text-black
                         transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95"
            >
              {t('Admission Open')}
            </button>

          </motion.div>
        </div>
      </motion.div>

      {/* ================= SCROLL INDICATOR ================= */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 md:w-8 md:h-12 border-2 border-white/40 rounded-full flex justify-center pt-2" style={{ borderColor: `${COLORS.accent}80` }}>
          <div className="w-1.5 h-3 rounded-full animate-bounce" style={{ backgroundColor: COLORS.accent }} />
        </div>
      </motion.div>

    </div>
  );
};

export default HeroSlider;