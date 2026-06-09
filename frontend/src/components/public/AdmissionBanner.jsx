import React from 'react';
import { motion } from 'framer-motion';
import { useTranslate } from '../../hooks/useTranslate';
import { FaGraduationCap, FaBook, FaUsers, FaArrowRight } from 'react-icons/fa';
import { COLORS } from '../../constants/schoolData';

const AdmissionBanner = () => {
  const { t } = useTranslate();

  const features = [
    { icon: FaGraduationCap, text: t('Quality Education') },
    { icon: FaBook, text: t('Modern Curriculum') },
    { icon: FaUsers, text: t('Expert Faculty') },
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-400 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto px-4 text-center relative z-10"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="inline-block mb-6"
        >
          <span className="px-6 py-2 bg-yellow-400 text-black rounded-full font-bold text-sm">
            {t('Admission Open 2024-2025')}
          </span>
        </motion.div>

        <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          {t('Shape Your Child\'s Future')}
        </h2>
        <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
          {t('Join Bal Bodh Secondary School and embark on a journey of excellence, innovation, and holistic development')}
        </p>

        {/* Features */}
        <div className="flex flex-wrap justify-center gap-8 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              viewport={{ once: true }}
              className="flex items-center gap-3 text-white"
            >
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <feature.icon size={20} />
              </div>
              <span className="font-medium">{feature.text}</span>
            </motion.div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 rounded-full font-bold text-white transition-all text-lg shadow-xl"
            style={{ backgroundColor: COLORS.accent, color: '#000' }}
          >
            {t('Apply Now')}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 rounded-full font-bold border-2 border-white text-white hover:bg-white hover:text-blue-900 transition-all text-lg flex items-center justify-center gap-2"
          >
            {t('Download Brochure')} <FaArrowRight />
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
};

export default AdmissionBanner;
