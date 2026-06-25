import React, { useState, useEffect, Suspense, useRef } from 'react';
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
  FaUserShield,
  FaShieldAlt,
  FaLaptop,
  FaMedal,
} from 'react-icons/fa';
import TranslateText from '../../components/public/TranslateText';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Autoplay, FreeMode, Navigation, Pagination } from 'swiper/modules';


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
import { getImageUrl } from '../../services/api';
import StaffModal from '../../components/public/StaffModal';
import HeroSlider from '../../components/public/HeroSlider';
const AcademicExcellence = React.lazy(() => import('../../components/public/AcademicExcellence'));
const StudentAchievements = React.lazy(() => import('./StudentAchievements'));
const Facilities = React.lazy(() => import('../../components/public/Facilities'));
import HomeAnnouncementBanner from '../../components/public/HomeAnnouncementBanner';
import HomeNoticeFeed from '../../components/public/HomeNoticeFeed';
const EventCarousel = React.lazy(() => import('../../components/public/EventCarousel'));
import AdmissionBanner from '../../components/public/AdmissionBanner';
import StatisticsCounter from '../../components/public/StatisticsCounter';

import {
  SCHOOL_INFO,
  COLORS,
  STATISTICS,
  WHY_CHOOSE,
  TESTIMONIALS,
  PRINCIPAL_MESSAGE,
} from '../../constants/schoolData';
import api from '../../services/api';

  const Home = () => {
    const { t } = useTranslate();
    const [showMessage, setShowMessage] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState('all');
  const [galleryImages, setGalleryImages] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(true);

  const homeSwiperRef = useRef(null);

  // Simple sessionStorage cache helper
  const readCache = (key) => {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.ts) return null;
      // TTL 60 seconds
      if (Date.now() - parsed.ts > (60 * 1000)) { sessionStorage.removeItem(key); return null; }
      return parsed.data;
    } catch (e) { return null; }
  };
  const writeCache = (key, data) => {
    try { sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch(e){}
  };

  useEffect(() => {
    if (!loadingGallery && homeSwiperRef.current && homeSwiperRef.current.autoplay && galleryImages.length > 1) {
      try { homeSwiperRef.current.autoplay.stop(); } catch(e){}
      try { setTimeout(() => { try { homeSwiperRef.current && homeSwiperRef.current.autoplay && homeSwiperRef.current.autoplay.start(); } catch(e){} }, 150); } catch(e){}
    }
  }, [loadingGallery, galleryImages]);

  useEffect(()=>{ (async ()=>{ try{
      setLoadingGallery(true);
      const cached = readCache('home:gallery');
      if (cached) { setGalleryImages(cached); setLoadingGallery(false); return; }

      // Fetch gallery + staff in parallel to reduce round-trips
      const [gRes] = await Promise.all([
        fetch('/api/photo-gallery/photos')
      ]);
      const gj = await gRes.json();
      if (gj.success && Array.isArray(gj.data)) {
        const isFilename = s => !!(s && /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(String(s)));
        const mapped = gj.data.map(item => { const url = item.url || item.image || item.file || (item.filename? getImageUrl(item.filename) : (item.path? getImageUrl(item.path):'')); let displayTitle = item.title || item.caption || ''; if (!displayTitle || isFilename(displayTitle)) { displayTitle = item.galleryTitle || item.albumTitle || item.albumName || (item.album && item.album.title) || item.title?.replace(/\.[^.]+$/, '') || 'Photo'; } const displayCategory = item.category || item.galleryCategory || item.albumCategory || item.album?.category || ''; return { ...item, url, displayTitle, displayCategory, title: displayTitle, category: displayCategory }; });
        // limit initial data to 10
        const limited = mapped.slice(0, 10);
        setGalleryImages(limited || []);
        writeCache('home:gallery', limited || []);
      }
    }catch(e){console.warn(e)} finally { setLoadingGallery(false); } })(); }, []);

  const filteredGallery = galleryFilter === 'all'
    ? galleryImages.slice(0,6)
    : galleryImages.filter(img => img.category === galleryFilter).slice(0,6);

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

  function StaffHighlights(){
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [isInteracting, setIsInteracting] = useState(false);

    useEffect(() => {
      let mounted = true;
      const fetchStaff = async () => {
        try {
          const res = await api.get('/staff-leadership');
          if (!mounted) return;
          const list = (res.data && res.data.data) ? res.data.data : [];
          // Only show staff that have an explicit photo URL to avoid showing deleted/placeholder records
          const valid = Array.isArray(list) ? list.filter(m => m && m.photo && m.photo.url) : [];
          setStaff(valid || []);
        } catch (e) {
          console.error('Failed to load staff', e);
          setStaff([]);
        } finally {
          if (mounted) setLoading(false);
        }
      };
      fetchStaff();
      return () => { mounted = false; };
    }, []);

    

    if (loading) return <div className="py-8">Loading...</div>;

    if (!staff || staff.length === 0) return (
      <div className="py-8">
        <div className="text-center text-slate-600">No staff members added yet.</div>
      </div>
    );

    return (
      <>
        <div
          className={`relative no-nav ${isInteracting ? 'hide-nav' : ''}`}
          onPointerDown={() => setIsInteracting(true)}
          onPointerUp={() => setIsInteracting(false)}
          onPointerCancel={() => setIsInteracting(false)}
          onPointerLeave={() => setIsInteracting(false)}
        >
          {/* no-nav hides navigation buttons on all viewports; hide-nav kept for interaction fading if needed */}
          <style>{`.no-nav .swiper-button-next, .no-nav .swiper-button-prev { display: none !important; opacity: 0 !important; pointer-events: none !important; } .hide-nav .swiper-button-next, .hide-nav .swiper-button-prev { opacity: 0 !important; pointer-events: none; transform: scale(0.98); } .swiper-button-next, .swiper-button-prev { transition: opacity 150ms ease, transform 150ms ease; }`}</style>
          <Swiper
            modules={[Navigation, Autoplay, Pagination]}
            spaceBetween={20}
            slidesPerView={4}
            loop={true}
            navigation={true}
            autoplay={{ delay: 3500, disableOnInteraction: true }}
            pagination={{ clickable: true }}
            breakpoints={{
              320: { slidesPerView: 1 },
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 4 },
            }}
            style={{ paddingBottom: 24 }}
          >
            {staff.map((member, index) => (
              <SwiperSlide key={member._id || index}>
                <div className="p-2">
                  <StaffCard
                    name={member.fullName || member.name}
                    role={member.designation || member.role}
                    image={(member.photo && member.photo.url) || member.image}
                    department={member.department}
                    onClick={() => setSelectedStaff(member)}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        {selectedStaff ? (
          <StaffModal staff={selectedStaff} onClose={() => setSelectedStaff(null)} />
        ) : null}
      </>
    );
  }


  return (
    <TranslateText>
      <div>
      {/* Announcement Banner */}
      <HomeAnnouncementBanner />

      {/* Hero Section with Premium Image Slider */}
      <HeroSlider />

      {/* School Introduction Section */}
      <section id="about" className="py-20 md:py-28 bg-white">
        <div className="max-w-[1600px] mx-auto px-4">
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
                  src="/images/schoolphoto.png"
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
                className="absolute -bottom-6 right-0 sm:-right-6 bg-white rounded-xl shadow-xl p-6"
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
                  src="/images/principal.png"
                  alt="Founder"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <p className="text-xl font-semibold">Sanjay Khadga</p>
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
                {t('principalMessage')}
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
            {t('principalFullMessage')}
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
      
      {/* Academic Excellence Section - Database Driven */}
      <Suspense fallback={<div className="py-12 text-center">Loading Academic Excellence…</div>}>
        <div id="academics">
          <AcademicExcellence />
        </div>
      </Suspense>

      {/* Facilities Showcase Section - Database Driven */}
      <Suspense fallback={<div className="py-12 text-center">Loading Facilities…</div>}>
        <div id="facilities">
          <Facilities />
        </div>
      </Suspense>

      {/* Latest Notices Section */}
      <HomeNoticeFeed />

      {/* Upcoming Events Section */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Upcoming Events"
            subtitle="Exciting activities and celebrations planned for our students"
          />
          <Suspense fallback={<div className="py-8 text-center">Loading Events…</div>}>
            <EventCarousel />
          </Suspense>
        </div>
      </section>

      {/* School Leadership Section - dynamic from API */}
      <section id="staff" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="School Leadership"
            subtitle="Meet the talented faculty and school leaders shaping student success"
          />
          <StaffHighlights />
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

      {/* Student Achievements Section - placed after School Leadership as requested */}
      <Suspense fallback={<div className="py-12 text-center">Loading Student Achievements…</div>}>
        <div id="student-life">
          <StudentAchievements />
        </div>
      </Suspense>

      {/* Achievements are displayed via the AcademicExcellence component (DB-driven) */}

      {/* Testimonials Section */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Student Testimonials"
            subtitle="Hear directly from our students and alumni about their learning experience, achievements, and growth at Bal Bodh Secondary School."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.slice(0,3).map((testimonial, index) => (
              <TestimonialCard
                key={index}
                name={testimonial.name}
                role={testimonial.role}
                text={testimonial.text}
                image={testimonial.image}
                delay={index * 0.12}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Preview Section */}
      <section id="gallery" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Photo Gallery"
            subtitle="Glimpses of vibrant school life and activities"
          />

          {/* Swiper-based scrolling gallery for homepage preview */}
          <div>
            <style>{`.home-swiper .swiper-button-next, .home-swiper .swiper-button-prev { display: none !important; } .home-swiper .swiper-wrapper { transition-timing-function: linear !important; } .home-swiper .swiper-pagination { bottom: 6px !important; } .home-swiper .swiper-pagination-bullet { width:10px; height:10px; background:#d1d5db; opacity:1; margin:0 6px; } .home-swiper .swiper-pagination-bullet-active { background:#1e90ff; }`}</style>
            <Swiper
              className="home-swiper no-nav"
              modules={[Autoplay, Pagination]}
              spaceBetween={24}
              grabCursor={true}
              freeMode={false}
              slidesPerView={1}
              pagination={{ clickable: true }}
              autoplay={filteredGallery.length > 1 ? { delay: 3500, disableOnInteraction: false, waitForTransition: false } : false}
              loop={filteredGallery.length > 1}
              slidesPerGroup={1}
              speed={500}
              onSwiper={(s) => { homeSwiperRef.current = s; if (filteredGallery.length > 1 && s && s.autoplay) { try { s.autoplay.stop(); } catch(e){} try { setTimeout(() => { try { s.autoplay.start(); } catch(e){} }, 150); } catch(e){} } }}
              allowTouchMove={true}
              breakpoints={{
                320: { slidesPerView: 1 },
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 4 },
              }}
              style={{ paddingBottom: 28 }}
            >
              {filteredGallery.map((image, index) => (
                <SwiperSlide key={image.id || image._id || index}>
                    <div className="p-3">
                    <GalleryImage
                      size="large"
                      image={image.url || image}
                      title={image.title}
                      category={image.category}
                      onClick={() => { window.location.href = '/gallery'; }}
                      delay={index * 0.05}
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
            
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
