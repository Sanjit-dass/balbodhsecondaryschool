import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { COLORS } from '../../constants/schoolData';
const defaultAvatar = '/images/faculty1.png';

export default function StaffModal({ staff, onClose }){
  if (!staff) return null;

  const photoUrl = (staff.photo && staff.photo.url) || defaultAvatar;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const prevTop = document.body.style.top;
    const prevLeft = document.body.style.left;
    const prevRight = document.body.style.right;
    const prevWidth = document.body.style.width;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    try {
      document.documentElement.style.scrollBehavior = 'auto';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      document.body.style.width = '100%';
    } catch (e) { /* ignore */ }

    return () => {
      try {
        document.body.style.position = prevPosition || '';
        document.body.style.top = prevTop || '';
        document.body.style.left = prevLeft || '';
        document.body.style.right = prevRight || '';
        document.body.style.overflow = prevOverflow || '';
        document.body.style.width = prevWidth || '';
        const restored = prevTop ? parseInt(prevTop.replace(/[^0-9]/g, ''), 10) || scrollY : scrollY;
        window.scrollTo(0, restored);
      } catch (e) { /* ignore */ }
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0" 
        style={{ backgroundColor: `${COLORS.dark}50` }}
        onClick={onClose} 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: 'easeOut' }} 
        className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-6xl w-full mx-3 md:mx-4 overflow-hidden z-50 relative max-h-[90vh] md:max-h-[95vh]"
      >
        {/* Floating Close Button */}
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose} 
          className="absolute right-3 md:right-6 top-3 md:top-1/2 -translate-y-1/2 text-white px-3 md:px-4 py-2 md:py-3 rounded-lg shadow-lg z-50 text-xs md:text-sm transition-all duration-200"
          style={{ backgroundColor: COLORS.secondary }}
        >
          Close
        </motion.button>

        <div className="md:flex flex-col md:flex-row max-h-[90vh] md:max-h-[95vh] overflow-auto">
          {/* LEFT: Photo + name */}
          <div className="md:w-2/5 w-full p-4 md:p-6 flex flex-col items-center" style={{ backgroundColor: COLORS.gray }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="w-full rounded-lg overflow-hidden shadow-lg flex items-center justify-center bg-white"
            >
                <img src={photoUrl} alt={staff.fullName} className="max-h-[40vh] md:max-h-[60vh] w-auto object-contain" />
              </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="text-center mt-3 md:mt-4"
            >
              <div className="text-lg md:text-xl font-bold" style={{ color: COLORS.dark }}>{staff.fullName}</div>
            </motion.div>
          </div>

          {/* RIGHT: Details */}
          <div className="md:w-3/5 w-full p-4 md:p-6 lg:p-8">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="text-xl md:text-3xl font-bold mb-2" 
              style={{ color: COLORS.dark }}
            >
              {staff.fullName}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="text-xs md:text-base mb-2" 
              style={{ color: COLORS.slate }}
            >
              {staff.designation}
            </motion.p>
            {staff.department ? <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.25 }} className="text-xs md:text-base mb-2" style={{ color: COLORS.slate }}>{staff.department}</motion.p> : null}
            {staff.subject ? <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.3 }} className="text-xs md:text-base mb-2" style={{ color: COLORS.slate }}>Subject: {staff.subject}</motion.p> : null}
            {staff.experience ? <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.35 }} className="text-xs md:text-base mb-2" style={{ color: COLORS.slate }}>Experience: {staff.experience}</motion.p> : null}

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="mt-4 md:mt-8"
            >
              <h3 className="font-semibold mb-2 md:mb-3 text-base md:text-lg" style={{ color: COLORS.dark }}>About Teacher</h3>
              <div className="whitespace-pre-line text-xs md:text-base leading-relaxed" style={{ color: COLORS.slate }}>{staff.shortBio || 'No description available.'}</div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
