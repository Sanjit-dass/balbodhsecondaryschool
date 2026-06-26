import React from 'react';
import { motion } from 'framer-motion';
import { useTranslate } from '../../hooks/useTranslate';
import { COLORS } from '../../constants/schoolData';
const defaultAvatar = '/images/faculty1.png';
import { getImageUrl } from '../../services/api';

export const SectionTitle = ({ title, subtitle, align = 'center' }) => {
  const { t } = useTranslate();
  const translatedTitle = t(title);
  const translatedSubtitle = subtitle ? t(subtitle) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className={`mb-10 md:mb-14 ${align === 'center' ? 'text-center' : ''}`}
    >
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 md:mb-4" style={{ color: COLORS.dark }}>
        {translatedTitle}
      </h2>
      {subtitle && (
        <p className="text-gray-600 text-base md:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed px-4 md:px-0" style={{ color: COLORS.slate }}>{translatedSubtitle}</p>
      )}
      <div className={`flex mt-4 md:mt-6 ${align === 'center' ? 'justify-center' : 'justify-start'}`}>
        <div className="w-20 md:w-24 h-1.5 rounded-full shadow-lg" style={{ background: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.secondary}, ${COLORS.accent})` }}></div>
      </div>
    </motion.div>
  );
};

export const StatCard = ({ icon: Icon, label, value, delay }) => {
  const { t } = useTranslate();
  const translatedLabel = t(label);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      whileHover={{ y: -10, scale: 1.02 }}
      className="bg-white rounded-2xl p-6 md:p-8 text-center shadow-xl hover:shadow-2xl transition-all duration-300"
      style={{ borderTop: `4px solid ${COLORS.primary}` }}
    >
      <div className="flex justify-center mb-4">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-white text-xl shadow-md" style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})` }}>
  {Icon ? <Icon /> : <span>📘</span>}
</div>
      </div>
      <h3 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: COLORS.dark }}>{value}</h3>
      <p className="font-medium text-base md:text-lg" style={{ color: COLORS.slate }}>{translatedLabel}</p>
    </motion.div>
  );
};

export const FeatureCard = ({ icon: Icon, title, description, delay }) => {
  const { t } = useTranslate();
  const translatedTitle = t(title);
  const translatedDescription = t(description);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group bg-white rounded-xl p-5 md:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border hover:scale-[1.01]"
      style={{ borderColor: COLORS.lightGray }}
    >
      <div className="flex items-center gap-3 md:gap-4 mb-4">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-white text-xl shadow-md flex-shrink-0" style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})` }}>
          <Icon />
        </div>
        <h3 className="text-lg md:text-xl font-bold transition-colors duration-300" style={{ color: COLORS.dark }} className="group-hover:text-blue-600">{translatedTitle}</h3>
      </div>
      <p className="text-sm md:text-base leading-relaxed transition-colors duration-300" style={{ color: COLORS.slate }}>{translatedDescription}</p>
    </motion.div>
  );
};

export const FacilityCard = ({ title, description, image, delay }) => {
  const { t } = useTranslate();
  const translatedTitle = t(title);
  const translatedDescription = t(description);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      whileHover={{ y: -10 }}
      className="group rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-white border hover:scale-[1.02]"
      style={{ borderColor: COLORS.lightGray }}
    >
      {/* Image Container */}
      <div className="relative h-56 md:h-64 lg:h-72 overflow-hidden bg-gray-200">
        <img
          src={typeof image === 'string' && (image.startsWith('http') || image.startsWith('/')) ? image : (image ? `/images/${image}` : '/images/schoolphoto.png')}
          alt={title}
          loading="lazy"
          decoding="async"
          style={{ willChange: 'transform', transform: 'translateZ(0)' }}
          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Content */}
      <div className="bg-white p-5 md:p-6">
        <h3 className="text-lg md:text-xl font-bold mb-2 transition-colors duration-300" style={{ color: COLORS.dark }}>{translatedTitle}</h3>
        <p className="text-sm leading-relaxed transition-colors duration-300" style={{ color: COLORS.slate }}>{translatedDescription}</p>
      </div>
    </motion.div>
  );
};

