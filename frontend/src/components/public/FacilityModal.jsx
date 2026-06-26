import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SCHOOL_INFO, COLORS } from '../../constants/schoolData';
import { FaTimes, FaArrowLeft, FaArrowRight } from 'react-icons/fa';

const FacilityModal = ({ facility, onClose }) => {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const sanitizeText = (text) => {
    if (!text) return '';
    // remove markdown headings that are just 'Sport' or stray repeated headings
    const lines = String(text).split(/\r?\n/).map(l => l.trim());
    const filtered = lines.filter(l => {
      if (!l) return false; // remove empty lines for tighter presentation
      if (/^#{1,6}\s*Sport\b/i.test(l)) return false;
      if (/^#{1,6}\s*(Features|Benefits for Students|Sport Champions?)\b/i.test(l)) return false;
      if (/^Sport Champions\b/i.test(l)) return false;
      if (/^Sport Champions\s*\d{4}\b/i.test(l)) return false;
      // remove specific unwanted promotional sentence and tuition mentions
      if (/provide.*food/i.test(l)) return false;
      if (/\b(tuiti?on)\b/i.test(l)) return false;
      // remove common sports-event paste blocks
      if (/Formula\s*1|Club\s*World\s*Cup|College\s*Football\s*Playoff|PDC\s*World\s*Darts|December\s*Sports\s*Events|Sports\s*Event\s*Calendar|SportBusy/i.test(l)) return false;
      // also remove lines that look like duplicated section markers without content
      if (/^[-*_]{3,}$/.test(l)) return false;
      return true;
    });
    return filtered.join('\n\n');
  };

  useEffect(() => {
    if (!facility) return;
    const imgs = (facility.photos || []).map(p => p.url).filter(Boolean);
    setImages(imgs.length ? imgs : [ (facility.coverPhoto || '') ]);
    setCurrentIndex(0);
  }, [facility]);

  // lock background scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCurrentIndex(i => (i + 1) % images.length);
      if (e.key === 'ArrowLeft') setCurrentIndex(i => (i - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [images, onClose]);

  if (!facility) return null;

  const next = () => setCurrentIndex(i => (i + 1) % images.length);
  const prev = () => setCurrentIndex(i => (i - 1 + images.length) % images.length);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 backdrop-blur-sm" 
        style={{ backgroundColor: `${COLORS.dark}60` }}
        onClick={onClose}
      ></motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative max-w-6xl w-full mx-3 md:mx-4 md:mx-0 bg-white rounded-xl md:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] md:max-h-[95vh]"
        role="dialog"
        aria-modal="true"
      >
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="absolute right-3 md:right-4 top-3 md:top-4 z-10 p-2 rounded-full shadow transition-all duration-200"
          style={{ backgroundColor: `${COLORS.white}90` }}
          aria-label="Close"
        >
          <FaTimes style={{ color: COLORS.dark }} />
        </motion.button>

        <div className="flex flex-col md:flex-row">
          {/* Left: Photo area (40%) */}
          <div className="md:w-2/5 w-full text-white" style={{ backgroundColor: COLORS.dark }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="relative h-48 md:h-64 md:h-[520px] flex items-center justify-center"
              style={{ backgroundColor: COLORS.gray }}
            >
              {images && images[0] ? (
                <img src={images[currentIndex]} alt={facility.facilityName} className="w-full h-full object-cover" />
              ) : (
                <div className="p-4 md:p-6 text-center text-xs md:text-sm" style={{ color: COLORS.slate }}>No image available</div>
              )}

              {images.length > 1 && (
                <>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={prev} 
                    className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 text-white p-2 rounded-full transition-all duration-200"
                    style={{ backgroundColor: `${COLORS.dark}40` }}
                  >
                    <FaArrowLeft />
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={next} 
                    className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-white p-2 rounded-full transition-all duration-200"
                    style={{ backgroundColor: `${COLORS.dark}40` }}
                  >
                    <FaArrowRight />
                  </motion.button>
                </>
              )}
            </motion.div>

            {/* Thumbnails */}
            {images.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="p-3 md:p-4 bg-white flex gap-2 md:gap-3 overflow-x-auto"
              >
                {images.map((img, idx) => (
                  <motion.button 
                    key={idx} 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentIndex(idx)} 
                    className={`flex-shrink-0 w-16 md:w-20 h-12 md:h-14 rounded-lg overflow-hidden border transition-all duration-200 ${currentIndex === idx ? 'ring-2 ring-offset-2' : ''}`}
                    style={{ 
                      borderColor: currentIndex === idx ? COLORS.secondary : COLORS.lightGray,
                      '--tw-ring-color': currentIndex === idx ? COLORS.secondary : 'transparent'
                    }}
                  >
                    <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Right: Content (60%) */}
          <div className="md:w-3/5 w-full p-4 md:p-6 lg:p-8 flex flex-col">
            <div className="flex-1 overflow-auto pr-1 md:pr-2">
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="text-xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-3" 
                style={{ color: COLORS.dark }}
              >
                {facility.facilityName}
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="mb-4 md:mb-6 whitespace-pre-line text-xs md:text-sm" 
                style={{ color: COLORS.slate }}
              >
                {facility.fullDescription || facility.shortDescription}
              </motion.p>

              {(facility.features && facility.features.length) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.25 }}
                  className="mb-4 md:mb-6"
                >
                  <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3" style={{ color: COLORS.dark }}>Features</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                    {(facility.features || []).map((f, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: 0.3 + (i * 0.05) }}
                        className="flex items-start gap-2 md:gap-3"
                      >
                        <div className="w-5 h-5 md:w-6 md:h-6 text-white rounded-full flex items-center justify-center mt-0.5 md:mt-1 text-xs md:text-sm" style={{ backgroundColor: COLORS.secondary }}>✓</div>
                        <p className="text-xs md:text-sm" style={{ color: COLORS.slate }}>{f}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {(facility.benefits && facility.benefits.length) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.35 }}
                  className="mb-4 md:mb-6"
                >
                  <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3" style={{ color: COLORS.dark }}>Benefits for Students</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                    {facility.benefits.map((b, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: 0.4 + (i * 0.05) }}
                        className="flex items-start gap-2 md:gap-3"
                      >
                        <div className="w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center mt-0.5 md:mt-1 text-xs md:text-sm" style={{ backgroundColor: COLORS.warning, color: COLORS.dark }}>✓</div>
                        <p className="text-xs md:text-sm" style={{ color: COLORS.slate }}>{b}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {facility.additionalInfo && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.45 }}
                  className="mb-4 md:mb-6"
                >
                  <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3" style={{ color: COLORS.dark }}>Additional Information</h3>
                  <div className="whitespace-pre-line text-xs md:text-sm" style={{ color: COLORS.slate }}>{sanitizeText(facility.additionalInfo)}</div>
                </motion.div>
              )}
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="flex gap-2 md:gap-3 mt-3 md:mt-4 md:mt-6 sticky bottom-0 bg-white pt-3 md:pt-4"
            >
              <motion.a 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={`mailto:${SCHOOL_INFO.email}?subject=${encodeURIComponent('Facility Inquiry: ' + (facility.facilityName || ''))}`} 
                className="px-4 md:px-6 py-2 md:py-3 text-white rounded-lg font-semibold text-xs md:text-sm transition-all duration-200 shadow-lg hover:shadow-xl"
                style={{ backgroundColor: COLORS.secondary }}
              >
                Inquire
              </motion.a>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose} 
                className="px-4 md:px-6 py-2 md:py-3 rounded-lg text-xs md:text-sm transition-all duration-200 shadow-md hover:shadow-lg"
                style={{ backgroundColor: COLORS.gray, color: COLORS.dark }}
              >
                Close
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FacilityModal;
