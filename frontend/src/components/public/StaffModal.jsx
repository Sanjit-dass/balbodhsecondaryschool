import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import defaultAvatar from '../../images/faculty1.png';

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
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full mx-4 overflow-hidden z-50 relative">
        {/* Floating Close Button */}
        <button onClick={onClose} className="absolute right-6 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-3 rounded-lg shadow-lg z-50">Close</button>

        <div className="md:flex">
          {/* LEFT: Photo + name */}
          <div className="md:w-2/5 p-6 flex flex-col items-center bg-gray-50">
            <div className="w-full rounded-lg overflow-hidden shadow-lg flex items-center justify-center bg-white">
                <img src={photoUrl} alt={staff.fullName} className="max-h-[60vh] md:max-h-[70vh] w-auto object-contain" />
              </div>
            <div className="text-center mt-4">
              <div className="text-xl font-bold text-gray-900">{staff.fullName}</div>
            </div>
          </div>

          {/* RIGHT: Details */}
          <div className="md:w-3/5 p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{staff.fullName}</h2>
            <p className="text-base text-gray-600 mb-2">{staff.designation}</p>
            {staff.department ? <p className="text-base text-gray-600 mb-2">{staff.department}</p> : null}
            {staff.subject ? <p className="text-base text-gray-600 mb-2">Subject: {staff.subject}</p> : null}
            {staff.experience ? <p className="text-base text-gray-600 mb-2">Experience: {staff.experience}</p> : null}

            <div className="mt-8">
              <h3 className="font-semibold text-gray-800 mb-3 text-lg">About Teacher</h3>
              <div className="text-gray-700 whitespace-pre-line text-base leading-relaxed">{staff.shortBio || 'No description available.'}</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
