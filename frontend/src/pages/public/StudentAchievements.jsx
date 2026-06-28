import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import TranslateText from '../../components/public/TranslateText';
// Student achievements are loaded from the API (/api/achievements)

function getCoverUrl(ach){
  if (!ach) return '';
  if (ach.coverPhoto && Array.isArray(ach.photos)){
    const p = (ach.photos||[]).find(x=> String(x._id) === String(ach.coverPhoto));
    if (p && p.url) return p.url;
  }
  if (Array.isArray(ach.photos) && ach.photos[0]) return ach.photos[0].url;
  return ach.image || '';
}

const StudentAchievementsPage = () => {
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let mounted = true;
    fetch('/api/student-achievements')
      .then(r=> r.json())
      .then(res=>{ if(!mounted) return; if(res && res.success) setAchievements(res.data || []); })
      .catch(err=>{ console.warn('fetch achievements', err); if(mounted) setAchievements([]); })
      .finally(()=> { if(mounted) setLoading(false); });
    return ()=> { mounted = false; };
  }, []);

  useEffect(()=>{
    const handler = () => { setLoading(true); fetch('/api/student-achievements').then(r=>r.json()).then(res=>{ if(res && res.success) setAchievements(res.data||[]); }).catch(()=>{}).finally(()=> setLoading(false)); };
    window.addEventListener('student-achievements:updated', handler);
    return ()=> window.removeEventListener('student-achievements:updated', handler);
  }, []);

  // Lock background scrolling when modal/detail view is open
  useEffect(()=>{
    const prev = typeof document !== 'undefined' ? document.body.style.overflow : '';
    if (selectedAchievement) {
      try{ document.body.style.overflow = 'hidden'; }catch(e){}
    }
    return ()=>{ try{ if (typeof document !== 'undefined') document.body.style.overflow = prev; }catch(e){} };
  }, [selectedAchievement]);

  // Build category list
  const categories = [...new Set((achievements||[]).map(a => a.category).filter(Boolean))];

  const filtered = !filterCategory
    ? achievements
    : (achievements||[]).filter(a => a.category === filterCategory);

  return (
    <TranslateText>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Student Achievements
          </h1>
          <p className="text-xl text-gray-600">
            Celebrating excellence and success of our outstanding students
          </p>
        </motion.div>

        {/* Filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap gap-4 justify-center mb-12"
        >
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setFilterCategory(category)}
              className={`px-6 py-3 rounded-full font-semibold transition ${
                filterCategory === category
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 shadow hover:shadow-md'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
          {categories.length > 0 && (
            <button onClick={() => setFilterCategory('')} className="px-6 py-3 rounded-full font-semibold bg-white text-gray-700 shadow hover:shadow-md">Show all</button>
          )}
        </motion.div>

        {/* Premium Swiper Carousel */}
        {loading ? (
          <div className="text-center py-12">Loading achievements…</div>
        ) : (filtered.filter(a=> a.status === 'published').length === 0 ? (
          <div className="text-center py-12 text-gray-500">No student achievements published yet.</div>
        ) : (
          <div className="relative">
            <Swiper
              modules={[Navigation, Autoplay, Pagination]}
              spaceBetween={24}
              slidesPerView={4}
              loop={true}
              autoplay={{ delay: 3500, disableOnInteraction: false }}
              navigation={true}
              pagination={{ clickable: true }}
              breakpoints={{
                320: { slidesPerView: 1 },
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 4 },
              }}
            >
              {filtered.filter(a=> a.status === 'published').map((achievement, index) => (
                <SwiperSlide key={achievement._id || index}>
                  <div className="p-2">
                    <div onClick={() => setSelectedAchievement(achievement)} className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 h-full">
                      <div className="relative h-64 overflow-hidden bg-gray-900">
                        <img src={getCoverUrl(achievement)} alt={achievement.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition"></div>
                      </div>
                      <div className="p-6">
                        <div className="text-sm text-slate-500 mb-2">{achievement.studentName || '—'} • {achievement.studentClass || ''}</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition">{achievement.title}</h3>
                        <p className="text-gray-600 line-clamp-3">{achievement.shortDescription || achievement.description}</p>
                        <div className="mt-4 text-sm text-blue-600 font-semibold">View More →</div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        ))}

        {/* Modal for detail view */}
        {selectedAchievement && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedAchievement(null)} />
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl max-h-[90vh]" style={{ overflowY: 'auto' }}>
              <button onClick={() => setSelectedAchievement(null)} className="absolute top-4 right-4 z-20 bg-white p-2 rounded-full shadow">×</button>
              <div className="flex flex-col lg:flex-row max-h-[calc(90vh-80px)]">
                {/* Left gallery 40% */}
                <div className="lg:w-2/5 bg-gray-900 p-4 flex flex-col" style={{ maxHeight: 'calc(90vh - 80px)', overflowY: 'auto' }}>
                  <div className="flex-1 flex items-center justify-center">
                    <img src={getCoverUrl(selectedAchievement)} alt={selectedAchievement.title} className="max-h-[60vh] object-contain rounded-lg" />
                  </div>
                  {selectedAchievement.photos && selectedAchievement.photos.length > 0 && (
                    <div className="mt-3" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 6 }}>
                      <div className="flex gap-3">
                        {selectedAchievement.photos.map((p, idx) => (
                          <button key={idx} onClick={() => {/* set cover if needed */}} className="flex-shrink-0 w-28 h-18 rounded overflow-hidden border" style={{ transform: 'translateY(6px)' }}>
                            <img src={p.url} alt={p.caption||''} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right details 60% */}
                <div className="lg:w-3/5 p-6 overflow-y-auto">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold">{selectedAchievement.title}</h2>
                    <div className="text-sm text-slate-500 mt-1">{selectedAchievement.studentName || '—'} • {selectedAchievement.studentClass || ''}</div>
                    <div className="text-xs text-slate-400 mt-1">{selectedAchievement.category} • {selectedAchievement.achievementDate ? new Date(selectedAchievement.achievementDate).toLocaleDateString() : ''}</div>
                  </div>
                  <div className="prose max-w-none text-gray-700">{selectedAchievement.fullDescription || selectedAchievement.description}</div>
                  <div className="mt-6">
                    <h4 className="font-semibold mb-2">Award Details</h4>
                    <p className="text-sm text-gray-600">{selectedAchievement.shortDescription || ''}</p>
                  </div>
                  {selectedAchievement.photos && selectedAchievement.photos.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold mb-2">Additional Photos</h4>
                      <div className="flex gap-3 overflow-x-auto py-2" style={{ WebkitOverflowScrolling: 'touch' }}>
                        {selectedAchievement.photos.map((p, idx) => (
                          <div key={idx} className="w-44 h-28 rounded overflow-hidden border" style={{ transform: 'translateY(4px)' }}>
                            <img src={p.url} alt={p.caption||''} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
    </TranslateText>
  );
};

export default StudentAchievementsPage;
