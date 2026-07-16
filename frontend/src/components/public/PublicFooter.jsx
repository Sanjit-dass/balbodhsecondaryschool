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
          {/* About Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <Link to="/" className="flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity">
              <img
                src="/logo.png"
                alt="Bal Bodh Secondary School Logo"
                className="h-12 w-12 rounded-lg object-contain"
              />
              <h3 className="text-lg font-bold">{SCHOOL_INFO.name}</h3>
            </Link>
            <p className="text-gray-400 text-sm mb-4">{t(SCHOOL_INFO.tagline)}</p>
            <p className="text-gray-400 text-xs leading-relaxed mb-4">
              {t(SCHOOL_INFO.about)}
            </p>
            <div className="flex gap-3">
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
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{ backgroundColor: COLORS.secondary }}
                >
                  <social.icon size={18} />
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
        <div className="border-t border-gray-800 pt-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center space-y-3 px-4"
          >
            <p className="text-gray-300 text-sm">© 2026 Bal Bodh Secondary School. All Rights Reserved.</p>
            <p className="text-gray-400 text-sm">School ERP • Educational Technology Solutions</p>

            <div className="pt-2">
              <p className="text-gray-400 text-sm">Designed &amp; Developed by</p>
              <p className="mt-1 flex items-center justify-center gap-3 text-sm">
                <a
                  href="https://sanjitdas.com.np/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open Sanjit Das portfolio in new tab"
                  className="font-semibold hover:underline transition-colors duration-200"
                  style={{ color: COLORS.accent }}
                >
                  Sanjit Das
                </a>
                <span className="text-gray-500">&amp;</span>
                <a
                  href="https://puspendra-portfolio.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open Puspendra Birajee portfolio in new tab"
                  className="font-semibold hover:underline transition-colors duration-200"
                  style={{ color: COLORS.accent }}
                >
                  Puspendra Birajee
                </a>
              </p>
            </div>

            <div className="pt-3">
              <motion.button
                onClick={scrollToTop}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.96 }}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all mx-auto"
                style={{ backgroundColor: COLORS.secondary }}
                aria-label="Scroll to top"
              >
                <FaArrowUp size={18} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
