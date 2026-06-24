import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { COLORS } from '../../constants/schoolData';
import { EventCard } from './SectionComponents';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const EventCarousel = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchEvents = async () => {
      try {
        const response = await api.get('/events-v2/public');
        const backendEvents = (response.data.events || []).map((item) => ({
          id: item._id,
          title: item.title,
          date: item.eventDate ? new Date(item.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'TBA',
          description: item.shortDescription || item.fullDescription || 'Upcoming school event',
          image: (item.coverPhoto && (item.coverPhoto.url || item.coverPhoto.fileUrl)) ? (item.coverPhoto.url || item.coverPhoto.fileUrl) : null,
          raw: item
        }));
        if (isMounted) setEvents(backendEvents);
      } catch (err) {
        console.error('Unable to load live events:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
          <p className="text-gray-700 font-semibold">Loading events...</p>
        </div>
      )}
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={24}
        slidesPerView={1}
        navigation={{
          nextEl: '.event-swiper-next',
          prevEl: '.event-swiper-prev',
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        breakpoints={{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
          1280: { slidesPerView: 4 },
        }}
        className="pb-12"
      >
        {events.map((event, index) => (
          <SwiperSlide key={index}>
            <EventCard
              title={event.title}
              date={event.date}
              description={event.description}
              image={event.image}
              delay={0}
              onLearnMore={() => navigate(`/events?event=${event.raw._id}`)}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Navigation */}
      <div className="event-swiper-prev absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 bg-white shadow-lg rounded-full items-center justify-center cursor-pointer hover:shadow-xl transition-all hidden md:flex">
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </div>
      <div className="event-swiper-next absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 bg-white shadow-lg rounded-full items-center justify-center cursor-pointer hover:shadow-xl transition-all hidden md:flex">
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};

export default EventCarousel;
