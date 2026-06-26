import React from 'react';
import { motion } from 'framer-motion';
import { FaWhatsapp } from 'react-icons/fa';
import { COLORS } from '../../constants/schoolData';

const WhatsAppFloat = () => {
  const number = '9779852860773';
  const message = 'Hello Bal Bodh Secondary School, I would like to know more about admissions.';
  const encoded = encodeURIComponent(message);
  const href = `https://wa.me/${number}?text=${encoded}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Bal Bodh on WhatsApp"
      className="z-50"
    >
      <motion.div
        initial={{ scale: 1 }}
        whileHover={{ scale: 1.06, rotate: -6 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        className="fixed bottom-4 right-4 md:bottom-8 md:right-8 w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center shadow-xl"
        style={{
          background: 'linear-gradient(135deg,#25D366,#128C7E)',
          boxShadow: '0 8px 24px rgba(18,140,126,0.28)',
        }}
      >
        <FaWhatsapp size={20} className="md:size-22 lg:size-22" color="#fff" />
      </motion.div>
    </a>
  );
};

export default WhatsAppFloat;
