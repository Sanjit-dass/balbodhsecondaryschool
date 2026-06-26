import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SectionTitle, EventCard, AchievementCard } from '../../components/public/SectionComponents';
import TranslateText from '../../components/public/TranslateText';
import GoBackButton from '../../components/common/GoBackButton';
import { COLORS } from '../../constants/schoolData';
import api from '../../services/api';
import { useState, useEffect } from 'react';

function formatEventDate(d){
  try{ const dt = d ? new Date(d) : null; return dt ? dt.toLocaleDateString() : '';}catch(e){return String(d||'');}
}

const EventsList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      try{
        let res = await api.get('/events-v2/public').catch(()=>null);
        let list = [];
        if (res && res.data) {
          list = Array.isArray(res.data.events) ? res.data.events : (Array.isArray(res.data) ? res.data : (res.data.data || []));
        }
        if ((!list || list.length === 0)){
          try{
            const r2 = await api.get('/events/public').catch(()=>null);
            if (r2 && r2.data) list = Array.isArray(r2.data.events) ? r2.data.events : (Array.isArray(r2.data) ? r2.data : (r2.data.data || list));
          }catch(e){}
        }
        if ((!list || list.length === 0)){
          try{ const r3 = await api.get('/events').catch(()=>null); if (r3 && r3.data) list = Array.isArray(r3.data.events) ? r3.data.events : (Array.isArray(r3.data) ? r3.data : (r3.data.data || list)); }catch(e){}
        }
        list = Array.isArray(list) ? list : [];
        if (mounted) setEvents(list.filter(e=> e && e.status !== 'hidden'));
      }catch(err){
        console.warn('fetch events', err);
        if (mounted) setEvents([]);
      }finally{ if (mounted) setLoading(false); }
    })();
    return ()=> { mounted = false; };
  }, []);

  if (loading) return <div className="text-center py-12" style={{ color: COLORS.slate }}>Loading events…</div>;
  const published = (events||[]).filter(e=> !e.status || e.status === 'published');
  if (!published.length) return <div className="text-center py-12" style={{ color: COLORS.slate }}>No upcoming events available.</div>;

  

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
      {published.map((event, index) => (
        <EventCard key={event._id || index} title={event.title} date={formatEventDate(event.eventDate || event.date)} description={event.shortDescription || event.description || ''} image={(event.coverPhoto && event.coverPhoto.url) || (event.photos && event.photos[0] && event.photos[0].url) || event.image || ''} delay={index * 0.08} />
      ))}
    </div>
  );
};

const AchievementsGrid = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      try{
        const res = await api.get('/student-achievements').catch(()=>null);
        const list = (res && (res.data?.data || res.data)) || [];
        if (mounted) setItems(Array.isArray(list) ? list : []);
      }catch(err){ console.warn('fetch achievements', err); if (mounted) setItems([]); }
      finally{ if (mounted) setLoading(false); }
    })();
    return ()=> { mounted = false; };
  }, []);

  if (loading) return <div className="text-center py-12" style={{ color: COLORS.slate }}>Loading achievements…</div>;
  const published = (items||[]).filter(a=> !a.status || a.status === 'published');
  if (!published.length) return <div className="text-center py-12" style={{ color: COLORS.slate }}>No student achievements available.</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {published.map((ach, index) => (
        <AchievementCard key={ach._id || index} title={ach.title} description={ach.shortDescription || ach.description || ''} image={(ach.coverPhoto && ach.coverPhoto.url) || (ach.photos && ach.photos[0] && ach.photos[0].url) || ach.image || 'topper1.png'} count={ach.statistics && ach.statistics.length ? ach.statistics.length : ''} delay={index * 0.05} />
      ))}
    </div>
  );
};

