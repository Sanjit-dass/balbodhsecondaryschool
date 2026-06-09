import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslate } from '../../hooks/useTranslate';

import {
  FaUsers,
  FaChalkboardTeacher,
  FaSchool,
  FaTrophy,
  FaAward,
  FaCalendar,
  FaArrowRight,
  FaBook,
  FaFlask,
  FaUserShield,   // ✅ keep
  FaShieldAlt,    // optional (keep only one if not needed)
  FaLaptop,
  FaMedal,
} from 'react-icons/fa';
import TranslateText from '../../components/public/TranslateText';


import {
  SectionTitle,
  StatCard,
  FeatureCard,
  FacilityCard,
  TestimonialCard,
  EventCard,
  AchievementCard,
  GalleryImage,
  StaffCard,
} from '../../components/public/SectionComponents';
import HeroSlider from '../../components/public/HeroSlider';
import AcademicExcellenceCard from '../../components/public/AcademicExcellenceCard';
import HomeAnnouncementBanner from '../../components/public/HomeAnnouncementBanner';
import HomeNoticeFeed from '../../components/public/HomeNoticeFeed';
import EventCarousel from '../../components/public/EventCarousel';
import AdmissionBanner from '../../components/public/AdmissionBanner';
import StatisticsCounter from '../../components/public/StatisticsCounter';

import {
  SCHOOL_INFO,
  COLORS,
  STATISTICS,
  WHY_CHOOSE,
  FACILITIES,
  TESTIMONIALS,
  ACHIEVEMENTS,
  GALLERY_IMAGES,
  ACADEMIC_EXCELLENCE,
  STAFF,
} from '../../constants/schoolData';

