import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { apiBaseURL, API_BASE } from '../../services/api';

export default function Facilities() {
  const [selected, setSelected] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const API = API_BASE;

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/facilities`);
      if (!res.ok) throw new Error('Failed to load facilities');
      const body = await res.json();
      const list = Array.isArray(body.data) ? body.data : [];
      list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setFacilities(list);
    } catch (err) {
      console.error(err);
      setFacilities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const selectedFacility = facilities.find((a) => String(a._id || a.id) === String(selected));

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 md:mb-4">World-Class Facilities</h2>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2">Equipped with modern infrastructure for holistic development and quality education.</p>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading facilities…</div>
        ) : facilities.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No facilities published yet.</div>
        ) : (
          <FacilitySlider facilities={facilities} onSelect={setSelected} />
        )}

        <AnimatePresence>
          {selected && selectedFacility && (
            <FacilityModal
              facility={selectedFacility}
              onClose={() => setSelected(null)}
            />
          )}
        </AnimatePresence>

        {/* Explore All Button */}
        {!loading && facilities.length > 0 && (
          <div className="text-center mt-8 md:mt-12">
            <button
              onClick={() => window.location.href = '/facilities'}
              className="px-6 py-3 md:px-8 md:py-4 bg-indigo-600 text-white rounded-full font-semibold text-sm md:text-base hover:bg-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Explore All Facilities
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function FacilitySlider({ facilities, onSelect }) {
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

  const maxIndex = Math.max(0, facilities.length - cardsPerView);

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
      const gap = 32; // gap-8 = 2rem = 32px
      const firstChild = sliderRef.current.children[0];
      const cardWidth = firstChild ? firstChild.clientWidth : sliderRef.current.clientWidth / cardsPerView;
      sliderRef.current.scrollTo({
        left: currentIndex * (cardWidth + gap),
        behavior: 'smooth'
      });
    }
  }, [currentIndex, facilities.length, cardsPerView]);

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
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 -translate-x-2 md:-translate-x-4 p-3 md:p-4 bg-white/95 backdrop-blur-sm rounded-full shadow-2xl hover:bg-white hover:shadow-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110 hidden sm:block"
      >
        <FaChevronLeft className="text-gray-800 text-lg md:text-xl" />
      </button>

      <button
        onClick={handleNext}
        disabled={currentIndex >= maxIndex}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 translate-x-2 md:translate-x-4 p-3 md:p-4 bg-white/95 backdrop-blur-sm rounded-full shadow-2xl hover:bg-white hover:shadow-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110 hidden sm:block"
      >
        <FaChevronRight className="text-gray-800 text-lg md:text-xl" />
      </button>

      {/* Slider Container */}
      <div
        ref={sliderRef}
        className="flex gap-4 md:gap-8 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing scroll-smooth"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '1rem 0'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {facilities.map((facility) => (
          <div
            key={facility._id}
            className="flex-shrink-0 w-full"
            style={{ width: `calc(${100 / cardsPerView}% - ${(cardsPerView - 1) * (cardsPerView > 2 ? 32 : 16) / cardsPerView}px)` }}
          >
            <FacilityCard facility={facility} onClick={() => onSelect(facility._id)} />
          </div>
        ))}
      </div>

      {/* Premium Dots Indicator */}
      <div className="flex justify-center gap-2 md:gap-3 mt-6 md:mt-8">
        {facilities.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCurrentIndex(Math.min(idx, maxIndex));
              setAutoScroll(false);
              setTimeout(() => setAutoScroll(true), 5000);
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === currentIndex
                ? 'w-6 md:w-8 bg-indigo-600 shadow-lg shadow-indigo-200'
                      : 'w-2 bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function FacilityCard({ facility, onClick }) {
  const coverPhoto = facility.coverPhoto
    ? facility.photos?.find(p => String(p._id) === String(facility.coverPhoto))
    : facility.photos?.[0];

  const imageUrl = coverPhoto?.url || facility.photos?.[0]?.url;

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      className="group relative bg-white rounded-xl md:rounded-2xl shadow-md hover:shadow-lg overflow-hidden cursor-pointer transition-all duration-300 h-full"
      onClick={onClick}
    >
      {/* Cover Photo with Premium Overlay */}
      <div className="relative h-48 md:h-64 lg:h-72 xl:h-80 lg:h-96 overflow-hidden">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={facility.facilityName}
              className="w-full h-full object-contain md:object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center">
            <span className="text-white text-4xl md:text-5xl lg:text-6xl font-bold tracking-wider">{facility.facilityName?.charAt(0) || 'F'}</span>
          </div>
        )}

        {/* Floating Badge */}
        <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-white/90 backdrop-blur-sm px-2 py-1 md:px-3 md:py-1.5 rounded-full shadow-lg">
          <span className="text-[10px] md:text-xs font-semibold text-gray-800">
            {facility.category || 'Infrastructure'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6">
        <h3 className="text-base md:text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {facility.facilityName}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
          {facility.shortDescription}
        </p>

        {/* Simplified View More Button */}
        <button className="w-full py-2 bg-indigo-600 text-white rounded-md font-semibold text-sm hover:bg-indigo-700 transition-all duration-200">
          View Details
        </button>
      </div>

      {/* Shine Effect on Hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </motion.div>
  );
}

function FacilityModal({ facility, onClose }) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayRef = useRef(null);
  const modalScrollRef = useRef(0);

  const photos = facility.photos || [];
  const coverPhotoIndex = facility.coverPhoto
    ? photos.findIndex(p => String(p._id) === String(facility.coverPhoto))
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

  // lock body scroll while modal is open
  useEffect(() => {
    const y = window.scrollY || window.pageYOffset;
    modalScrollRef.current = y;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${y}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      window.scrollTo(0, modalScrollRef.current || 0);
    };
  }, []);

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
            <h3 className="text-2xl font-bold text-gray-900">{facility.facilityName}</h3>
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                {facility.category || 'Infrastructure'}
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
                    alt={currentPhoto?.caption || facility.facilityName}
                    className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-2xl"
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
              <p className="text-gray-600 leading-relaxed">{facility.shortDescription}</p>
            </div>

            {/* Full Description Section */}
            {facility.fullDescription && (
              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <span className="text-indigo-600">📝</span>
                  </span>
                  Details
                </h4>
                <p className="text-gray-600 leading-relaxed">{facility.fullDescription}</p>
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
                        className="w-full h-full object-cover"
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