const StudentLife = () => {
  const activities = [
    { category: 'Sports', description: 'Inter-house and inter-school sports programs across multiple disciplines' },
    { category: 'Cultural Programs', description: 'Cultural celebrations, festivals, and performing arts events' },
    { category: 'Academic Activities', description: 'Competitions, exhibitions and academic enrichment activities' },
    { category: 'Clubs & Societies', description: 'Student-run clubs for science, arts, computers, environment and more' },
    { category: 'Leadership Programs', description: 'Student council, mentoring and leadership development programs' },
    { category: 'Educational Tours', description: 'Field trips and educational tours for experiential learning' },
  ];

  const navigate = useNavigate();

  const handleApplyNow = (e) => {
    e && e.preventDefault();
    navigate('/admissions');
  };

  return (
    <TranslateText>
      <div>
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="text-white py-16 md:py-24" style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})` }}>
          <div className="max-w-7xl mx-auto px-4 text-center">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Student Life</motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-lg md:text-xl text-white/90">Beyond academics - holistic development and memorable experiences</motion.p>
          </div>
        </motion.section>

        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <SectionTitle title="Life at Balbodh School" subtitle="Comprehensive development through diverse activities" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="rounded-2xl overflow-hidden shadow-2xl">
                <img src="/images/studentlife.jpeg" alt="Student Activities" className="w-full h-96 object-cover" />
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
                <p className="leading-relaxed mb-4" style={{ color: COLORS.slate }}>Student life at Balbodh School extends beyond classrooms. We believe in holistic development that encompasses academic excellence, physical fitness, cultural appreciation, and character building.</p>
                <p className="leading-relaxed mb-6" style={{ color: COLORS.slate }}>Our diverse range of activities provides students with opportunities to discover their talents, develop leadership skills, build confidence, and create lifelong friendships.</p>
                <ul className="space-y-3">
                  {[
                    'Encouraging participation in sports and wellness',
                    'Promoting cultural and artistic expression',
                    'Developing leadership and responsibility',
                    'Building teamwork and collaboration',
                    'Creating inclusive and supportive community',
                  ].map((item, index) => (
                    <motion.li key={index} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }} viewport={{ once: true }} className="flex items-center gap-3" style={{ color: COLORS.slate }}>
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS.secondary }}></span>
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24" style={{ backgroundColor: COLORS.gray }}>
          <div className="max-w-7xl mx-auto px-4">
            <SectionTitle title="Student Activities & Clubs" subtitle="Diverse opportunities for growth and exploration" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {activities.map((activity, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} viewport={{ once: true }} whileHover={{ y: -10 }} className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300" style={{ borderTop: `4px solid ${COLORS.secondary}` }}>
                  <h3 className="text-xl font-bold mb-4" style={{ color: COLORS.dark }}>{activity.category}</h3>
                  <p style={{ color: COLORS.slate }}>{activity.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <SectionTitle title="Upcoming Events" subtitle="Exciting activities and celebrations" />
            <EventsList />
          </div>
        </section>

        <section className="py-16 md:py-24" style={{ background: `linear-gradient(to bottom, ${COLORS.gray}, white)` }}>
          <div className="max-w-7xl mx-auto px-4">
            <SectionTitle title="Student Testimonials" subtitle="What students say about their experience at Balbodh" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {[
                { name: 'Rahul Sharma', class: 'Class 6', text: 'Balbodh School has been instrumental in my growth. The teachers are supportive, the facilities are excellent, and the environment encourages learning and fun together.' },
                { name: 'Purnima Yadav', class: 'Class 10', text: "I love the diverse activities and clubs here. I've developed leadership skills through the student council and made lifelong friends." },
                { name: 'Prashanna Khadga', class: 'Class 9', text: "The sports program at Balbodh is amazing! I've improved my cricket skills and learned the importance of teamwork and discipline." },
              ].map((testimonial, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }} viewport={{ once: true }} className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="flex gap-1 mb-4">{[...Array(5)].map((_, i) => <span key={i} className="text-lg" style={{ color: COLORS.accent }}>★</span>)}</div>
                  <p className="italic mb-6" style={{ color: COLORS.slate }}>"{testimonial.text}"</p>
                  <div>
                    <p className="font-bold" style={{ color: COLORS.dark }}>{testimonial.name}</p>
                    <p className="text-sm" style={{ color: COLORS.slate }}>{testimonial.class}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 text-white" style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})` }}>
          <div className="max-w-7xl mx-auto px-4 text-center">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} viewport={{ once: true }} className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Join Our Vibrant Community</motion.h2>
            <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} viewport={{ once: true }} className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">Experience the excitement, friendship, and growth that await you at Balbodh Secondary School</motion.p>
            <motion.button onClick={handleApplyNow} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-8 py-4 rounded-xl font-bold transition-all text-lg shadow-xl hover:shadow-2xl" style={{ backgroundColor: COLORS.accent, color: '#000' }}>Apply Now</motion.button>
          </div>
        </section>
      </div>
    </TranslateText>
  );
};

export default StudentLife;
