import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaSearch } from 'react-icons/fa';
import { SectionTitle, StaffCard } from '../../components/public/SectionComponents';
import TranslateText from '../../components/public/TranslateText';
import StaffModal from '../../components/public/StaffModal';
import GoBackButton from '../../components/common/GoBackButton';
import { COLORS } from '../../constants/schoolData';
import { useTranslate } from '../../hooks/useTranslate';
import api from '../../services/api';
import { useEffect } from 'react';

const Staff = () => {
  const { t } = useTranslate();
  const [searchTerm, setSearchTerm] = useState('');
  // department filter removed
  const [staffData, setStaffData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
      const fetchStaff = async () => {
      try {
        const res = await api.get('/staff-leadership');
        if (!mounted) return;
        const list = (res.data && res.data.data) ? res.data.data : [];
        // Only include staff with valid photo URLs to avoid showing deleted images or demo entries
        const valid = Array.isArray(list) ? list.filter(m => m && m.photo && m.photo.url) : [];
        setStaffData(valid);
      } catch (err) {
        console.error('Failed to fetch staff', err);
        setStaffData([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchStaff();
    return () => { mounted = false; };
  }, []);

  const uniqueDesignationsCount = Array.from(new Set(staffData.map(s => s.designation).filter(Boolean))).length;

  const [selectedStaff, setSelectedStaff] = useState(null);

  const filteredStaff = staffData.filter((member) => {
    const matchesSearch = (member.fullName || member.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.designation || member.role || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">{t('staffTitle')}</h1>
          <p className="text-lg text-white/90">
            {t('staffSubtitle')}
          </p>
        </div>
      </motion.section>

      {/* Staff Stats - attractive design with white text */}
      <section className="py-6 md:py-8 bg-gradient-to-r from-blue-800 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center max-w-3xl mx-auto">
            {[
              { label: 'Teachers', value: staffData.length },
              { label: 'Designations', value: uniqueDesignationsCount },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 bg-white/06 backdrop-blur-sm rounded-xl p-5 md:p-6 shadow-md border border-white/10"
              >
                <div className="flex-none">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg bg-white/10 flex items-center justify-center">
                    <p className="text-2xl md:text-3xl font-extrabold text-white">{stat.value}</p>
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <p className="uppercase text-sm tracking-wider text-white/90 font-semibold">{stat.label}</p>
                  <p className="mt-1 text-white/80 text-sm">&nbsp;</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Faculty Members (moved up immediately after stats) */}
      <section className="py-6 md:py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Faculty Members"
            subtitle={`Showing ${filteredStaff.length} staff members`}
          />

          {/* Search bar placed at top of Faculty Members */}
          <div className="max-w-3xl mx-auto mb-6">
            <div className="relative">
              <FaSearch className="absolute left-4 top-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={t('search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
              />
            </div>
          </div>

          {filteredStaff.length > 0 ? (
            <div className="max-h-[60vh] md:max-h-[70vh] overflow-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredStaff.map((member, index) => (
                  <StaffCard
                    key={member._id || index}
                    name={member.fullName || member.name}
                    role={member.designation || member.role}
                    image={(member.photo && member.photo.url) || member.image}
                    department={member.department}
                    delay={index * 0.05}
                    onClick={() => { console.log('Staff list click:', member && (member.fullName || member._id)); setSelectedStaff(member); }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xl text-gray-600">No staff members found matching your search.</p>
            </div>
          )}
        </div>
      </section>

      {/* Removed separate sticky search — search now at top of Faculty Members */}

      {/* Principal / duplicated sections removed — Faculty shown above and Admin/Support section deleted */}

      {/* Staff Detail Modal */}
      {selectedStaff ? (
        <StaffModal staff={selectedStaff} onClose={() => setSelectedStaff(null)} />
      ) : null}

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
