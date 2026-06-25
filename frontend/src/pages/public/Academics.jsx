import React from 'react';
import { motion } from 'framer-motion';
import { FaBook, FaFlask, FaLaptop, FaMedal } from 'react-icons/fa';
import { SectionTitle, FeatureCard } from '../../components/public/SectionComponents';
import TranslateText from '../../components/public/TranslateText';
import GoBackButton from '../../components/common/GoBackButton';
import { COLORS, ACADEMIC_PROGRAMS } from '../../constants/schoolData';

const Academics = () => {
  const teachingMethods = [
    {
      icon: FaBook,
      title: 'Conceptual Learning',
      description: 'Focus on understanding concepts rather than rote memorization',
    },
    {
      icon: FaFlask,
      title: 'Hands-on Experiments',
      description: 'Practical and experimental learning in well-equipped labs',
    },
    {
      icon: FaLaptop,
      title: 'Digital Learning',
      description: 'Technology-integrated classrooms with interactive content',
    },
    {
      icon: FaMedal,
      title: 'Competency Based',
      description: 'Development of skills needed for modern careers',
    },
  ];

  return (
    <TranslateText>
      <div>
      <GoBackButton label="Back" color="blue" />
      {/* Page Header */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-16 md:py-24"
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Academics</h1>
          <p className="text-lg text-blue-100">
            Comprehensive curriculum designed for holistic development
          </p>
        </div>
      </motion.section>

      {/* Curriculum Overview */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Curriculum Overview"
            subtitle="We follow a comprehensive, modern curriculum aligned with national standards"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="rounded-xl overflow-hidden shadow-xl"
            >
              <img
                src="/images/projectclass10.png"
                alt="Classroom"
                className="w-full h-96 object-cover"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
             
              <p className="text-gray-600 leading-relaxed mb-4">
                Our curriculum is carefully designed to balance academic excellence with practical skills development. We incorporate both traditional learning methods and modern educational approaches.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Every subject is taught with emphasis on:
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  'Conceptual understanding over memorization',
                  'Real-world applications and problem-solving',
                  'Critical thinking and analytical skills',
                  'Creativity and innovation',
                  'Interdisciplinary learning',
                  'Research and independent study',
                ].map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3 text-gray-600"
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS.secondary }}
                    ></span>
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Academic Programs */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Academic Programs"
            subtitle="Classes and programs offered at Bal Bodh School"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {ACADEMIC_PROGRAMS.map((program, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-all text-center border-t-4"
                style={{ borderTopColor: COLORS.secondary }}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2">{program.class}</h3>
                <p className="text-gray-600 text-sm">{program.focus}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Teaching Methodology */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Teaching Methodology"
            subtitle="Modern approaches to education"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {teachingMethods.map((method, index) => (
              <FeatureCard
                key={index}
                icon={method.icon}
                title={method.title}
                description={method.description}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Examination System */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Examination System"
            subtitle="Comprehensive evaluation and assessment methods"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                title: 'Continuous Assessment',
                items: [
                  'Class tests and assignments',
                  'Project work and presentations',
                  'Participation and engagement',
                  'Regular feedback and progress reports',
                ],
              },
              {
                title: 'Periodic Examinations',
                items: [
                  'Monthly unit tests',
                  'Mid-term and final exams',
                  'Board exams (SEE/NEB)',
                  'Competitive exam preparation',
                ],
              },
            ].map((exam, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-lg p-8 shadow-lg"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-6">{exam.title}</h3>
                <ul className="space-y-3">
                  {exam.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center gap-3 text-gray-600">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS.accent }}
                      ></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Approach */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Our Learning Approach"
            subtitle="Multi-dimensional development of students"
          />

          <div className="max-w-4xl mx-auto">
            {[
              {
                title: 'Conceptual Clarity',
                description:
                  'Students develop deep understanding of fundamental concepts rather than superficial knowledge. We encourage asking questions and critical thinking.',
              },
              {
                title: 'Experiential Learning',
                description:
                  'Learning through doing - lab experiments, field studies, case studies, and practical projects help students apply theoretical knowledge.',
              },
              {
                title: 'Collaborative Learning',
                description:
                  'Group work, peer teaching, and cooperative learning foster teamwork, communication skills, and social development.',
              },
              {
                title: 'Individual Attention',
                description:
                  'Each student is unique. We provide personalized attention, remedial classes, and advanced learning opportunities as needed.',
              },
              {
                title: 'Technology Integration',
                description:
                  'Smart classrooms, digital resources, and online learning platforms supplement traditional teaching methods.',
              },
              {
                title: 'Life Skills Development',
                description:
                  'Beyond academics, we develop essential skills like time management, decision-making, leadership, and emotional intelligence.',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="mb-6 pb-6 border-b border-gray-200 last:border-b-0"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS.secondary }}
                  ></span>
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed ml-6">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      

      {/* Co-Curricular Activities */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Co-Curricular Activities"
            subtitle="Beyond classroom learning"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              'Sports & Athletics',
              'Music & Dance',
              'Debate & Public Speaking',
              'Science Club',
              'Quiz Competitions',
              'Art & Craft',
              'Theater & Drama',
              'Computer & Coding',
              'Environmental Club',
              'Mathematics Club',
              'Literature & Writing',
              'Leadership Programs',
            ].map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-blue-50 to-gray-50 rounded-lg p-6 shadow-lg hover:shadow-xl transition-all text-center border-b-4"
                style={{ borderBottomColor: COLORS.secondary }}
              >
                <p className="font-semibold text-gray-900">{activity}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
    </TranslateText>
  );
};

export default Academics;
