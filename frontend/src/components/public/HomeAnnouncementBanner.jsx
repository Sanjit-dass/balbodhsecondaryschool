import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaBullhorn, FaArrowRight, FaCalendarAlt } from 'react-icons/fa';
import { useTranslate } from '../../hooks/useTranslate';
import api, { apiBaseURL } from '../../services/api';
import { COLORS } from '../../constants/schoolData';

const HomeAnnouncementBanner = () => {
  const { t } = useTranslate();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let eventSource;
    let isMounted = true;

    const fetchLatestNotice = async () => {
      try {
        const response = await api.get('/notices/public?limit=1');
        if (isMounted) {
          setNotice(response.data.notices?.[0] || null);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to fetch homepage announcement:', err);
        if (isMounted) setError('Unable to load the latest announcement.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLatestNotice();

    if (window.EventSource) {
      try {
        eventSource = new EventSource(`${apiBaseURL}/notices/stream`);
      } catch (e) {
        console.warn('Unable to initialize announcement EventSource:', e);
      }
      eventSource.onmessage = (event) => {
        try {
          const latest = JSON.parse(event.data);
          if (isMounted) {
            setNotice(latest);
          }
        } catch (err) {
          console.error('Failed to parse announcement stream', err);
        }
      };
      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
        }
      };
    }

    return () => {
      isMounted = false;
      if (eventSource) eventSource.close();
    };
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-r from-blue-900 via-blue-700 to-indigo-700 text-white py-4 md:py-6 -mt-2 md:-mt-0 relative z-10"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="w-full bg-white/5 rounded-xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4 md:gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-white shadow-2xl ring-1 ring-white/10">
              <FaBullhorn className="text-2xl md:text-3xl" />
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-blue-100 font-semibold">
                {t("Today's Announcement")}
              </p>
              {loading ? (
                <p className="text-lg md:text-xl font-semibold text-white/95 mt-2">{t('Loading latest news...')}</p>
              ) : error ? (
                <p className="text-lg md:text-xl font-semibold text-red-200 mt-2">{t(error)}</p>
              ) : notice ? (
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: '#FFFFFF', textShadow: '0 1px 0 rgba(0,0,0,0.3)' }}>
                    {t(notice.title)}
                  </h2>
                  <p className="mt-2 text-sm text-blue-100 flex items-center gap-2">
                    <FaCalendarAlt />
                    {new Date(notice.publishedAt || notice.date || Date.now()).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              ) : (
                <p className="text-lg md:text-xl font-semibold text-white/95 mt-2">{t('No announcements available at the moment.')}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6 md:ml-4">
            <Link to="/notice-board" className="inline-flex items-center gap-2 rounded-full bg-white text-blue-900 px-6 py-3 font-semibold shadow-xl hover:bg-white/90 transition border border-white/10">
              {t('View All Notices')} <FaArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default HomeAnnouncementBanner;
