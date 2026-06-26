import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaSearch } from 'react-icons/fa';
import { SectionTitle, FacilityCard } from '../../components/public/SectionComponents';
import FacilityModal from '../../components/public/FacilityModal';
import TranslateText from '../../components/public/TranslateText';
import GoBackButton from '../../components/common/GoBackButton';
import { apiBaseURL, API_BASE } from '../../services/api';
import { COLORS } from '../../constants/schoolData';

const Facilities = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [facilitiesData, setFacilitiesData] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const navigate = useNavigate();

  const categories = [
    { id: 'all', name: 'All Facilities' },
    { id: 'academic', name: 'Academic' },
    { id: 'sports', name: 'Sports' },
    { id: 'hostel', name: 'Residential' },
    { id: 'health', name: 'Health' },
    { id: 'recreation', name: 'Recreation' },
  ];

  const API = API_BASE;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API}/api/facilities`);
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          if (mounted) setFacilitiesData([]);
          return;
        }
        const body = await res.json();
        const list = Array.isArray(body.data) ? body.data : [];
        if (mounted) setFacilitiesData(list);
      } catch (e) {
        console.error('Failed to load facilities', e);
        if (mounted) setFacilitiesData([]);
      }
    })();
    return () => { mounted = false; };
  }, [API]);

  const filteredFacilities = facilitiesData.filter((facility) => {
    const name = String(facility.facilityName || facility.title || '');
    const category = String(facility.category || '').toLowerCase();
    const term = String(searchTerm || '').toLowerCase();
    const categoryMatch = selectedCategory === 'all' || category === selectedCategory;
    return categoryMatch && name.toLowerCase().includes(term);
  });

  return (
    <TranslateText>
      <div>
        {/* Page Header */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-white py-16 md:py-24"
          style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})` }}
        >
          <div className="max-w-[1600px] mx-auto px-4 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4"
            >
              Our Facilities
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg md:text-xl text-white/90"
            >
              World-class infrastructure for comprehensive development
            </motion.p>
          </div>
        </motion.section>

        {/* Facilities Overview */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-[1600px] mx-auto px-4">
            <SectionTitle title="State-of-the-Art Facilities" subtitle="Equipped with modern infrastructure and technology" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {[
                { count: '15+', label: 'Classrooms', icon: '🏛️' },
                { count: '2+', label: 'Laboratories', icon: '🔬' },
                { count: '10+', label: 'Computers', icon: '💻' },
                { count: '1 Bigha', label: 'Land', icon: '🌳' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -10 }}
                  className="rounded-2xl p-8 text-center shadow-xl hover:shadow-2xl transition-all duration-300"
                  style={{ background: `linear-gradient(135deg, ${COLORS.gray}, white)` }}
                >
                  <p className="text-5xl mb-3">{stat.icon}</p>
                  <p className="text-3xl font-bold mb-2" style={{ color: COLORS.dark }}>{stat.count}</p>
                  <p className="font-medium" style={{ color: COLORS.slate }}>{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Search and Filter */}
        <section style={{ backgroundColor: COLORS.gray }}>
          <div className="sticky top-16 md:top-20 z-50 bg-white/90 backdrop-blur-xl shadow-lg" style={{ borderBottom: `1px solid ${COLORS.lightGray}` }}>
            <div className="max-w-[1600px] mx-auto px-4 py-6">
              <div className="relative mb-5">
                <FaSearch className="absolute left-4 top-3.5" style={{ color: COLORS.slate }} />
                <input
                  type="text"
                  placeholder="Search facilities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 bg-white shadow-sm transition-all duration-300"
                  style={{ borderColor: COLORS.lightGray, '--tw-ring-color': COLORS.secondary }}
                />
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-5 py-2 rounded-full font-semibold transition-all duration-300 shadow-md ${
                      selectedCategory === category.id
                        ? "text-white scale-105"
                        : "bg-white hover:shadow-lg"
                    }`}
                    style={{
                      backgroundColor: selectedCategory === category.id ? COLORS.secondary : 'white',
                      color: selectedCategory === category.id ? 'white' : COLORS.dark,
                      border: selectedCategory === category.id ? 'none' : `1px solid ${COLORS.lightGray}`
                    }}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Facilities Grid */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-[1600px] mx-auto px-4">
            {filteredFacilities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {filteredFacilities.map((facility, index) => (
                  <div key={facility._id || index} onClick={() => setSelectedFacility(facility)} className="cursor-pointer">
                    <FacilityCard
                      title={facility.facilityName}
                      description={facility.shortDescription}
                      image={(facility.photos && facility.photos[0] && facility.photos[0].url) || ''}
                      delay={index * 0.05}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <p className="text-xl" style={{ color: COLORS.slate }}>No facilities found matching your search.</p>
              </motion.div>
            )}
          </div>
        </section>

        {/* Featured Facilities */}
        <section className="py-16 md:py-24" style={{ backgroundColor: COLORS.gray }}>
          <div className="max-w-[1600px] mx-auto px-4">
            <SectionTitle title="Facility Highlights" subtitle="Detailed information about our key facilities" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {facilitiesData.filter(f => f.featured).map((facility, idx) => (
                <div key={facility._id || idx} onClick={() => setSelectedFacility(facility)} className="cursor-pointer">
                  <FacilityCard
                    title={facility.facilityName}
                    description={facility.shortDescription}
                    image={(facility.photos && facility.photos[0] && facility.photos[0].url) || ''}
                    delay={idx * 0.05}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {selectedFacility && (
          <FacilityModal facility={selectedFacility} onClose={() => setSelectedFacility(null)} />
        )}

        {/* Virtual Tour CTA */}
        <section className="py-16 md:py-24 text-white"
          style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})` }}
        >
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="max-w-[1600px] mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Experience Our Campus</h2>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">Take a virtual tour of Balbodh Secondary School and explore all our world-class facilities</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-xl font-bold transition-all text-lg shadow-xl hover:shadow-2xl"
              style={{ backgroundColor: COLORS.accent, color: '#000' }}
              onClick={() => navigate('/')}
              aria-label="Go to home and start virtual tour"
            >
              Start Virtual Tour
            </motion.button>
          </motion.div>
        </section>
      </div>
    </TranslateText>
  );
};

export default Facilities;
