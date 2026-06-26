import React from 'react';
import { motion } from 'framer-motion';
import { useTranslate } from '../../hooks/useTranslate';
import { Link } from 'react-router-dom';
import { SCHOOL_INFO } from '../../constants/schoolData';
import api from '../../services/api';
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
    <section className="py-16 md:py-20 lg:py-24 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden">
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
        className="max-w-7xl mx-auto px-4 md:px-6 text-center relative z-10"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="inline-block mb-4 md:mb-6"
        >
          <span className="px-4 py-1.5 md:px-6 md:py-2 bg-yellow-400 text-black rounded-full font-bold text-xs md:text-sm">
            {(() => {
              const currentYear = new Date().getFullYear();
              const nextYear = currentYear + 1;
              return `${t('admissionOpen')} ${currentYear}-${nextYear}`;
            })()}
          </span>
        </motion.div>

        <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 md:mb-6 leading-tight">
          {t('Shape Your Child\'s Future')}
        </h2>
        <p className="text-base md:text-lg lg:text-xl xl:text-2xl text-blue-100 mb-8 md:mb-10 lg:mb-12 max-w-3xl mx-auto leading-relaxed px-2">
          {t('Join Bal Bodh Secondary School and embark on a journey of excellence, innovation, and holistic development')}
        </p>

        {/* Features */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 lg:gap-8 mb-8 md:mb-10 lg:mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 md:gap-3 text-white"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                <feature.icon size={16} className="md:size-20" />
              </div>
              <span className="font-medium text-sm md:text-base">{feature.text}</span>
            </motion.div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
          <Link to="/admissions" className="no-underline">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 md:px-8 md:py-4 rounded-full font-bold text-white transition-all text-sm md:text-base lg:text-lg shadow-xl w-full sm:w-auto"
              style={{ backgroundColor: COLORS.accent, color: '#000' }}
            >
              {t('applyNow')}
            </motion.button>
          </Link>

          {/* Brochure CTA - fetch latest published brochure if available */}
          <BrochureCTA />
        </div>
      </motion.div>
    </section>
  );
};

function BrochureCTA(){
  const { t } = useTranslate();
  const [url, setUrl] = React.useState(null);

  React.useEffect(()=>{
    let mounted = true;
    api.get('/brochures/latest').then(res=>{
      if (!mounted) return;
      const item = res?.data?.data;
      if (item && item.fileUrl) setUrl(item.fileUrl);
    }).catch(()=>{});
    return ()=>{ mounted = false; };
  },[]);

  if (url) return (
    <a href={url} target="_blank" rel="noreferrer" className="no-underline">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-6 py-3 md:px-8 md:py-4 rounded-full font-bold border-2 border-white text-white hover:bg-white hover:text-blue-900 transition-all text-sm md:text-base lg:text-lg flex items-center justify-center gap-2 w-full sm:w-auto"
      >
        {t('downloadBrochure')} <FaArrowRight />
      </motion.button>
    </a>
  );

  return (
    <div className="px-4 py-2 md:px-6 md:py-3 lg:px-10 lg:py-4 rounded-full font-bold border-2 border-white text-white bg-white/10 text-xs md:text-sm flex items-center justify-center gap-2">
      {t('downloadBrochure')}: {t('comingSoon') || 'Brochure Coming Soon'}
    </div>
  );
}

export default AdmissionBanner;
