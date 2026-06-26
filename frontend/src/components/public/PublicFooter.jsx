import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFacebook,
  FaTwitter,
  FaYoutube,
  FaInstagram,
  FaArrowUp,
} from 'react-icons/fa';
import { SCHOOL_INFO, COLORS } from '../../constants/schoolData';
import { useTranslate } from '../../hooks/useTranslate';

const PublicFooter = () => {
  const { t } = useTranslate();
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerSections = [
    {
      titleKey: 'quickLinks',
      links: [
        { labelKey: 'home', path: '/' },
        { labelKey: 'about_footer', path: '/about' },
        { labelKey: 'academics', path: '/academics' },
        { labelKey: 'admissions', path: '/admissions' },
      ],
    },
    {
      titleKey: 'facilities',
      links: [
        { labelKey: 'viewAll', path: '/facilities' },
        { labelKey: 'laboratory', path: '/facilities' },
        { labelKey: 'sports', path: '/facilities' },
        { labelKey: 'library', path: '/facilities' },
      ],
    },
    {
      titleKey: 'information',
      links: [
        { labelKey: 'noticeBoard', path: '/notice-board' },
        { labelKey: 'events', path: '/events' },
        { labelKey: 'gallery', path: '/gallery' },
        { labelKey: 'staff', path: '/staff' },
      ],
    },
  ];

  return (
    <footer id="contact" className="bg-gradient-to-b from-gray-900 to-black text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* About Section - Premium School Branding */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <Link to="/" className="flex items-center gap-3 mb-5 hover:opacity-90 transition-opacity group">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-lg opacity-40" style={{ backgroundColor: COLORS.accent }}></div>
                <img
                  src="/logo.png"
                  alt="Bal Bodh Secondary School Logo"
                  className="relative h-14 w-14 rounded-full object-contain shadow-lg"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                  {SCHOOL_INFO.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${COLORS.accent}20`, color: COLORS.accent }}>
                    Est. {SCHOOL_INFO.established}
                  </span>
                </div>
              </div>
            </Link>
            
            <p className="text-gray-300 text-sm mb-4 font-medium tracking-wide">{t(SCHOOL_INFO.tagline)}</p>

            {/* Contact Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <FaPhone className="flex-shrink-0" style={{ color: COLORS.accent }} />
                <a href={`tel:${SCHOOL_INFO.phone}`} className="hover:text-white transition-colors">
                  {SCHOOL_INFO.phone}
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <FaEnvelope className="flex-shrink-0" style={{ color: COLORS.accent }} />
                <a href={`mailto:${SCHOOL_INFO.email}`} className="hover:text-white transition-colors break-all">
                  {SCHOOL_INFO.email}
                </a>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-2">
              {[
                SCHOOL_INFO.facebook ? { icon: FaFacebook, url: SCHOOL_INFO.facebook } : null,
                SCHOOL_INFO.twitter ? { icon: FaTwitter, url: SCHOOL_INFO.twitter } : null,
                SCHOOL_INFO.youtube ? { icon: FaYoutube, url: SCHOOL_INFO.youtube } : null,
                SCHOOL_INFO.instagram ? { icon: FaInstagram, url: SCHOOL_INFO.instagram } : null,
              ].filter(Boolean).map((social, index) => (
                <motion.a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg"
                  style={{ 
                    backgroundColor: `${COLORS.white}10`,
                    border: `1px solid ${COLORS.white}20`
                  }}
                >
                  <social.icon size={16} style={{ color: COLORS.accent }} />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          {footerSections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <h4 className="font-bold text-lg mb-4" style={{ color: COLORS.accent }}>
                {t(section.titleKey)}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      to={link.path}
                      className="text-gray-400 hover:text-white transition-colors duration-300 text-sm"
                    >
                      → {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h4 className="font-bold text-lg mb-4" style={{ color: COLORS.accent }}>
              {t('contactTitle')}
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <FaMapMarkerAlt
                  className="mt-1 flex-shrink-0"
                  style={{ color: COLORS.secondary }}
                />
                <span className="text-gray-400 text-sm">{SCHOOL_INFO.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <FaPhone
                  className="flex-shrink-0"
                  style={{ color: COLORS.secondary }}
                />
                <a
                  href={`tel:${SCHOOL_INFO.phone}`}
                  className="text-gray-400 hover:text-white transition text-sm"
                >
                  {SCHOOL_INFO.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <FaEnvelope
                  className="flex-shrink-0"
                  style={{ color: COLORS.secondary }}
                />
                <a
                  href={`mailto:${SCHOOL_INFO.email}`}
                  className="text-gray-400 hover:text-white transition text-sm break-all"
                >
                  {SCHOOL_INFO.email}
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        

        {/* Bottom Bar - Centered Professional Layout */}
        <div className="border-t border-gray-800 pt-6 md:pt-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center space-y-4 md:space-y-5 px-4"
          >
            {/* Copyright */}
            <p className="text-gray-300 text-xs md:text-sm font-medium">© 2026 Bal Bodh Secondary School. All Rights Reserved.</p>
            
            {/* ERP Tagline */}
            <p className="text-gray-400 text-xs md:text-sm tracking-wide">School ERP • Educational Technology Solutions</p>

            {/* Developer Credits */}
            <div className="pt-2 md:pt-3">
              <p className="text-gray-400 text-xs md:text-sm mb-3">Designed &amp; Developed by</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 text-xs md:text-sm">
                <a
                  href="https://portfolio-sanjit.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-full transition-all duration-300 hover:scale-105"
                  style={{ backgroundColor: `${COLORS.white}15`, border: `1px solid ${COLORS.white}20` }}
                >
                  <span className="text-lg">👨‍💻</span>
                  <span className="font-semibold text-white group-hover:text-white/90 text-sm md:text-base">Sanjit Das</span>
                </a>
                <span className="text-white/40 text-xl font-light">&</span>
                <a
                  href="https://puspendra-portfolio.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-full transition-all duration-300 hover:scale-105"
                  style={{ backgroundColor: `${COLORS.white}15`, border: `1px solid ${COLORS.white}20` }}
                >
                  <span className="text-lg">👨‍💻</span>
                  <span className="font-semibold text-white group-hover:text-white/90 text-sm md:text-base">Puspendra Birajee</span>
                </a>
              </div>
            </div>

            {/* Scroll to Top Button */}
            <div className="pt-3 md:pt-4">
              <motion.button
                onClick={scrollToTop}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all mx-auto shadow-lg"
                style={{ backgroundColor: COLORS.secondary }}
                aria-label="Scroll to top"
              >
                <FaArrowUp size={20} className="md:size-18" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
