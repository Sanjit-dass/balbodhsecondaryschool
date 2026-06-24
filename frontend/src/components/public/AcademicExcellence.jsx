import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { AuthContext } from '../../contexts/AuthContext';
import { apiBaseURL, API_BASE } from '../../services/api';

export default function AcademicExcellence() {
  const [selected, setSelected] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const API = API_BASE;

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/academic-excellence`);
      if (!res.ok) throw new Error('Failed to load achievements');
      const body = await res.json();
      const list = Array.isArray(body.data) ? body.data : [];
      list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setAchievements(list);
    } catch (err) {
      console.error(err);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
    const handler = () => fetchAchievements();
    window.addEventListener('academic-excellence:updated', handler);
    return () => window.removeEventListener('academic-excellence:updated', handler);
  }, []);

  const selectedAchievement = achievements.find((a) => String(a._id || a.id) === String(selected));

  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="max-w-[1600px] mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Academic Excellence</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Celebrating outstanding achievements and consistent performance</p>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading achievements…</div>
        ) : achievements.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No achievements published yet.</div>
        ) : (
          <AchievementSlider achievements={achievements} onSelect={setSelected} />
        )}

        <AnimatePresence>
          {selected && selectedAchievement && (
            <AchievementModal
              achievement={selectedAchievement}
              onClose={() => setSelected(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function AchievementSlider({ achievements, onSelect }) {
  const sliderRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const autoScrollRef = useRef(null);

  // Responsive card counts (desktop:4, tablet:2, mobile:1)
  const getCardsPerView = () => {
    if (typeof window === 'undefined') return 4;
    const w = window.innerWidth;
    if (w < 768) return 1; // Mobile
    if (w < 1024) return 2; // Tablet
    return 4; // Desktop
  };

  const [cardsPerView, setCardsPerView] = useState(getCardsPerView());
  useEffect(() => {
    const onResize = () => setCardsPerView(getCardsPerView());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const maxIndex = Math.max(0, achievements.length - cardsPerView);

  // Auto-scroll
  useEffect(() => {
    if (!autoScroll || isDragging) return;
    
    autoScrollRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= maxIndex) return 0;
        return prev + 1;
      });
    }, 4000);

    return () => clearInterval(autoScrollRef.current);
  }, [autoScroll, isDragging, maxIndex]);

  // Scroll to current index
  useEffect(() => {
    if (sliderRef.current) {
      // Tailwind `gap-8` equals 2rem -> typically 32px. Use actual child width when available.
      const gap = 32;
      const firstChild = sliderRef.current.children[0];
      const cardWidth = firstChild ? firstChild.clientWidth : sliderRef.current.clientWidth / cardsPerView;
      const left = currentIndex * (cardWidth + gap);
      sliderRef.current.scrollTo({ left, behavior: 'smooth' });
    }
  }, [currentIndex, achievements.length, cardsPerView]);

  // Recalculate position on resize to avoid misalignment on mobile (address bar show/hide)
  useEffect(() => {
    const onResize = () => {
      if (!sliderRef.current) return;
      const gap = 32;
      const firstChild = sliderRef.current.children[0];
      const cardWidth = firstChild ? firstChild.clientWidth : sliderRef.current.clientWidth / cardsPerView;
      const left = currentIndex * (cardWidth + gap);
      sliderRef.current.scrollTo({ left, behavior: 'auto' });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [currentIndex, cardsPerView]);

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setAutoScroll(false);
    setTimeout(() => setAutoScroll(true), 5000);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
    setAutoScroll(false);
    setTimeout(() => setAutoScroll(true), 5000);
  };

  // Mouse drag
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
    setAutoScroll(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setTimeout(() => setAutoScroll(true), 3000);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Touch swipe
  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setAutoScroll(false);
  };

  const handleTouchEnd = (e) => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    
    setTimeout(() => setAutoScroll(true), 3000);
  };

  return (
    <div className="relative">
      {/* Premium Navigation Buttons */}
      <button
        onClick={handlePrev}
        disabled={currentIndex === 0}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 -translate-x-4 p-4 bg-white/95 backdrop-blur-sm rounded-full shadow-2xl hover:bg-white hover:shadow-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110"
      >
        <FaChevronLeft className="text-gray-800 text-xl" />
      </button>

      <button
        onClick={handleNext}
        disabled={currentIndex >= maxIndex}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 translate-x-4 p-4 bg-white/95 backdrop-blur-sm rounded-full shadow-2xl hover:bg-white hover:shadow-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110"
      >
        <FaChevronRight className="text-gray-800 text-xl" />
      </button>

      {/* Slider Container */}
      <div
        ref={sliderRef}
        className="flex gap-8 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing scroll-smooth"
        style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '1.5rem 0'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {achievements.map((achievement) => (
          <div
            key={achievement._id}
            className="flex-shrink-0"
            style={{ flex: `0 0 ${100 / cardsPerView}%` }}
          >
            <div style={{ paddingRight: 8 }}>
              <AchievementCard achievement={achievement} onClick={() => onSelect(achievement._id)} />
            </div>
          </div>
        ))}
      </div>

      {/* Premium Dots Indicator */}
      <div className="flex justify-center gap-3 mt-8">
        {achievements.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCurrentIndex(Math.min(idx, maxIndex));
              setAutoScroll(false);
              setTimeout(() => setAutoScroll(true), 5000);
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === currentIndex 
                ? 'w-8 bg-indigo-600 shadow-lg shadow-indigo-200' 
                : 'w-2 bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function AchievementCard({ achievement, onClick }) {
  const coverPhoto = achievement.coverPhoto
    ? achievement.photos?.find(p => String(p._id) === String(achievement.coverPhoto))
    : achievement.photos?.[0];

  const imageUrl = coverPhoto?.url || achievement.photos?.[0]?.url;

  return (
    <motion.div
      whileHover={{ y: -12, scale: 1.03 }}
      className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl overflow-hidden cursor-pointer transition-all duration-500 h-full"
      onClick={onClick}
    >
      {/* Cover Photo with Premium Overlay */}
          <div className="relative h-72 md:h-80 lg:h-96 overflow-hidden">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={achievement.title}
              loading="lazy"
              decoding="async"
              style={{ willChange: 'transform', transform: 'translateZ(0)' }}
              className="w-full h-full object-contain md:object-cover object-center group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center">
            <span className="text-white text-6xl font-bold tracking-wider">{achievement.title?.charAt(0) || 'A'}</span>
          </div>
        )}
        
        {/* Floating Badge */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
          <span className="text-xs font-semibold text-gray-800">
            {achievement.category || 'Academic'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {achievement.title}
        </h3>
        <p className="text-gray-600 text-base mb-6 line-clamp-3 leading-relaxed">
          {achievement.description}
        </p>

        {/* Statistics with Premium Design */}
        {achievement.statistics && achievement.statistics.length > 0 && (
          <div className="space-y-3">
            {achievement.statistics.slice(0, 3).map((stat, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 group-hover:border-indigo-200 transition-colors"
              >
                <span className="text-sm text-gray-600 font-medium">{stat.label}</span>
                <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  {stat.value}
                </span>
              </div>
            ))}
            {achievement.statistics.length > 3 && (
              <div className="text-center pt-2">
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full inline-block">
                  +{achievement.statistics.length - 3} more statistics
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Shine Effect on Hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </motion.div>
  );
}

function AchievementModal({ achievement, onClose }) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayRef = useRef(null);

  const photos = achievement.photos || [];
  const coverPhotoIndex = achievement.coverPhoto
    ? photos.findIndex(p => String(p._id) === String(achievement.coverPhoto))
    : 0;

  // Start at cover photo
  useEffect(() => {
    if (coverPhotoIndex >= 0) {
      setCurrentPhotoIndex(coverPhotoIndex);
    }
  }, [coverPhotoIndex]);

  // Auto slideshow
  useEffect(() => {
    if (isAutoPlaying && photos.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
      }, 3000);
    }
    return () => clearInterval(autoPlayRef.current);
  }, [isAutoPlaying, photos.length]);

  const handlePrev = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleNext = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photos.length]);

  const currentPhoto = photos[currentPhotoIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh]"
      >
        {/* Premium Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{achievement.title}</h3>
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                {achievement.category || 'Academic'}
              </span>
              <span>•</span>
              <span>Photo {currentPhotoIndex + 1} of {photos.length}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/80 rounded-full transition-all duration-300 hover:rotate-90"
          >
            <FaTimes className="text-gray-600 text-xl" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row max-h-[calc(90vh-100px)]">
          {/* Premium Photo Gallery */}
          <div className="lg:w-2/3 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-6">
            {photos.length > 0 ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="relative">
                  <img
                    src={currentPhoto?.url}
                    alt={currentPhoto?.caption || achievement.title}
                    loading="lazy"
                    decoding="async"
                    style={{ willChange: 'transform', transform: 'translateZ(0)' }}
                    className="max-w-full max-h-[60vh] object-contain object-center rounded-xl shadow-2xl"
                  />
                  {/* Photo Caption */}
                  {currentPhoto?.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-xl">
                      <p className="text-white text-sm">{currentPhoto.caption}</p>
                    </div>
                  )}
                </div>

                {/* Premium Navigation Arrows */}
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={handlePrev}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-white/95 hover:bg-white rounded-full shadow-xl transition-all duration-300 hover:scale-110"
                    >
                      <FaChevronLeft className="text-gray-800 text-xl" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-white/95 hover:bg-white rounded-full shadow-xl transition-all duration-300 hover:scale-110"
                    >
                      <FaChevronRight className="text-gray-800 text-xl" />
                    </button>
                  </>
                )}

                {/* Premium Auto-play Toggle */}
                {photos.length > 1 && (
                  <button
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-xl text-sm font-semibold transition-all duration-300 ${
                      isAutoPlaying 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                        : 'bg-white text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    {isAutoPlaying ? '⏸ Pause Slideshow' : '▶ Start Slideshow'}
                  </button>
                )}
              </div>
            ) : (
              <div className="text-gray-400 text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                  <span className="text-4xl">📷</span>
                </div>
                <p className="text-lg">No photos available</p>
              </div>
            )}
          </div>

          {/* Premium Details Panel */}
          <div className="lg:w-1/3 p-6 overflow-y-auto bg-white">
            {/* About Section */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <span className="text-indigo-600">ℹ</span>
                </span>
                About
              </h4>
              <p className="text-gray-600 leading-relaxed">{achievement.description}</p>
            </div>

            {/* Statistics Section */}
            {achievement.statistics && achievement.statistics.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <span className="text-indigo-600">📊</span>
                  </span>
                  Statistics
                </h4>
                <div className="space-y-3">
                  {achievement.statistics.map((stat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 hover:shadow-md transition-all duration-300"
                    >
                      <span className="text-sm font-medium text-gray-700">{stat.label}</span>
                      <span className="text-lg font-bold text-indigo-600">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Premium Thumbnail Strip */}
            {photos.length > 1 && (
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <span className="text-indigo-600">🖼</span>
                  </span>
                  All Photos
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  {photos.map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPhotoIndex(idx)}
                      className={`aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${
                        idx === currentPhotoIndex
                          ? 'border-indigo-500 ring-4 ring-indigo-200 shadow-lg'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption}
                        loading="lazy"
                        decoding="async"
                        style={{ willChange: 'transform', transform: 'translateZ(0)' }}
                        className="w-full h-full object-cover object-center"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
