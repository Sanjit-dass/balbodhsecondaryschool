import React from 'react';
import { motion } from 'framer-motion';
import { useTranslate } from '../../hooks/useTranslate';

const AcademicExcellenceCard = ({ title, description, image, stats, color, delay }) => {
  const { t } = useTranslate();
  const translatedTitle = t(title);
  const translatedDescription = t(description);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      whileHover={{ y: -10, scale: 1.02 }}
      className="group bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300"
    >
      {/* Image Header */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={`/src/images/${image}`}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${color} opacity-80`} />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-bold text-white">{translatedTitle}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <p className="text-gray-600 mb-6 leading-relaxed">{translatedDescription}</p>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(stats).map(([key, value], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: delay + 0.2 + index * 0.1 }}
              viewport={{ once: true }}
              className="text-center p-3 bg-gray-50 rounded-lg"
            >
              <div className={`text-2xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                {value}
              </div>
              <div className="text-xs text-gray-500 capitalize mt-1">{t(key)}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default AcademicExcellenceCard;