export const TestimonialCard = ({ name, role, text, image, delay }) => {
  const { t } = useTranslate();
  const translatedRole = t(role);
  const translatedText = t(text);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="rounded-xl p-5 md:p-6 lg:p-8 shadow-lg hover:shadow-2xl transition-transform transform hover:-translate-y-2 h-full flex flex-col bg-white/40 backdrop-blur-md border border-white/10"
    >
      <div className="flex-1 flex flex-col">
        <div className="flex justify-center -mt-10 md:-mt-12 mb-4">
          <img src={`/images/${image}`} alt={name} className="w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full object-cover ring-4 ring-white shadow-md" />
        </div>

        <div className="flex justify-center mb-4">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-lg md:text-xl" style={{ color: COLORS.accent }}>★</span>
          ))}
        </div>

        <blockquote className="italic text-center mb-6 px-2 md:px-6 text-sm md:text-base" style={{ lineHeight: '1.6', color: COLORS.dark }}>{translatedText}</blockquote>

        <div className="mt-auto text-center">
          <p className="font-semibold text-base md:text-lg" style={{ color: COLORS.dark }}>{name}</p>
          <p className="text-sm" style={{ color: COLORS.slate }}>{translatedRole}</p>
        </div>
      </div>
    </motion.div>
  );
};

export const EventCard = ({ title, date, description, image, delay, onLearnMore }) => {
  const { t } = useTranslate();
  const translatedTitle = t(title);
  const translatedDescription = t(description);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border hover:scale-[1.01] flex flex-col h-full"
      style={{ borderColor: COLORS.lightGray }}
    >
      {/* Image */}
      <div className="relative h-44 md:h-48 lg:h-56 overflow-hidden bg-gray-200 group">
        <img
          src={
            typeof image === 'string'
              ? (image.startsWith('http') || image.startsWith('/') ? image : `/images/${image}`)
              : (image && image.url ? image.url : '/images/schoolphoto.png')
          }
          alt={title}
          loading="lazy"
          decoding="async"
          style={{ willChange: 'transform', transform: 'translateZ(0)' }}
          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Content */}
      <div className="p-5 md:p-6 flex flex-col flex-1">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3 gap-2">
            <h3 className="text-base md:text-lg font-bold flex-1 transition-colors duration-300" style={{ color: COLORS.dark }}>{translatedTitle}</h3>
            <span className="text-xs md:text-sm font-semibold text-white px-2 md:px-3 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: COLORS.primary }}>
              {date}
            </span>
          </div>
          <p className="text-sm transition-colors duration-300" style={{ color: COLORS.slate }}>{translatedDescription}</p>
        </div>

        <div className="mt-auto">
          <button onClick={onLearnMore} className="w-full text-center font-semibold transition py-2 text-sm md:text-base" style={{ color: COLORS.secondary }}>
            {t('Learn More →')}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const AchievementCard = ({ title, description, image, count, delay }) => {
  const { t } = useTranslate();
  const translatedTitle = t(title);
  const translatedDescription = t(description);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      whileHover={{ y: -10 }}
      className="group rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border"
      style={{ borderColor: COLORS.lightGray }}
    >
      {/* Image Container */}
      <div className="relative h-48 md:h-56 lg:h-64 overflow-hidden bg-gray-200">
        <img
          src={getImageUrl(image)}
          alt={title}
          loading="lazy"
          decoding="async"
          style={{ willChange: 'transform', transform: 'translateZ(0)' }}
          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

        {/* Count Badge */}
        <div className="absolute bottom-3 md:bottom-4 left-3 md:left-4 text-black px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-base md:text-lg" style={{ backgroundColor: COLORS.accent }}>
          {count}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white p-5 md:p-6">
        <h3 className="text-base md:text-lg font-bold mb-2 transition-colors duration-300" style={{ color: COLORS.dark }}>{translatedTitle}</h3>
        <p className="text-sm transition-colors duration-300" style={{ color: COLORS.slate }}>{translatedDescription}</p>
      </div>
    </motion.div>
  );
};

