import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaSearch } from 'react-icons/fa';
import { SectionTitle, StaffCard } from '../../components/public/SectionComponents';
import TranslateText from '../../components/public/TranslateText';
import { STAFF, COLORS } from '../../constants/schoolData';
import { useTranslate } from '../../hooks/useTranslate';

const Staff = () => {
  const { t } = useTranslate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  const staffData = [
    ...STAFF,
    { id: 5, name: 'Mr. Rajesh Singh', role: 'Head - Mathematics', image: 'schoolphoto.png', department: 'Mathematics' },
    { id: 6, name: 'Mrs. Priya Sharma', role: 'Head - Social Studies', image: 'schoolphoto2.png', department: 'Social Studies' },
    { id: 7, name: 'Mr. Ashok Paudel', role: 'Sports Director', image: 'student2.png', department: 'Sports' },
  ];

  const departments = ['all', 'Administration', 'Science', 'Languages', 'Mathematics', 'Social Studies', 'Sports'];

  const filteredStaff = staffData.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || member.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('staffTitle')}</h1>
          <p className="text-lg text-blue-100">
            {t('staffSubtitle')}
          </p>
        </div>
      </motion.section>

      {/* Staff Stats */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: t('totalStaff'), value: staffData.length + 20 },
              { label: t('teachers'), value: staffData.length },
              { label: t('departments'), value: departments.length - 1 },
              { label: t('experience'), value: '100+ Years' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                <p className="text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Search & Filter */}
 {/* ================= SEARCH & FILTER (PREMIUM FIXED STICKY) ================= */}
<section className="bg-gray-50">

  <div
    className="sticky top-[72px] md:top-[80px] z-50 
               bg-white/90 backdrop-blur-xl 
               border-b border-gray-200 
               shadow-md transition-all duration-300"
  >

    <div className="max-w-7xl mx-auto px-4 py-5">

      {/* SEARCH BAR */}
      <div className="relative mb-4">
        <FaSearch className="absolute left-4 top-3.5 text-gray-400" />

        <input
          type="text"
          placeholder={t('search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl 
                     border border-gray-200 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 
                     bg-white shadow-sm transition-all duration-300"
        />
      </div>

      {/* DEPARTMENT FILTER */}
      <div className="flex flex-wrap justify-center gap-3">

        {departments.map((dept, index) => (
          <motion.button
            key={dept}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: index * 0.03 }}

            onClick={() => setSelectedDepartment(dept)}

            className={`px-5 py-2 rounded-full font-semibold text-sm capitalize
                        transition-all duration-300 ease-in-out
                        hover:scale-105 ${
              selectedDepartment === dept
                ? "bg-blue-600 text-white shadow-lg scale-105"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-blue-50"
            }`}
          >
            {dept === 'all' ? t('all') : dept}
          </motion.button>
        ))}

      </div>

    </div>
  </div>

</section>

      {/* Principal Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle title="School Principal" />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-md mx-auto"
          >
            <StaffCard
              name="Sanjay Khadga"
              role="Principal"
              image="principal.png"
              department="Administration"
              delay={0}
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="mt-8 bg-blue-50 rounded-lg p-6 text-center"
            >
              <p className="text-gray-700 leading-relaxed italic">
                "Our mission is to create an environment where every student can thrive academically, socially, and emotionally. We are committed to providing world-class education and fostering character development."
              </p>
              <p className="text-gray-600 text-sm mt-4 font-semibold">- Sanjay Khadga</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Staff Grid */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Faculty Members"
            subtitle={`Showing ${filteredStaff.length} staff members`}
          />

          {filteredStaff.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredStaff.map((member, index) => (
                <StaffCard
                  key={member.id}
                  name={member.name}
                  role={member.role}
                  image={member.image}
                  department={member.department}
                  delay={index * 0.05}
                />
              ))}
            </div>
          ) : (
            <motion.div
             className="sticky top-16 md:top-20 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-md"
            >
              <p className="text-xl text-gray-600">
                No staff members found matching your search.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Non-Teaching Staff */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Administrative & Support Staff"
            subtitle="Dedicated team supporting school operations"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { position: 'School Administrator', name: 'Mr. Suresh Thapa', count: 2 },
              { position: 'Accountant', name: 'Mrs. Neha Joshi', count: 2 },
              { position: 'Laboratory Technician', name: 'Mr. Bikram Singh', count: 3 },
              { position: 'Librarian', name: 'Miss Anita Rai', count: 1 },
              { position: 'Hostel Warden', name: 'Mr. Ravi Kumar', count: 4 },
              { position: 'Sports Coach', name: 'Mr. Arjun Poudel', count: 3 },
            ].map((staff, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="bg-gradient-to-br from-blue-50 to-gray-50 rounded-lg p-6 shadow-lg hover:shadow-xl transition-all"
              >
                <h3 className="font-bold text-gray-900 mb-2">{staff.position}</h3>
                <p className="text-gray-600 text-sm mb-3">{staff.name}</p>
                <p className="text-xs text-gray-500">Team Size: {staff.count} members</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Staff CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto px-4 text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Want to Reach Out?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Contact us for any inquiries or to schedule a meeting with our staff
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 rounded-lg font-bold text-white transition-all text-lg"
            style={{ backgroundColor: COLORS.accent, color: '#000' }}
          >
            Contact Us
          </motion.button>
        </motion.div>
      </section>
    </div>
    </TranslateText>
  );
};

export default Staff;
