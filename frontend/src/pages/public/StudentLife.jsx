import React from 'react';
import { motion } from 'framer-motion';
import { SectionTitle, EventCard } from '../../components/public/SectionComponents';
import TranslateText from '../../components/public/TranslateText';
import { EVENTS, COLORS } from '../../constants/schoolData';

const StudentLife = () => {
  const activities = [
    {
      category: 'Sports',
      items: ['Football', 'Cricket', 'Basketball', 'Volleyball', 'Athletics', 'Badminton'],
    },
    {
      category: 'Cultural Programs',
      items: ['Annual Function', 'Christmas Celebration', 'Saraswati Puja', 'Cultural Night', 'School Anniversary', 'Independence Day'],
    },
    {
      category: 'Academic Activities',
      items: ['Science Exhibition', 'Math Olympiad', 'Debate Competition', 'Quiz Competition', 'Project Display', 'Academic Awards'],
    },
    {
      category: 'Clubs & Societies',
      items: ['Science Club', 'Literary Club', 'Computer Club', 'Environmental Club', 'Mathematics Club', 'Art Club'],
    },
    {
      category: 'Leadership Programs',
      items: ['Student Council', 'Prefect System', 'Leadership Workshop', 'Mentorship Program', 'Community Service', 'Team Building'],
    },
    {
      category: 'Educational Tours',
      items: ['Historical Sites', 'Science Centers', 'Nature Conservation Areas', 'Industrial Visits', 'Adventure Trips', 'Cultural Heritage Tours'],
    },
  ];

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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Student Life</h1>
          <p className="text-lg text-blue-100">
            Beyond academics - holistic development and memorable experiences
          </p>
        </div>
      </motion.section>

      {/* Life at Balbodh */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Life at Balbodh School"
            subtitle="Comprehensive development through diverse activities"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="rounded-xl overflow-hidden shadow-xl"
            >
              <img
                src="/src/images/picnic.png"
                alt="Student Activities"
                className="w-full h-96 object-cover"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <p className="text-gray-600 leading-relaxed mb-4">
                Student life at Balbodh School extends beyond classrooms. We believe in holistic development that encompasses academic excellence, physical fitness, cultural appreciation, and character building.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                Our diverse range of activities provides students with opportunities to discover their talents, develop leadership skills, build confidence, and create lifelong friendships.
              </p>
              <ul className="space-y-3">
                {[
                  'Encouraging participation in sports and wellness',
                  'Promoting cultural and artistic expression',
                  'Developing leadership and responsibility',
                  'Building teamwork and collaboration',
                  'Creating inclusive and supportive community',
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3 text-gray-600"
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS.secondary }}
                    ></span>
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Activities Categories */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Student Activities & Clubs"
            subtitle="Diverse opportunities for growth and exploration"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {activities.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-all border-t-4"
                style={{ borderTopColor: COLORS.secondary }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">{activity.category}</h3>
                <ul className="space-y-2">
                  {activity.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center gap-2 text-gray-600">
                      <span className="text-blue-600">→</span> {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Upcoming Events"
            subtitle="Exciting activities and celebrations"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {EVENTS.map((event, index) => (
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

      {/* Student Testimonials */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-blue-50 to-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Student Testimonials"
            subtitle="What students say about their experience at Balbodh"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                name: 'Rahul Sharma',
                class: 'Class 10',
                text: 'Balbodh School has been instrumental in my growth. The teachers are supportive, the facilities are excellent, and the environment encourages learning and fun together.',
              },
              {
                name: 'Neha Poudel',
                class: 'Class 12',
                text: 'I love the diverse activities and clubs here. I\'ve developed leadership skills through the student council and made lifelong friends.',
              },
              {
                name: 'Anil Adhikari',
                class: 'Class 9',
                text: 'The sports program at Balbodh is amazing! I\'ve improved my cricket skills and learned the importance of teamwork and discipline.',
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-lg p-8 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-gray-700 italic mb-6">"{testimonial.text}"</p>
                <div>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.class}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Hostel Life */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Hostel Facilities"
            subtitle="Comfortable living environment for boarding students"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="rounded-lg overflow-hidden shadow-xl"
            >
              <img
                src="/src/images/picnic3.png"
                alt="Hostel"
                className="w-full h-96 object-cover"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Safe & Comfortable Living</h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                Our boarding facilities provide a safe, secure, and nurturing environment for students. Modern hostels with comfortable rooms, nutritious meals, and 24/7 supervision ensure students feel at home.
              </p>
              <ul className="space-y-3">
                {[
                  'Separate boys and girls hostels',
                  'Well-maintained rooms with modern amenities',
                  'Nutritious breakfast, lunch, and dinner',
                  'Study halls and recreational areas',
                  'Experienced wardens and support staff',
                  '24/7 security and medical assistance',
                  'Washing and laundry facilities',
                  'Regular recreational activities',
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3 text-gray-600"
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS.accent }}
                    ></span>
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Achievements Gallery */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Student Achievements"
            subtitle="Celebrating success and excellence"
          />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { image: 'topper1.png', title: 'Top Scorers' },
              { image: 'winner1.png', title: 'Sports Winners' },
              { image: 'writtingcomp2.png', title: 'Competition Winners' },
              { image: 'projectclass10.png', title: 'Project Display' },
              { image: 'chrismass1.png', title: 'Annual Function' },
              { image: 'topper2.png', title: 'Toppers' },
              { image: 'weekactivities1.png', title: 'Activities' },
              { image: 'winner4.png', title: 'Trophy Winners' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="group relative overflow-hidden rounded-lg h-48 md:h-56 cursor-pointer"
              >
                <img
                  src={`/src/images/${item.image}`}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/70 transition-all duration-300 flex items-center justify-center">
                  <p className="text-white font-semibold text-center">{item.title}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Get Involved CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto px-4 text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Join Our Vibrant Community
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Experience the excitement, friendship, and growth that await you at Balbodh Secondary School
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 rounded-lg font-bold text-white transition-all text-lg"
            style={{ backgroundColor: COLORS.accent, color: '#000' }}
          >
            Apply Now
          </motion.button>
        </motion.div>
      </section>
    </div>
    </TranslateText>
  );
};

export default StudentLife;
