import React from 'react';
import { motion } from 'framer-motion';
import { useTranslate } from '../../hooks/useTranslate';
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
      className={`mb-12 ${align === 'center' ? 'text-center' : ''}`}
    >
      <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
        {translatedTitle}
      </h2>
      {subtitle && (
        <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">{translatedSubtitle}</p>
      )}
      <div className={`flex mt-6 ${align === 'center' ? 'justify-center' : 'justify-start'}`}>
        <div className="w-24 h-1.5 bg-gradient-to-r from-blue-600 via-blue-500 to-yellow-400 rounded-full shadow-lg"></div>
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
      className="bg-white rounded-2xl p-8 text-center shadow-xl border-t-4 border-blue-600 hover:shadow-2xl transition-all duration-300"
    >
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-yellow-400 rounded-xl flex items-center justify-center text-white text-xl shadow-md">
  {Icon ? <Icon /> : <span>📘</span>}
</div>
      </div>
      <h3 className="text-4xl font-bold text-gray-900 mb-2">{value}</h3>
      <p className="text-gray-600 font-medium text-lg">{translatedLabel}</p>
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
      className="group bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 hover:scale-[1.01]"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-yellow-400 rounded-xl flex items-center justify-center text-white text-xl shadow-md">
          <Icon />
        </div>
        <h3 className="text-xl font-bold text-gray-900 transition-colors duration-300 group-hover:text-blue-600">{translatedTitle}</h3>
      </div>
      <p className="text-gray-600 leading-relaxed transition-colors duration-300 group-hover:text-gray-700">{translatedDescription}</p>
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
      className="group rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-white border border-gray-100 hover:border-blue-200 hover:scale-[1.02]"
    >
      {/* Image Container */}
      <div className="relative h-64 md:h-72 overflow-hidden bg-gray-200">
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
      <div className="bg-white p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 transition-colors duration-300 group-hover:text-blue-600">{translatedTitle}</h3>
        <p className="text-gray-600 text-sm leading-relaxed transition-colors duration-300 group-hover:text-gray-700">{translatedDescription}</p>
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
      className="rounded-xl p-6 md:p-8 shadow-lg hover:shadow-2xl transition-transform transform hover:-translate-y-2 h-full flex flex-col bg-white/40 backdrop-blur-md border border-white/10"
    >
      <div className="flex-1 flex flex-col">
        <div className="flex justify-center -mt-12 mb-4">
          <img src={`/images/${image}`} alt={name} className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover ring-4 ring-white shadow-md" />
        </div>

        <div className="flex justify-center mb-4">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-yellow-400 text-xl">★</span>
          ))}
        </div>

        <blockquote className="text-gray-800 italic text-center mb-6 px-2 md:px-6" style={{ lineHeight: '1.6' }}>{translatedText}</blockquote>

        <div className="mt-auto text-center">
          <p className="font-semibold text-gray-900">{name}</p>
          <p className="text-sm text-gray-600">{translatedRole}</p>
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
      className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-50 hover:border-blue-100 hover:scale-[1.01] flex flex-col h-full"
    >
      {/* Image */}
      <div className="relative h-48 md:h-56 overflow-hidden bg-gray-200 group">
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
      <div className="p-6 flex flex-col flex-1">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900 flex-1 transition-colors duration-300 group-hover:text-blue-600">{translatedTitle}</h3>
            <span className="text-sm font-semibold text-white px-3 py-1 rounded-full bg-blue-600 ml-4">
              {date}
            </span>
          </div>
          <p className="text-gray-600 text-sm transition-colors duration-300 group-hover:text-gray-700">{translatedDescription}</p>
        </div>

        <div className="mt-auto">
          <button onClick={onLearnMore} className="w-full text-center text-blue-600 font-semibold hover:text-blue-800 transition py-2">
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
      className="group rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all border border-gray-50 hover:border-blue-100"
    >
      {/* Image Container */}
      <div className="relative h-56 md:h-64 overflow-hidden bg-gray-200">
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
        <div className="absolute bottom-4 left-4 bg-yellow-400 text-black px-4 py-2 rounded-lg font-bold text-lg">
          {count}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2 transition-colors duration-300 group-hover:text-blue-600">{translatedTitle}</h3>
        <p className="text-gray-600 text-sm transition-colors duration-300 group-hover:text-gray-700">{translatedDescription}</p>
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
      className={`group relative overflow-hidden rounded-xl cursor-pointer bg-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 hover:scale-[1.02] ${
        size === 'large' ? 'h-72 md:h-80 lg:h-96' : 'h-64 md:h-72'
      }`}
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-start p-4">
        <div className="backdrop-blur-sm bg-black/40/80 rounded-lg px-4 py-3 transition-all duration-300 transform-gpu">
          <p className="text-white font-semibold text-lg leading-tight truncate max-w-[260px]">{translatedTitle}</p>
          {translatedCategory && (
            <p className="text-white/80 text-sm mt-1">{translatedCategory}</p>
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
      className="group rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-transform duration-300 transform bg-white border border-gray-100 hover:border-blue-200"
    >
      {/* Image */}
      <div onClick={onClick} className="cursor-pointer">
        <div className="overflow-hidden rounded-t-lg h-44 md:h-56 relative bg-gray-100 flex items-center justify-center">
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
      <div className="p-4 text-center flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1 transition-colors duration-300 group-hover:text-blue-600">{name}</h3>
          <p className="text-blue-600 font-semibold mb-1">{translatedRole}</p>
          {translatedDepartment ? <p className="text-gray-600 text-sm">{translatedDepartment}</p> : null}
        </div>

        <div className="mt-3">
          <button onClick={() => { console.log('StaffCard View More:', name); if (onClick) onClick(); }} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">View More →</button>
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
      className="bg-white border-l-4 border-blue-600 rounded-lg p-6 shadow-lg hover:shadow-xl transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900 flex-1 transition-colors duration-300 group-hover:text-blue-600">{translatedTitle}</h3>
        <span className="text-xs font-semibold text-white px-3 py-1 rounded-full bg-blue-600 whitespace-nowrap ml-2">
          {translatedCategory}
        </span>
      </div>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 transition-colors duration-300 group-hover:text-gray-700">{translatedContent}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{date}</span>
        <button className="text-blue-600 font-semibold hover:text-blue-800 transition text-sm">
          {t('Read More →')}
        </button>
      </div>
    </motion.div>
  );
};
