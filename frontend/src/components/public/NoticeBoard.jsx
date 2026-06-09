import React from 'react';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaTag, FaArrowRight } from 'react-icons/fa';
import { useTranslate } from '../../hooks/useTranslate';
import { NOTICES, COLORS } from '../../constants/schoolData';

const NoticeBoard = () => {
  const { t } = useTranslate();

  const categoryColors = {
    Admissions: 'bg-blue-600',
    Holidays: 'bg-green-600',
    Events: 'bg-purple-600',
    General: 'bg-gray-600',
  };

  return (
    <div className="space-y-4 mb-8">
      {NOTICES.slice(0, 3).map((notice, index) => (
        <motion.div
          key={notice.id}
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          viewport={{ once: true }}
          whileHover={{ x: 10 }}
          className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all"
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-bold text-gray-900 flex-1 pr-4">{t(notice.title)}</h3>
            <span className={`text-xs font-semibold text-white px-4 py-2 rounded-full ${categoryColors[notice.category] || categoryColors['General']} whitespace-nowrap`}>
              {t(notice.category)}
            </span>
          </div>
          <p className="text-gray-600 mb-4 leading-relaxed">{t(notice.content)}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <FaCalendarAlt />
              <span>{t(notice.date)}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-800 transition"
            >
              {t('Read More')} <FaArrowRight size={12} />
            </motion.button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default NoticeBoard;
