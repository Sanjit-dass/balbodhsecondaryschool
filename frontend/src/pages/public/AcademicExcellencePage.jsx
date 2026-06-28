import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';

function getCoverUrl(ach){
  if (!ach) return '';
  if (ach.coverPhoto && Array.isArray(ach.photos)){
    const p = (ach.photos||[]).find(x=> String(x._id) === String(ach.coverPhoto));
    if (p && p.url) return p.url;
  }
  if (Array.isArray(ach.photos) && ach.photos[0]) return ach.photos[0].url;
  return ach.image || '';
}

const AcademicExcellencePage = () => {
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState('');
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState([]);

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.append('category', filterCategory);
      if (filterAcademicYear) params.append('academicYear', filterAcademicYear);
      const res = await fetch(`/api/academic-excellence?${params.toString()}`);
      const body = await res.json();
      const list = Array.isArray(body.data) ? body.data : [];
      list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setAchievements(list);
      
      // Extract unique academic years for filter
      const years = [...new Set(list.map(a => a.academicYear).filter(Boolean))].sort().reverse();
      setAcademicYears(years);
    } catch (err) {
      console.error(err);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, [filterCategory, filterAcademicYear]);

  useEffect(()=>{
    const handler = () => { setLoading(true); fetch('/api/academic-excellence').then(r=>r.json()).then(res=>{ if(res && res.success) setAchievements(res.data||[]); }).catch(()=>{}).finally(()=> setLoading(false)); };
    window.addEventListener('academic-excellence:updated', handler);
    return ()=> window.removeEventListener('academic-excellence:updated', handler);
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

  const filtered = !filterCategory && !filterAcademicYear
    ? achievements
    : (achievements||[]).filter(a => {
        if (filterCategory && a.category !== filterCategory) return false;
        if (filterAcademicYear && a.academicYear !== filterAcademicYear) return false;
        return true;
      });

  return (
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
            🏆 Academic Excellence
          </h1>
          <p className="text-xl text-gray-600">
            Celebrating outstanding academic achievements and consistent performance of our students
          </p>
        </motion.div>

        {/* Filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap gap-4 justify-center mb-12"
        >
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-3 rounded-full font-semibold bg-white text-gray-700 shadow hover:shadow-md border-0 cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</option>
              ))}
            </select>
          </div>
          
          {/* Academic Year Filter */}
          {academicYears.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={filterAcademicYear}
                onChange={(e) => setFilterAcademicYear(e.target.value)}
                className="px-4 py-3 rounded-full font-semibold bg-white text-gray-700 shadow hover:shadow-md border-0 cursor-pointer"
              >
                <option value="">All Years</option>
                {academicYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          )}
          
          {(filterCategory || filterAcademicYear) && (
            <button 
              onClick={() => { setFilterCategory(''); setFilterAcademicYear(''); }}
              className="px-6 py-3 rounded-full font-semibold bg-red-50 text-red-600 shadow hover:shadow-md"
            >
              Clear Filters
            </button>
          )}
        </motion.div>

        {/* Premium Swiper Carousel */}
        {loading ? (
          <div className="text-center py-12">Loading achievements…</div>
        ) : (filtered.filter(a=> a.status === 'published').length === 0 ? (
          <div className="text-center py-12 text-gray-500">No academic excellence published yet.</div>
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
                        {achievement.featured && (
                          <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
                            ⭐ Featured
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-slate-500">{achievement.studentName || '—'} • {achievement.studentClass || ''}</span>
                          {achievement.academicYear && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{achievement.academicYear}</span>}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition">{achievement.title}</h3>
                        <p className="text-gray-600 line-clamp-3 mb-3">{achievement.shortDescription || achievement.description}</p>
                        {(achievement.percentage || achievement.gpa || achievement.marks) && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {achievement.percentage && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{achievement.percentage}</span>}
                            {achievement.gpa && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">GPA: {achievement.gpa}</span>}
                            {achievement.marks && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">{achievement.marks}</span>}
                          </div>
                        )}
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
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-slate-500">{selectedAchievement.studentName || '—'} • {selectedAchievement.studentClass || ''}</span>
                      {selectedAchievement.rollNumber && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">Roll: {selectedAchievement.rollNumber}</span>}
                      {selectedAchievement.featured && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">⭐ Featured</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">{selectedAchievement.category}</span>
                      {selectedAchievement.academicYear && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{selectedAchievement.academicYear}</span>}
                      {selectedAchievement.achievementDate && <span className="text-xs text-slate-400">• {new Date(selectedAchievement.achievementDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  
                  {/* Academic Performance */}
                  {(selectedAchievement.percentage || selectedAchievement.gpa || selectedAchievement.marks || selectedAchievement.position || selectedAchievement.rank) && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                      <h4 className="font-semibold mb-3 text-gray-900">Academic Performance</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedAchievement.percentage && (
                          <div className="bg-white p-3 rounded-lg">
                            <div className="text-xs text-slate-500">Percentage</div>
                            <div className="text-lg font-bold text-green-600">{selectedAchievement.percentage}</div>
                          </div>
                        )}
                        {selectedAchievement.gpa && (
                          <div className="bg-white p-3 rounded-lg">
                            <div className="text-xs text-slate-500">GPA</div>
                            <div className="text-lg font-bold text-purple-600">{selectedAchievement.gpa}</div>
                          </div>
                        )}
                        {selectedAchievement.marks && (
                          <div className="bg-white p-3 rounded-lg">
                            <div className="text-xs text-slate-500">Marks</div>
                            <div className="text-lg font-bold text-orange-600">{selectedAchievement.marks}</div>
                          </div>
                        )}
                        {selectedAchievement.position && (
                          <div className="bg-white p-3 rounded-lg">
                            <div className="text-xs text-slate-500">Position</div>
                            <div className="text-lg font-bold text-blue-600">{selectedAchievement.position}</div>
                          </div>
                        )}
                        {selectedAchievement.rank && (
                          <div className="bg-white p-3 rounded-lg col-span-2">
                            <div className="text-xs text-slate-500">Rank</div>
                            <div className="text-lg font-bold text-indigo-600">{selectedAchievement.rank}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="prose max-w-none text-gray-700 mb-4">{selectedAchievement.description}</div>
                  
                  {selectedAchievement.shortDescription && (
                    <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-semibold mb-2 text-gray-900">Achievement Summary</h4>
                      <p className="text-sm text-gray-600">{selectedAchievement.shortDescription}</p>
                    </div>
                  )}
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
  );
};

export default AcademicExcellencePage;
