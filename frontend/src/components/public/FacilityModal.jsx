import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SCHOOL_INFO } from '../../constants/schoolData';
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="relative max-w-6xl w-full mx-4 md:mx-0 bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 bg-white/90 p-2 rounded-full shadow hover:bg-white"
          aria-label="Close"
        >
          <FaTimes />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Left: Photo area (40%) */}
          <div className="md:w-2/5 w-full bg-gray-900 text-white">
            <div className="relative h-64 md:h-[520px] bg-gray-800 flex items-center justify-center">
              {images && images[0] ? (
                <img src={images[currentIndex]} alt={facility.facilityName} className="w-full h-full object-cover" />
              ) : (
                <div className="p-6 text-center">No image available</div>
              )}

              {images.length > 1 && (
                <>
                  <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full">
                    <FaArrowLeft />
                  </button>
                  <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full">
                    <FaArrowRight />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 0 && (
              <div className="p-4 bg-white flex gap-3 overflow-x-auto">
                {images.map((img, idx) => (
                  <button key={idx} onClick={() => setCurrentIndex(idx)} className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border ${currentIndex === idx ? 'border-blue-600' : 'border-gray-200'}`}>
                    <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Content (60%) */}
          <div className="md:w-3/5 w-full p-6 md:p-8 flex flex-col">
            <div className="flex-1 overflow-auto pr-2">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{facility.facilityName}</h2>
              <p className="text-gray-700 mb-6 whitespace-pre-line">{facility.fullDescription || facility.shortDescription}</p>

              {(facility.features && facility.features.length) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Features</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(facility.features || []).map((f, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center mt-1">✓</div>
                        <p className="text-gray-700">{f}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(facility.benefits && facility.benefits.length) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefits for Students</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {facility.benefits.map((b, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-yellow-400 text-black rounded-full flex items-center justify-center mt-1">✓</div>
                        <p className="text-gray-700">{b}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {facility.additionalInfo && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Information</h3>
                  <div className="text-gray-700 whitespace-pre-line">{sanitizeText(facility.additionalInfo)}</div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-4 md:mt-6 sticky bottom-0 bg-white pt-4">
              <a href={`mailto:${SCHOOL_INFO.email}?subject=${encodeURIComponent('Facility Inquiry: ' + (facility.facilityName || ''))}`} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold">Inquire</a>
              <button onClick={onClose} className="px-6 py-3 bg-gray-100 text-gray-800 rounded-lg">Close</button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FacilityModal;
