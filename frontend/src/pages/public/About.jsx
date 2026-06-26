import React from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaLightbulb, FaHandshake, FaUsers } from 'react-icons/fa';
import { SectionTitle, FeatureCard } from '../../components/public/SectionComponents';
import AcademicExcellence from '../../components/public/AcademicExcellence';
import TranslateText from '../../components/public/TranslateText';
import GoBackButton from '../../components/common/GoBackButton';
import { SCHOOL_INFO, COLORS } from '../../constants/schoolData';

const About = () => {
  const values = [
    {
      icon: FaLightbulb,
      title: 'Excellence',
      description: 'Commitment to highest standards in education and character development',
    },
    {
      icon: FaUsers,
      title: 'Integrity',
      description: 'Honesty, transparency, and ethical behavior in all our interactions',
    },
    {
      icon: FaHandshake,
      title: 'Community',
      description: 'Fostering a supportive environment for holistic growth',
    },
    {
      icon: FaCheckCircle,
      title: 'Innovation',
      description: 'Embracing modern teaching methods and technology',
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
        className="text-white py-16 md:py-24"
        style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})` }}
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4"
          >
            About Us
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg md:text-xl text-white/90"
          >
            Discover the story and mission behind Bal Bodh Secondary School
          </motion.p>
        </div>
      </motion.section>

      {/* School Introduction */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden shadow-2xl"
            >
              <img
                src="/images/schoolphoto.png"
                alt="School Campus"
                className="w-full h-96 object-cover"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: COLORS.dark }}>
                Our Story
              </h2>
              <div className="w-20 h-1.5 rounded-full mb-6" style={{ background: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.accent})` }}></div>
              <p className="leading-relaxed mb-4" style={{ color: COLORS.slate }}>
                <strong>Bal Bodh Secondary School (बाल बोध माध्यमिक विद्यालय) was established in 1998 AD (2055 BS) as a community-based educational institution located in Kanchanpur, Saptari, Nepal. The school was founded with a strong vision to provide quality, accessible, and holistic education to students in the region.</strong>
              </p>
              <p className="leading-relaxed mb-4" style={{ color: COLORS.slate }}>
                Since its establishment, the school has steadily grown into a respected academic institution committed to excellence in teaching and learning. With the dedication of experienced teachers, continuous support from parents, and active involvement of the community, the school has built a strong foundation for academic and personal development.
              </p>
              <p className="leading-relaxed mb-4" style={{ color: COLORS.slate }}>
                We believe in blending traditional educational values with modern teaching methodologies to ensure that students are well-prepared for both academic success and real-world challenges.
              </p>
              <p className="leading-relaxed" style={{ color: COLORS.slate }}>
                Over the years, Bal Bodh Secondary School has guided and shaped thousands of students who are now contributing positively to society in various fields such as education, business, technology, and public service.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Vision, Mission & Values */}
      <section className="py-16 md:py-24" style={{ backgroundColor: COLORS.gray }}>
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle title="Our Vision, Mission & Values" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 mb-12">
            {/* Vision */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300"
              style={{ borderTop: `4px solid ${COLORS.primary}` }}
            >
              <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.dark }}>Our Vision</h3>
              <p className="leading-relaxed" style={{ color: COLORS.slate }}>
                To be a premier educational institution that nurtures responsible, innovative, and compassionate global citizens committed to excellence and societal development.
              </p>
            </motion.div>

            {/* Mission */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300"
              style={{ borderTop: `4px solid ${COLORS.secondary}` }}
            >
              <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.dark }}>Our Mission</h3>
              <p className="leading-relaxed" style={{ color: COLORS.slate }}>
                To provide comprehensive, quality education that develops academic excellence, critical thinking, and character in an inclusive, nurturing environment that prepares students for success.
              </p>
            </motion.div>

            {/* Values */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300"
              style={{ borderTop: `4px solid ${COLORS.accent}` }}
            >
              <h3 className="text-2xl font-bold mb-4" style={{ color: COLORS.dark }}>Core Values</h3>
              <ul className="space-y-3" style={{ color: COLORS.slate }}>
                <li className="flex items-center gap-2">
                  <FaCheckCircle style={{ color: COLORS.secondary }} /> Excellence in Education
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle style={{ color: COLORS.secondary }} /> Integrity in Actions
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle style={{ color: COLORS.secondary }} /> Innovation in Learning
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle style={{ color: COLORS.secondary }} /> Community Engagement
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Values Details */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Our Core Values"
            subtitle="Principles that guide our educational philosophy"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {values.map((value, index) => (
              <FeatureCard
                key={index}
                icon={value.icon}
                title={value.title}
                description={value.description}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Academic Excellence Section */}
      <AcademicExcellence />

      {/* School Objectives */}
      <section className="py-16 md:py-24" style={{ backgroundColor: COLORS.gray }}>
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="School Objectives"
            subtitle="Goals we strive to achieve for our students"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              'Provide quality education with modern curriculum and teaching methods',
              'Develop critical thinking, creativity, and problem-solving skills',
              'Foster moral and ethical values for character development',
              'Promote physical fitness and extracurricular activities',
              'Create an inclusive environment for all students',
              'Prepare students for competitive examinations and future careers',
            ].map((objective, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-start gap-4 bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 mt-1"
                  style={{ backgroundColor: COLORS.secondary }}
                >
                  ✓
                </div>
                <p style={{ color: COLORS.slate }}>{objective}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      

      {/* Achievements & Recognition */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-blue-50 to-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Achievements & Recognition"
            subtitle="Awards and accolades we're proud of"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              'Best Educational Institution Award ',
              'Excellence in Academic Programs ',
              'Top Performing School in Regional Exams',
              'Best Sports Program Award',
              'Innovation in Education Recognition',
              'Community Service Excellence Award',
              'Best Teaching Practices Award',
              'Infrastructure Development Award',
              'Student Welfare Recognition',
            ].map((award, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-xl p-6 shadow-lg text-center hover:shadow-xl transition-all duration-300"
              >
                <div className="text-4xl mb-3">🏆</div>
                <p className="font-semibold" style={{ color: COLORS.dark }}>{award}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Future Goals */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Future Goals"
            subtitle="Vision for the next phase of Bal Bodh School"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: 'Digital Transformation',
                description: 'Implementing AI-powered learning systems and digital classrooms',
              },
              {
                title: 'Research & Innovation',
                description: 'Establishing research centers for student-led innovation projects',
              },
              {
                title: 'Global Partnerships',
                description: 'Building collaborations with international schools and universities',
              },
              {
                title: 'Sustainability',
                description: 'Creating a green campus with eco-friendly practices',
              },
              {
                title: 'Skill Development',
                description: 'Introducing industry-relevant skills training programs',
              },
              {
                title: 'Mental Wellness',
                description: 'Comprehensive counseling and mental health support services',
              },
            ].map((goal, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300"
                style={{ background: `linear-gradient(135deg, ${COLORS.gray}, white)`, borderLeft: `4px solid ${COLORS.secondary}` }}
              >
                <h3 className="text-xl font-bold mb-3" style={{ color: COLORS.dark }}>{goal.title}</h3>
                <p style={{ color: COLORS.slate }}>{goal.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
    </TranslateText>
  );
};

export default About;
