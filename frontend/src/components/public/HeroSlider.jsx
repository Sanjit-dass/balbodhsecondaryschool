import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslate } from '../../hooks/useTranslate';

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
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-white/10" />

      {/* ================= SOUND BUTTON ================= */}
      <button
        onClick={toggleSound}
        className="absolute top-6 right-6 z-20 px-4 py-2 rounded-full 
                   bg-white/10 backdrop-blur-md 
                   border border-white/20 
                   text-white text-sm hover:bg-white/20 transition"
      >
        {soundOn ? t('🔊 Sound ON') : t('🔇 Sound OFF')}
      </button>

      {/* ================= CENTER CONTENT ================= */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 flex items-center justify-center px-4"
      >
        {/* GLASS CARD */}
        <div className="text-center text-white max-w-5xl p-10 rounded-3xl 
                         backdrop-blur-sm  bg-white/5 border border-white/5 shadow-xl animate-fadeInUp">
                         

          {/* BADGE */}
          <p className="text-sm tracking-widest uppercase text-white/70 mb-4 font-bold">
            {t('Welcome to Excellence')}
          </p>

          {/* TITLE */}
          <h1 className="text-4xl md:text-7xl font-extrabold mb-6 leading-tight text-white">
            {t('Welcome to')} <br />
            <span className="text-yellow-300 drop-shadow-xl">
              {t('Bal Bodh Secondary School')}
            </span>
          </h1>

          {/* SUBTITLE */}
          <p className="text-lg md:text-2xl text-white/90 mb-10">
            {t('Empowering Future Leaders with Quality Education')}
          </p>

          {/* BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-5 justify-center">

            {/* EXPLORE MORE */}
            <button
              onClick={() => navigate("/about")}
              className="px-10 py-4 rounded-full font-bold 
                         bg-yellow-300 text-black 
                         hover:bg-yellow-400 transition shadow-xl"
            >
              {t('Explore More')}
            </button>

            {/* ADMISSION */}
            <button
              onClick={() => navigate("/Admissions")}
              className="px-10 py-4 rounded-full font-bold 
                         border border-white/30 
                         bg-white/10 backdrop-blur-md 
                         text-white hover:bg-white hover:text-black 
                         transition shadow-lg"
            >
              {t('Admission Open')}
            </button>

          </div>
        </div>
      </motion.div>

      {/* ================= SCROLL INDICATOR ================= */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="w-8 h-12 border-2 border-white/40 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-white rounded-full animate-bounce" />
        </div>
      </div>

    </div>
  );
};

export default HeroSlider;