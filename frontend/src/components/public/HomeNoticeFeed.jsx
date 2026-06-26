import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SectionTitle, NoticeCard } from './SectionComponents';
import api, { apiBaseURL } from '../../services/api';
import { COLORS } from '../../constants/schoolData';

const HomeNoticeFeed = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let eventSource;

    const fetchNotices = async () => {
      try {
        const response = await api.get('/notices/public');
        setNotices(response.data.notices || []);
        setError(null);
      } catch (err) {
        console.error('Home notices fetch error:', err);
        setError('Unable to load live notices.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();

    if (window.EventSource) {
      try {
        eventSource = new EventSource(`${apiBaseURL}/notices/stream`);
      } catch (e) {
        console.warn('Unable to initialize notices EventSource:', e);
      }
      eventSource.onmessage = (event) => {
        try {
          const notice = JSON.parse(event.data);
          setNotices((prev) => [notice, ...prev.filter((item) => item._id !== notice._id)]);
        } catch (e) {
          console.error('Failed to parse notice stream', e);
        }
      };
      eventSource.onerror = () => {
        if (eventSource) eventSource.close();
      };
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const visibleNotices = notices.slice(0, 3);

  return (
    <section className="py-12 md:py-16 lg:py-20 xl:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <SectionTitle
          title="Latest Notices"
          subtitle="Live school announcements delivered directly from the backend"
        />

        {loading ? (
          <div className="text-center py-12 md:py-16">
            <p className="text-base md:text-lg font-semibold text-gray-700">Loading latest notices...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 md:py-16">
            <p className="text-base md:text-lg font-semibold text-rose-600">{error}</p>
          </div>
        ) : visibleNotices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {visibleNotices.map((notice, index) => (
              <NoticeCard
                key={notice._id || notice.id || index}
                title={notice.title || notice.heading || 'Notice'}
                date={new Date(notice.publishedAt || notice.date || notice.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                category={notice.category || 'General'}
                content={notice.body || notice.content || notice.description || ''}
                delay={index * 0.05}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 md:py-16">
            <p className="text-base md:text-lg font-semibold text-gray-600">No live notices are available at the moment.</p>
          </div>
        )}

        <div className="mt-8 md:mt-10 text-center">
          <Link to="/notice-board">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 md:px-8 md:py-4 rounded-full font-bold text-white transition-all inline-flex items-center gap-2 text-sm md:text-base lg:text-lg shadow-xl"
              style={{ backgroundColor: COLORS.primary }}
            >
              View All Notices
            </motion.button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeNoticeFeed;
