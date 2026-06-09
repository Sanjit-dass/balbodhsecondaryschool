import React from 'react';
import { motion } from 'framer-motion';
import { useTranslate } from '../../hooks/useTranslate';

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
      className="bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-yellow-400 rounded-xl flex items-center justify-center text-white text-xl shadow-md">
          <Icon />
        </div>
        <h3 className="text-xl font-bold text-gray-900">{translatedTitle}</h3>
      </div>
      <p className="text-gray-600 leading-relaxed">{translatedDescription}</p>
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
      className="group rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-white"
    >
      {/* Image Container */}
      <div className="relative h-64 md:h-72 overflow-hidden bg-gray-200">
        <img
          src={`/src/images/${image}`}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Content */}
      <div className="bg-white p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{translatedTitle}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">{translatedDescription}</p>
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
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="bg-white rounded-xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all"
    >
      {/* Stars */}
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-yellow-400 text-lg">
            ★
          </span>
        ))}
      </div>

      {/* Testimonial Text */}
      <p className="text-gray-700 italic mb-6 leading-relaxed">"{translatedText}"</p>

      {/* Author */}
      <div className="flex items-center gap-4">
        <img
          src={`/src/images/${image}`}
          alt={name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div>
          <p className="font-bold text-gray-900">{name}</p>
          <p className="text-sm text-gray-600">{translatedRole}</p>
        </div>
      </div>
    </motion.div>
  );
};

export const EventCard = ({ title, date, description, image, delay }) => {
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
      className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
    >
      {/* Image */}
      <div className="relative h-48 md:h-56 overflow-hidden bg-gray-200 group">
        <img
          src={`/src/images/${image}`}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900 flex-1">{translatedTitle}</h3>
          <span className="text-sm font-semibold text-white px-3 py-1 rounded-full bg-blue-600">
            {date}
          </span>
        </div>
        <p className="text-gray-600 text-sm mb-4">{translatedDescription}</p>
        <button className="text-blue-600 font-semibold hover:text-blue-800 transition">
          {t('Learn More →')}
        </button>
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
      className="group rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all"
    >
      {/* Image Container */}
      <div className="relative h-56 md:h-64 overflow-hidden bg-gray-200">
        <img
          src={`/src/images/${image}`}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

        {/* Count Badge */}
        <div className="absolute bottom-4 left-4 bg-yellow-400 text-black px-4 py-2 rounded-lg font-bold text-lg">
          {count}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{translatedTitle}</h3>
        <p className="text-gray-600 text-sm">{translatedDescription}</p>
      </div>
    </motion.div>
  );
};

export const GalleryImage = ({ image, title, onClick, delay }) => {
  const { t } = useTranslate();
  const translatedTitle = t(title);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl cursor-pointer h-64 md:h-72 bg-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300"
    >
      <img
        src={`/src/images/${image}`}
        alt={title}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-start p-4">
        <p className="text-white font-semibold text-lg">{translatedTitle}</p>
      </div>
    </motion.div>
  );
};

export const StaffCard = ({ name, role, image, department, delay }) => {
  const { t } = useTranslate();
  const translatedRole = t(role);
  const translatedDepartment = t(department);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      whileHover={{ y: -10 }}
      className="group rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all"
    >
      {/* Image */}
      <div className="relative h-72 overflow-hidden bg-gray-200">
        <img
          src={`/src/images/${image}`}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="bg-white p-6 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-1">{name}</h3>
        <p className="text-blue-600 font-semibold mb-2">{translatedRole}</p>
        <p className="text-gray-600 text-sm">{translatedDepartment}</p>
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
      className="bg-white border-l-4 border-blue-600 rounded-lg p-6 shadow-lg hover:shadow-xl transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-900 flex-1">{translatedTitle}</h3>
        <span className="text-xs font-semibold text-white px-3 py-1 rounded-full bg-blue-600 whitespace-nowrap ml-2">
          {translatedCategory}
        </span>
      </div>
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{translatedContent}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{date}</span>
        <button className="text-blue-600 font-semibold hover:text-blue-800 transition text-sm">
          {t('Read More →')}
        </button>
      </div>
    </motion.div>
  );
};