const Home = () => {
    const { t } = useTranslate();
    const [showMessage, setShowMessage] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState('all');
  const filteredGallery = galleryFilter === 'all'
    ? GALLERY_IMAGES.slice(0, 6)
    : GALLERY_IMAGES.filter(img => img.category === galleryFilter).slice(0, 6);

  const iconMap = {
    FaUsers,
    FaChalkboardTeacher,
    FaSchool,
    FaTrophy,
    FaAward,
    FaCalendar,
  };

  const featureIconMap = {
  FaBook,
  FaChalkboardTeacher,
  FaFlask,
  FaShieldAlt,
  FaLaptop,
  FaMedal,
};


  return (
    <TranslateText>
      <div>
      {/* Announcement Banner */}
      <HomeAnnouncementBanner />

      {/* Hero Section with Premium Image Slider */}
      <HeroSlider />

      {/* School Introduction Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/src/images/schoolphoto.png"
                  alt="School Campus"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              {/* Floating Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
                className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-xl p-6"
              >
                <div className="text-3xl font-bold text-blue-600">{SCHOOL_INFO.established}</div>
                <div className="text-sm text-gray-600">Years of Excellence</div>
              </motion.div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {t('Welcome to Bal Bodh Secondary School')}
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {t('Founded in 2055, Bal Bodh Secondary School has been a beacon of excellence in education. We are committed to nurturing young minds, fostering intellectual growth, and developing well-rounded individuals who can contribute positively to society.')}
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                {t('Our state-of-the-art facilities, experienced faculty, and comprehensive curriculum ensure that every student receives the best possible education in a supportive and inclusive environment.')}
              </p>
              <Link to="/about">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 rounded-full font-bold text-white transition-all flex items-center gap-2 text-lg shadow-xl"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  {t('Read More About Us')} <FaArrowRight />
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Principal's Message Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-blue-50 via-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Principal Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="order-1 lg:order-1"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/src/images/principal.png"
                  alt="Principal"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-bold text-blue-200">Sanjay Khadga</h3>
                  <p className="text-blue-200">Principal</p>
                </div>
              </div>
            </motion.div>

            {/* Message Content */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="order-2 lg:order-2"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                {t("Principal's Message")}
              </h2>
              <div className="w-20 h-1.5 bg-gradient-to-r from-blue-600 to-yellow-400 rounded-full mb-8" />
              <p className="text-xl text-gray-700 leading-relaxed mb-6 italic border-l-4 border-blue-600 pl-6">
                {t('"Education is the most powerful weapon which you can use to change the world. At Bal Bodh Secondary School, we believe in empowering our students with knowledge, values, and skills to excel in life."')}
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                {t('Our vision is to create a generation of thoughtful, innovative, and compassionate leaders. We provide a nurturing environment where every student can discover their potential and achieve their dreams. We are proud of our achievements and remain committed to continuous improvement.')}
              </p>
          <Link to="/principal-message">
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="px-8 py-4 rounded-full font-bold text-white transition-all text-lg shadow-xl"
    style={{ backgroundColor: COLORS.accent, color: '#000' }}
  >
    {t('View Full Message')}
  </motion.button>
</Link>
            </motion.div>
          </div>
        </div>
      </section>

{showMessage && (
      <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 relative">

          <button
            onClick={() => setShowMessage(false)}
            className="absolute top-4 right-6 text-4xl font-bold text-gray-600 hover:text-red-500"
          >
            ×
          </button>

          <h2 className="text-3xl font-bold mb-4">
            {t('Principal Full Message')}
          </h2>

          <p>
            {t('Your full English + Nepali message here...')}
          </p>

        </div>
      </div>
    )}

      {/* Statistics Section - Premium Counter */}
      <StatisticsCounter statistics={STATISTICS} />

      {/* Why Choose Bal Bodh Section */}
      <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4">
  <SectionTitle
    title="Why Choose Bal Bodh School?"
    subtitle="We offer comprehensive education with modern facilities and dedicated faculty"
  />

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    {WHY_CHOOSE.map((feature, index) => {
      const IconComponent = featureIconMap[feature.icon];

      return (
        <FeatureCard
          key={index}
          icon={IconComponent || FaBook}
          title={feature.title}
          description={feature.description}
          delay={index * 0.1}
        />
      );
    })}
  </div>
</div>
      </section>
      
      {/* Academic Excellence Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Academic Excellence"
            subtitle="Celebrating outstanding achievements and consistent performance"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {ACADEMIC_EXCELLENCE.map((item, index) => (
              <AcademicExcellenceCard
                key={index}
                title={item.title}
                description={item.description}
                image={item.image}
                stats={item.stats}
                color={item.color}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Facilities Showcase Section */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="World-Class Facilities"
            subtitle="Equipped with modern infrastructure for holistic development"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {FACILITIES.slice(0, 8).map((facility, index) => (
              <FacilityCard
                key={index}
                title={facility.title}
                description={facility.description}
                image={facility.images[0]}
                delay={index * 0.05}
              />
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link to="/facilities">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-full font-bold text-white transition-all inline-flex items-center gap-2 text-lg shadow-xl"
                style={{ backgroundColor: COLORS.secondary }}
              >
                Explore All Facilities <FaArrowRight />
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Notices Section */}
      <HomeNoticeFeed />

      {/* Upcoming Events Section */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Upcoming Events"
            subtitle="Exciting activities and celebrations planned for our students"
          />
          <EventCarousel />
        </div>
      </section>

      {/* Staff Highlights Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Campus Leadership"
            subtitle="Meet the talented faculty and school leaders shaping student success"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STAFF.slice(0, 4).map((member, index) => (
              <StaffCard
                key={member.id}
                name={member.name}
                role={member.role}
                image={member.image}
                department={member.department}
                delay={index * 0.1}
              />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/staff">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-full font-bold text-white transition-all inline-flex items-center gap-2 text-lg shadow-xl"
                style={{ backgroundColor: COLORS.secondary }}
              >
                View Full Staff <FaArrowRight />
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Student Achievements"
            subtitle="Celebrating excellence and success of our outstanding students"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {ACHIEVEMENTS.map((achievement, index) => (
              <AchievementCard
                key={index}
                title={achievement.title}
                description={achievement.description}
                image={achievement.image}
                count={achievement.count}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Student & Parent Testimonials"
            subtitle="Hear from our satisfied students and their parents"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                name={testimonial.name}
                role={testimonial.role}
                text={testimonial.text}
                image={testimonial.image}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Preview Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Photo Gallery"
            subtitle="Glimpses of vibrant school life and activities"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredGallery.map((image, index) => (
              <GalleryImage
                key={image.id}
                image={image.image}
                title={image.title}
                onClick={() => {}}
                delay={index * 0.05}
              />
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link to="/gallery">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-full font-bold text-white transition-all inline-flex items-center gap-2 text-lg shadow-xl"
                style={{ backgroundColor: COLORS.secondary }}
              >
                View Full Gallery <FaArrowRight />
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* Admission CTA Section */}
      <AdmissionBanner />
    </div>
    </TranslateText>
  );
};


export default Home;
