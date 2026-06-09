import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import TranslateText from '../../components/public/TranslateText';
import { STUDENT_ACHIEVEMENTS } from '../../constants/schoolData';

const StudentAchievementsPage = () => {
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');

  const categories = [
    'all',
    ...new Set(STUDENT_ACHIEVEMENTS.map(a => a.category))
  ];

  const filtered = filterCategory === 'all'
    ? STUDENT_ACHIEVEMENTS
    : STUDENT_ACHIEVEMENTS.filter(a => a.category === filterCategory);

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
            Celebrating the outstanding accomplishments of our talented students
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
        </motion.div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onClick={() => setSelectedAchievement(achievement)}
              className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              {/* Image */}
              <div className="relative h-64 overflow-hidden bg-gray-900">
                <img
                  src={achievement.image}
                  alt={achievement.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition"></div>
              </div>

              {/* Content */}
              <div className="p-6">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-3">
                  {achievement.category}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                  {achievement.title}
                </h3>
                <p className="text-gray-600">{achievement.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Modal */}
        {selectedAchievement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAchievement(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedAchievement(null)}
                className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition z-10"
              >
                <FaTimes size={20} />
              </button>

              {/* Image */}
              <div className="relative h-96 bg-gray-900">
                <img
                  src={selectedAchievement.image}
                  alt={selectedAchievement.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="p-8">
                <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-semibold mb-4">
                  {selectedAchievement.category}
                </span>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  {selectedAchievement.title}
                </h2>
                <p className="text-gray-600 text-lg">
                  {selectedAchievement.description}
                </p>
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
