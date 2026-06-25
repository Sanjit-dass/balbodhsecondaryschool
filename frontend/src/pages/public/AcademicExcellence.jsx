import React from 'react';
import { motion } from 'framer-motion';
import TranslateText from '../../components/public/TranslateText';
import GoBackButton from '../../components/common/GoBackButton';
import AcademicExcellence from '../../components/public/AcademicExcellence';

const AcademicExcellencePage = () => {
  return (
    <TranslateText>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-24 pb-20">
      <GoBackButton label="← Back" color="blue" />
      <div className="max-w-[1600px] mx-auto px-4">
        <div className="mb-12">
          <AcademicExcellence />
        </div>

        {/* Detailed Sections */}
        <div className="space-y-12">
          {/* SEE Results Section */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-lg p-8 md:p-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Secondary Education Examination (SEE) Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-5xl font-bold text-blue-600 mb-2">99%</div>
                <p className="text-gray-600">Pass Rate</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-green-600 mb-2">45%</div>
                <p className="text-gray-600">A+ Grade Achievement</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-purple-600 mb-2">15+</div>
                <p className="text-gray-600">National Merit Recognition</p>
              </div>
            </div>
          </motion.div>

          {/* Top Achievers */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl shadow-lg p-8 md:p-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Top Achievers Program</h2>
            <p className="text-gray-600 mb-6">
              Our top achievers program recognizes and celebrates students who excel in academics and beyond. 
              These exceptional students serve as role models for their peers and have gone on to secure prestigious 
              scholarships and admissions at leading universities worldwide.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 shadow">
                <div className="text-4xl font-bold text-blue-600 mb-2">50+</div>
                <p className="text-gray-600">Top Achievers</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow">
                <div className="text-4xl font-bold text-green-600 mb-2">20+</div>
                <p className="text-gray-600">International Scholarships</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow">
                <div className="text-4xl font-bold text-purple-600 mb-2">100%</div>
                <p className="text-gray-600">Higher Education Placement</p>
              </div>
            </div>
          </motion.div>

          {/* Science Excellence */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-lg p-8 md:p-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Science Excellence & Innovation</h2>
            <p className="text-gray-600 mb-6">
              Our science program emphasizes practical learning and innovation. Students engage in research projects, 
              participate in science fairs, and work on real-world problems, fostering scientific temper and critical thinking.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="border-l-4 border-blue-600 pl-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">50+ Research Projects</h3>
                <p className="text-gray-600">Student-led research initiatives</p>
              </div>
              <div className="border-l-4 border-green-600 pl-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">15+ Science Fair Awards</h3>
                <p className="text-gray-600">National and international recognition</p>
              </div>
              <div className="border-l-4 border-purple-600 pl-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">5 Publications</h3>
                <p className="text-gray-600">Student research published</p>
              </div>
            </div>
          </motion.div>

          {/* Sports Champions */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl shadow-lg p-8 md:p-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Sports Champions & Physical Excellence</h2>
            <p className="text-gray-600 mb-6">
              Our comprehensive sports program develops athletic excellence and sportsmanship. 
              Our students have won numerous championships and represented Nepal in international competitions.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="bg-white rounded-lg p-6 shadow">
                <div className="text-3xl font-bold text-red-600 mb-2">25+</div>
                <p className="text-sm text-gray-600">Trophies</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow">
                <div className="text-3xl font-bold text-yellow-600 mb-2">35+</div>
                <p className="text-sm text-gray-600">Gold Medals</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow">
                <div className="text-3xl font-bold text-blue-600 mb-2">20+</div>
                <p className="text-sm text-gray-600">National Participants</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow">
                <div className="text-3xl font-bold text-green-600 mb-2">8</div>
                <p className="text-sm text-gray-600">State Champions</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
    </TranslateText>
  );
};

export default AcademicExcellencePage;
