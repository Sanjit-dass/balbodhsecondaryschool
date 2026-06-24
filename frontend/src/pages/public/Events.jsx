import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import { SectionTitle, EventCard } from '../../components/public/SectionComponents';
import TranslateText from '../../components/public/TranslateText';
import { COLORS } from '../../constants/schoolData';
import api from '../../services/api';
import EventModal from '../../components/public/EventModal';
import { useNavigate, useLocation } from 'react-router-dom';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.get('/events-v2/public');
        if (!mounted) return;
        setEvents((res.data && res.data.events) || []);
      } catch (err) {
        console.error('Failed to load events', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const displayEvents = events;

  const navigate = useNavigate();

  // Centralized open: navigate to events page with query so modal opens on main events page
  function openEvent(ev){
    if(!ev || !ev._id) return;
    navigate(`/events?event=${ev._id}`);
  }

  // If URL contains ?event=ID open that event in modal on the main page
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('event');
    let mounted = true;
    if (!id) { setSelectedEvent(null); return; }
    (async () => {
      try {
        const res = await api.get(`/events-v2/${id}`);
        if(!mounted) return;
        const e = res.data || {};
        const photos = (e.photos || []).map(p => ({ url: p.url || p.fileUrl || p.path, publicId: p.publicId || p.public_id || null, caption: p.caption || '' })).filter(Boolean);
        const coverPhoto = e.coverPhoto ? ({ url: e.coverPhoto.url || e.coverPhoto.fileUrl || e.coverPhoto.path, publicId: e.coverPhoto.publicId || e.coverPhoto.public_id || null, caption: e.coverPhoto.caption || '' }) : (photos[0] || null);
        setSelectedEvent({ ...e, photos, coverPhoto });
      } catch (err) {
        console.error('Failed to load event via query param', err);
        setSelectedEvent(null);
      }
    })();
    return () => { mounted = false; };
  }, [location.search]);

  return (
    <TranslateText>
      <div>
      {/* Page Header */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-16 md:py-24"
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Events</h1>
          <p className="text-lg text-blue-100">
            Exciting celebrations and activities throughout the academic year
          </p>
        </div>
      </motion.section>

      {/* Event Filter removed for simpler UI */}

      {/* Events List */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Upcoming Events"
            subtitle="Mark your calendars and don't miss these exciting moments"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {displayEvents.map((event, index) => (
              <div key={event._id || index} className="h-full">
                <EventCard
                  title={event.title}
                  date={event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                  description={event.shortDescription}
                  image={(event.coverPhoto && (event.coverPhoto.url || event.coverPhoto.fileUrl)) || null}
                  delay={index * 0.1}
                  onLearnMore={() => openEvent(event)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
      {selectedEvent && (
        <EventModal event={selectedEvent} onClose={() => { setSelectedEvent(null); navigate('/events'); }} />
      )}

      {/* Event Calendar removed per request */}

      {/* Event Features */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Why Attend Our Events?"
            subtitle="Benefits of participating in school events"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: '🎓',
                title: 'Learning Opportunities',
                description: 'Gain practical knowledge through interactive sessions and competitions',
              },
              {
                icon: '🤝',
                title: 'Community Building',
                description: 'Build strong bonds with peers and create lasting memories',
              },
              {
                icon: '⭐',
                title: 'Showcase Talents',
                description: 'Display your skills and achievements in front of the school community',
              },
              {
                icon: '🏆',
                title: 'Recognition',
                description: 'Earn awards and certificates for outstanding participation',
              },
              {
                icon: '📸',
                title: 'Memorable Moments',
                description: 'Capture beautiful moments that you will cherish forever',
              },
              {
                icon: '💪',
                title: 'Confidence Building',
                description: 'Develop self-confidence and leadership skills through experience',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className="bg-gradient-to-br from-blue-50 to-gray-50 rounded-lg p-8 shadow-lg hover:shadow-xl transition-all text-center"
              >
                <p className="text-5xl mb-3">{feature.icon}</p>
                <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Event Registration CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto px-4 text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Don't Miss Out!
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Be part of exciting events and create unforgettable memories at Bal Bodh Secondary School
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-lg font-bold text-white transition-all text-lg"
              style={{ backgroundColor: COLORS.accent, color: '#000' }}
            >
              Register for Events
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-lg font-bold border-2 border-white text-white hover:bg-white hover:text-blue-900 transition-all text-lg"
            >
              View Calendar
            </motion.button>
          </div>
        </motion.div>
      </section>
    </div>
    </TranslateText>
  );
};

export default Events;
