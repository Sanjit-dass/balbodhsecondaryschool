import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaBullhorn, FaArrowRight, FaCalendarAlt } from 'react-icons/fa';
import { useTranslate } from '../../hooks/useTranslate';
import api from '../../services/api';
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
      eventSource = new EventSource(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notices/stream`);
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
      className="bg-gradient-to-r from-blue-900 via-blue-700 to-indigo-700 text-white py-6"
    >
      <div className="max-w-7xl mx-auto px-4 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white shadow-lg">
            <FaBullhorn className="text-2xl" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-blue-200 font-semibold">
              {t("Today's Announcement")}
            </p>
            {loading ? (
              <p className="text-lg md:text-xl font-semibold text-white/90 mt-2">{t('Loading latest news...')}</p>
            ) : error ? (
              <p className="text-lg md:text-xl font-semibold text-red-200 mt-2">{t(error)}</p>
            ) : notice ? (
              <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
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
              <p className="text-lg md:text-xl font-semibold text-white/90 mt-2">{t('No announcements available at the moment.')}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/notice-board" className="inline-flex items-center gap-2 rounded-full bg-white text-blue-900 px-6 py-3 font-semibold shadow-lg hover:bg-blue-50 transition">
            {t('View All Notices')} <FaArrowRight />
          </Link>
        </div>
      </div>
    </motion.section>
  );
};

export default HomeAnnouncementBanner;
