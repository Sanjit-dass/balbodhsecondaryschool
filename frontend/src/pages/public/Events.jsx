import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import { SectionTitle, EventCard } from '../../components/public/SectionComponents';
import TranslateText from '../../components/public/TranslateText';
import { EVENTS, COLORS } from '../../constants/schoolData';

const Events = () => {
  const [eventFilter, setEventFilter] = useState('upcoming');

  const allEvents = [
    ...EVENTS,
    { title: 'Orientation Program', date: 'August 2024', description: 'Introduction for new students', image: 'schoolphoto.png' },
    { title: 'Parents Meet', date: 'September 2024', description: 'Interaction between parents and staff', image: 'schoolphoto2.png' },
  ];

  const upcomingEvents = allEvents;
  const pastEvents = allEvents.slice(0, 2);

  const displayEvents = eventFilter === 'upcoming' ? upcomingEvents : pastEvents;

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

      {/* Event Filter */}
      <section className="py-8 bg-gradient-to-r from-blue-50 to-gray-50 sticky top-32 md:top-40 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center gap-4">
            {['upcoming', 'past'].map((filter, index) => (
              <motion.button
                key={filter}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => setEventFilter(filter)}
                className={`px-8 py-2 rounded-full font-semibold transition-all ${
                  eventFilter === filter
                    ? 'text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 border border-gray-300 hover:shadow-md'
                }`}
                style={{
                  backgroundColor: eventFilter === filter ? COLORS.secondary : '',
                }}
              >
                {filter === 'upcoming' ? 'Upcoming Events' : 'Past Events'}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Events List */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title={eventFilter === 'upcoming' ? 'Upcoming Events' : 'Past Events'}
            subtitle="Mark your calendars and don't miss these exciting moments"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {displayEvents.map((event, index) => (
              <EventCard
                key={index}
                title={event.title}
                date={event.date}
                description={event.description}
                image={event.image}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Event Calendar */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Annual Calendar"
            subtitle="Important dates and events for the academic year"
          />

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-900 to-blue-700 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-bold">Month</th>
                  <th className="px-6 py-4 text-left font-bold">Event</th>
                  <th className="px-6 py-4 text-left font-bold">Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { month: 'April - June', event: 'Admissions', description: 'Rolling admissions for new students' },
                  { month: 'July', event: 'Academic Year Begins', description: 'Classes commence' },
                  { month: 'August', event: 'Orientation', description: 'New student orientation program' },
                  { month: 'September', event: 'Sports Day', description: 'Inter-house sports competitions' },
                  { month: 'October', event: 'Science Fair', description: 'Student science projects exhibition' },
                  { month: 'November', event: 'Annual Function', description: 'Grand celebration of talent' },
                  { month: 'December', event: 'Holidays', description: 'Winter vacation begins' },
                  { month: 'January', event: 'Republic Day', description: 'National celebration' },
                  { month: 'February', event: 'Mid-Term', description: 'Examination period' },
                  { month: 'March', event: 'Final Exams', description: 'Annual examinations' },
                ].map((item, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    viewport={{ once: true }}
                    className="border-b border-gray-200 hover:bg-blue-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900">{item.month}</td>
                    <td className="px-6 py-4 font-semibold text-blue-600">{item.event}</td>
                    <td className="px-6 py-4 text-gray-600">{item.description}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

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