export const GalleryImage = ({ image, title, category, onClick, delay, size }) => {
  const { t } = useTranslate();
  const isFilename = (s) => !!(s && /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(String(s)));
  const sanitizeName = (s) => {
    if (!s) return '';
    try {
      let name = String(s);
      name = name.split('?')[0].split('#')[0];
      name = name.replace(/\.[^.]+$/, '');
      name = name.replace(/[-_]+/g, ' ');
      name = name.replace(/\s+/g, ' ').trim();
      return name.charAt(0).toUpperCase() + name.slice(1);
    } catch (err) {
      return s;
    }
  };

  const src = getImageUrl(image);
  // prefer explicit title prop, then album/gallery title from image object, else sanitize filename/url
  let displayTitle = title || (image && (image.albumTitle || image.album?.title || image.albumName || image.galleryTitle));
  if (!displayTitle) {
    // try caption or photo-level title
    displayTitle = image && (image.title || image.caption || image.name || image.originalName || image.fileName || image.galleryTitle);
  }
  if (!displayTitle || isFilename(displayTitle)) {
    // fallback to derived name from URL or a generic label
    displayTitle = image && (image.albumTitle || image.album?.title || image.galleryTitle || sanitizeName(image?.filename || image?.publicId || image?.url || image?.path));
  }
  if (!displayTitle) displayTitle = 'Photo';

  const translatedTitle = t(displayTitle);
  const translatedCategory = category ? t(category) : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl cursor-pointer bg-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 border hover:scale-[1.02] ${
        size === 'large' ? 'h-64 md:h-72 lg:h-80 xl:h-96' : 'h-52 md:h-56 lg:h-64'
      }`}
      style={{ borderColor: COLORS.lightGray }}
    >
      <img
        src={src}
        alt={displayTitle}
        loading="lazy"
        decoding="async"
        onError={(e)=>{ e.currentTarget.onerror = null; e.currentTarget.src = '/default-placeholder.png'; }}
        style={{ willChange: 'transform', transform: 'translateZ(0)' }}
        className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-start p-3 md:p-4">
        <div className="backdrop-blur-sm bg-black/40/80 rounded-lg px-3 py-2 md:px-4 md:py-3 transition-all duration-300 transform-gpu">
          <p className="text-white font-semibold text-base md:text-lg leading-tight truncate max-w-[200px] md:max-w-[260px]">{translatedTitle}</p>
          {translatedCategory && (
            <p className="text-white/80 text-xs md:text-sm mt-1">{translatedCategory}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const StaffCard = ({ name, role, image, department, delay, onClick }) => {
  const { t } = useTranslate();
  const translatedRole = t(role);
  const translatedDepartment = department ? t(department) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-transform duration-300 transform bg-white border"
      style={{ borderColor: COLORS.lightGray }}
    >
      {/* Image */}
      <div onClick={onClick} className="cursor-pointer">
        <div className="overflow-hidden rounded-t-lg h-40 md:h-44 lg:h-56 relative bg-gray-100 flex items-center justify-center">
          <img
            src={ image ? (image.startsWith('http') || image.startsWith('/') ? image : `/images/${image}`) : defaultAvatar }
            alt={name}
            loading="lazy"
            decoding="async"
            style={{ willChange: 'transform', transform: 'translateZ(0)' }}
            className="max-h-full max-w-full object-contain object-center transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-5 text-center flex flex-col justify-between">
        <div>
          <h3 className="text-base md:text-lg font-bold mb-1 transition-colors duration-300" style={{ color: COLORS.dark }}>{name}</h3>
          <p className="font-semibold mb-1 text-sm md:text-base" style={{ color: COLORS.secondary }}>{translatedRole}</p>
          {translatedDepartment ? <p className="text-sm" style={{ color: COLORS.slate }}>{translatedDepartment}</p> : null}
        </div>

        <div className="mt-3">
          <button onClick={() => { console.log('StaffCard View More:', name); if (onClick) onClick(); }} className="px-4 py-2 text-white rounded-lg hover:opacity-90 active:scale-95 transition-all text-sm md:text-base" style={{ backgroundColor: COLORS.primary }}>View More →</button>
        </div>
      </div>
    </motion.div>
  );
};

export const NoticeCard = ({ title, date, category, content, delay }) => {
  const { t } = useTranslate();
  const translatedTitle = t(title);
  const translatedCategory = t(category);
  const translatedContent = t(content);

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      whileHover={{ x: 10 }}
      className="bg-white rounded-lg p-4 md:p-6 shadow-lg hover:shadow-xl transition-all group"
      style={{ borderLeft: `4px solid ${COLORS.primary}` }}
    >
      <div className="flex items-start justify-between mb-3 gap-2">
          <h3 className="text-base md:text-lg font-bold flex-1 transition-colors duration-300" style={{ color: COLORS.dark }}>{translatedTitle}</h3>
        <span className="text-xs font-semibold text-white px-2 py-1 md:px-3 md:py-1 rounded-full whitespace-nowrap ml-2" style={{ backgroundColor: COLORS.primary }}>
          {translatedCategory}
        </span>
      </div>
        <p className="text-sm mb-3 line-clamp-2 transition-colors duration-300" style={{ color: COLORS.slate }}>{translatedContent}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: COLORS.slate }}>{date}</span>
        <button className="font-semibold hover:opacity-80 transition text-sm" style={{ color: COLORS.secondary }}>
          {t('Read More →')}
        </button>
      </div>
    </motion.div>
  );
};
