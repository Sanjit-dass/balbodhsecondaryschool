import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaSearch } from 'react-icons/fa';
import { SectionTitle, FacilityCard } from '../../components/public/SectionComponents';
import TranslateText from '../../components/public/TranslateText';
import { FACILITIES, COLORS } from '../../constants/schoolData';

const Facilities = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Facilities' },
    { id: 'academic', name: 'Academic' },
    { id: 'sports', name: 'Sports' },
    { id: 'hostel', name: 'Residential' },
    { id: 'health', name: 'Health' },
    { id: 'recreation', name: 'Recreation' },
  ];

  const facilitiesData = [
    { ...FACILITIES[0], category: 'academic' },
    { ...FACILITIES[1], category: 'academic' },
    { ...FACILITIES[2], category: 'academic' },
    { ...FACILITIES[3], category: 'academic' },
    { ...FACILITIES[4], category: 'sports' },
    { ...FACILITIES[5], category: 'recreation' },
    { ...FACILITIES[6], category: 'hostel' },
    { ...FACILITIES[7], category: 'health' },
  ];

  const filteredFacilities = facilitiesData.filter(
    (facility) =>
      (selectedCategory === 'all' || facility.category === selectedCategory) &&
      facility.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Facilities</h1>
          <p className="text-lg text-blue-100">
            World-class infrastructure for comprehensive development
          </p>
        </div>
      </motion.section>

      {/* Facilities Overview */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="State-of-the-Art Facilities"
            subtitle="Equipped with modern infrastructure and technology"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              { count: '15+', label: 'Classrooms', icon: '🏛️' },
              { count: '5+', label: 'Laboratories', icon: '🔬' },
              { count: '20+', label: 'Computers', icon: '💻' },
              { count: '10+', label: 'Acres', icon: '🌳' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className="bg-gradient-to-br from-blue-50 to-gray-50 rounded-lg p-8 text-center shadow-lg"
              >
                <p className="text-5xl mb-3">{stat.icon}</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">{stat.count}</p>
                <p className="text-gray-600 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

     
    {/* Search and Filter */}
<section className="bg-gray-50">

  {/* Sticky Premium Header */}
  <div className="sticky top-16 md:top-20 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-md">

    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* SEARCH */}
      <div className="relative mb-5">
        <FaSearch className="absolute left-4 top-3.5 text-gray-400" />

        <input
          type="text"
          placeholder="Search facilities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
        />
      </div>

      {/* CATEGORY FILTER */}
      <div className="flex flex-wrap gap-3 justify-center">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-5 py-2 rounded-full font-semibold transition-all duration-300 ${
              selectedCategory === category.id
                ? "bg-blue-600 text-white shadow-lg scale-105"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-blue-50"
            }`}
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
        <div className="max-w-7xl mx-auto px-4">
          {filteredFacilities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {filteredFacilities.map((facility, index) => (
                <FacilityCard
                  key={index}
                  title={facility.title}
                  description={facility.description}
                  image={facility.images[0]}
                  delay={index * 0.05}
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-xl text-gray-600">
                No facilities found matching your search.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Detailed Facilities Showcase */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle title="Facility Highlights" subtitle="Detailed information about our key facilities" />

          <div className="space-y-16">
            {/* Smart Classrooms */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
            >
              <div className="rounded-lg overflow-hidden shadow-xl">
                <img
                  src="/src/images/schoolphoto.png"
                  alt="Smart Classrooms"
                  className="w-full h-96 object-cover"
                />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Smart Classrooms</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Our modern classrooms are equipped with interactive smart boards, projectors, and multimedia facilities. Teachers use digital content to make learning engaging and interactive.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li>✓ Interactive smart boards in every classroom</li>
                  <li>✓ Audio-visual learning resources</li>
                  <li>✓ Comfortable seating and good ventilation</li>
                  <li>✓ WiFi connectivity</li>
                </ul>
              </div>
            </motion.div>

            {/* Science Labs */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
            >
              <div className="rounded-lg overflow-hidden shadow-xl order-2 md:order-1">
                <img
                  src="/src/images/lab1.png"
                  alt="Science Laboratory"
                  className="w-full h-96 object-cover object-bottom"
                />
              </div>
              <div className="order-1 md:order-2">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Science Laboratories</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Well-equipped laboratories for Physics, Chemistry, and Biology with modern apparatus and safety equipment. Students conduct experiments to understand scientific concepts practically.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li>✓ Separate labs for Physics, Chemistry, Biology</li>
                  <li>✓ Modern laboratory equipment</li>
                  <li>✓ Safety equipment and first aid facilities</li>
                  <li>✓ Trained lab technicians</li>
                </ul>
              </div>
            </motion.div>

            {/* Sports Facilities */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
            >
              <div className="rounded-lg overflow-hidden shadow-xl">
                <img
                  src="/src/images/sport.png"
                  alt="Sports Ground"
                  className="w-full h-96 object-cover"
                />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Sports Complex</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Spacious grounds and courts for various sports including football, cricket, basketball, and volleyball. Professional coaches train students in different sports disciplines.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li>✓ Large football ground with proper marking</li>
                  <li>✓ Cricket practice area</li>
                  <li>✓ Basketball and volleyball courts</li>
                  <li>✓ Professional sports coaches</li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Virtual Tour CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto px-4 text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Experience Our Campus
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Take a virtual tour of Balbodh Secondary School and explore all our world-class facilities
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 rounded-lg font-bold text-white transition-all text-lg"
            style={{ backgroundColor: COLORS.accent, color: '#000' }}
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
