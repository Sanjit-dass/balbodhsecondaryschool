import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaFileAlt, FaQuestionCircle } from 'react-icons/fa';
import { SectionTitle } from '../../components/public/SectionComponents';
import TranslateText from '../../components/public/TranslateText';
import GoBackButton from '../../components/common/GoBackButton';
import { COLORS } from '../../constants/schoolData';
import api from '../../services/api';

const Admissions = () => {
  const [expandedFaq, setExpandedFaq] = useState(0);
  const [formData, setFormData] = useState({
    studentName: '',
    parentName: '',
    email: '',
    phone: '',
    class: '',
    address: '',
  });
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submittedApplicationId, setSubmittedApplicationId] = useState(null);

  const admissionProcess = [
    { step: 1, title: 'Application', description: 'Fill and submit the admission form' },
    { step: 2, title: 'Entrance Test', description: 'Appear for the entrance examination (if applicable)' },
    { step: 3, title: 'Verification', description: 'Document verification and verification process' },
    { step: 4, title: 'Confirmation', description: 'Payment of admission fees' },
    { step: 5, title: 'Enrollment', description: 'Official enrollment and orientation' },
  ];

  const eligibilityCriteria = [
    {
      class: 'Nursery',
      age: 'Age 3-4 years',
      requirements: 'Birth certificate, immunization record',
    },
    {
      class: 'Grade 1',
      age: 'Age 5-6 years',
      requirements: 'Birth certificate, preschool assessment',
    },
    {
      class: 'Grade 2-5',
      age: 'Age appropriate',
      requirements: 'Previous school report card',
    },
    {
      class: 'Grade 6-8',
      age: 'Age appropriate',
      requirements: 'Previous marks sheet, transfer certificate',
    },
    {
      class: 'Grade 9-10',
      age: 'Age appropriate',
      requirements: 'Entrance test, grade 8 transcript',
    },
    {
      class: 'Grade 11-12',
      age: 'Age appropriate',
      requirements: 'Entrance test, grade 10 marks',
    },
  ];

  const faqs = [
    {
      question: 'What is the admission fee?',
      answer:
        'Admission fees vary by class and are mentioned in the admission brochure. Please contact our admissions office for detailed fee structure.',
    },
    {
      question: 'What documents are required for admission?',
      answer:
        'Birth certificate, previous school documents, report cards, immunization certificate, and identity proof are generally required.',
    },
    {
      question: 'Is there a scholarship program?',
      answer:
        'Yes, we offer merit-based scholarships for outstanding students. Scholarship applications are invited annually.',
    },
    {
      question: 'What is the admission timeline?',
      answer:
        'Admissions are open from April to June for the upcoming academic year. Priority is given to early applicants.',
    },
    {
      question: 'Do you accept transfer students?',
      answer:
        'Yes, we accept transfer students subject to availability of seats and meeting eligibility criteria.',
    },
    {
      question: 'Is entrance test mandatory?',
      answer:
        'Entrance tests are mandatory for grades 9-12 and optional for lower grades. Results help in placement.',
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    (async () => {
      try {
        const res = await api.post('/admissions', formData);
        if (res?.status === 201) {
          const appId = res.data?.applicationId || null;
          setSubmittedApplicationId(appId);
          setSubmissionSuccess(true);
          setFormData({ studentName: '', parentName: '', email: '', phone: '', class: '', address: '' });
          // scroll to top so user sees confirmation
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          alert('Submission completed');
        }
      } catch (err) {
        console.error(err);
        alert('Submission failed. Please try again later.');
      }
    })();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <TranslateText>
      <div className="overflow-x-hidden">
      <GoBackButton label=" Back" color="blue" />
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
            Admissions
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg md:text-xl text-white/90"
          >
            Join Balbodh Secondary School and Start Your Journey of Excellence
          </motion.p>
        </div>
      </motion.section>

      {/* Admission Process */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Admission Process"
            subtitle="Five easy steps to join our school"
          />

          <div className="relative">
            {/* Desktop Timeline Line */}
            <div className="hidden md:block absolute top-20 left-0 right-0 h-1" style={{ background: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.secondary})` }}></div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 md:gap-4">
              {admissionProcess.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center relative"
                >
                  {/* Step Circle */}
                  <div className="flex justify-center mb-4 md:mb-6">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
                      style={{ backgroundColor: COLORS.secondary }}
                    >
                      {item.step}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="font-bold mb-2" style={{ color: COLORS.dark }}>{item.title}</h3>
                  <p className="text-sm" style={{ color: COLORS.slate }}>{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Eligibility Criteria */}
      <section className="py-16 md:py-24" style={{ backgroundColor: COLORS.gray }}>
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Eligibility Criteria"
            subtitle="Age and requirements for each grade"
          />

          <div className="overflow-x-auto bg-white rounded-xl shadow-xl">
            <table className="w-full">
              <thead className="text-white"
                style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})` }}
              >
                <tr>
                  <th className="px-6 py-4 text-left font-bold">Class</th>
                  <th className="px-6 py-4 text-left font-bold">Age Group</th>
                  <th className="px-6 py-4 text-left font-bold">Requirements</th>
                </tr>
              </thead>
              <tbody>
                {eligibilityCriteria.map((criteria, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    viewport={{ once: true }}
                    className="border-b hover:bg-blue-50 transition-colors"
                    style={{ borderColor: COLORS.lightGray }}
                  >
                    <td className="px-6 py-4 font-semibold" style={{ color: COLORS.dark }}>{criteria.class}</td>
                    <td className="px-6 py-4" style={{ color: COLORS.slate }}>{criteria.age}</td>
                    <td className="px-6 py-4" style={{ color: COLORS.slate }}>{criteria.requirements}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Required Documents */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle title="Required Documents" />

          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <div className="space-y-4">
                {[
                  'Original Birth Certificate (certified copy)',
                  'Previous school report card/marks sheet',
                  'Transfer Certificate (for transfer students)',
                  // 'Immunization/Health certificate' removed per request
                  'Parent/Guardian identification proof',
                  'Passport size photos (4 copies)',
                  'Proof of residential address',
                  'Character certificate (if applicable)',
                  // 'Medical fitness certificate' removed per request
                  'Entrance test admission letter (if applicable)',
                ].map((doc, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-4 p-4 rounded-lg hover:shadow-md transition-all duration-300"
                    style={{ backgroundColor: `${COLORS.secondary}10` }}
                  >
                    <FaCheckCircle
                      className="flex-shrink-0"
                      size={20}
                      style={{ color: COLORS.success }}
                    />
                    <span style={{ color: COLORS.dark }}>{doc}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="mt-8 p-6 rounded-xl shadow-lg"
              style={{ backgroundColor: `${COLORS.accent}15`, borderLeft: `4px solid ${COLORS.accent}` }}
            >
              <p className="text-sm" style={{ color: COLORS.dark }}>
                <strong>Note:</strong> All documents must be original or certified copies. Incomplete applications will not be processed.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Online Admission Form */}
      <section className="py-16 md:py-24 overflow-x-hidden" style={{ backgroundColor: COLORS.gray }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start max-w-7xl mx-auto px-4 overflow-x-hidden">
          <div className="w-full">
            <SectionTitle
              title="Online Admission Form"
              subtitle="Fill the form below to start your application"
            />

            <div className="mt-8 p-6 rounded-xl shadow-lg" style={{ backgroundColor: `${COLORS.primary}10`, borderLeft: `4px solid ${COLORS.primary}` }}>
              <h4 className="font-bold text-lg mb-3" style={{ color: COLORS.dark }}>Why Apply Online?</h4>
              <ul className="space-y-2" style={{ color: COLORS.slate }}>
                <li className="flex items-center gap-2">
                  <FaCheckCircle size={16} style={{ color: COLORS.secondary }} />
                  Quick and convenient application process
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle size={16} style={{ color: COLORS.secondary }} />
                  Track your application status
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle size={16} style={{ color: COLORS.secondary }} />
                  Receive updates via email and phone
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle size={16} style={{ color: COLORS.secondary }} />
                  Secure and confidential data handling
                </li>
              </ul>
            </div>
          </div>

          <div className="w-full bg-white rounded-2xl shadow-xl p-8 md:p-12 overflow-x-hidden">
            {submissionSuccess && (
              <div className="mb-6 p-6 rounded-xl border" style={{ backgroundColor: `${COLORS.success}10`, borderColor: COLORS.success }}>
                <h3 className="text-xl font-bold" style={{ color: COLORS.success }}>Application Submitted Successfully!</h3>
                <p className="mt-2" style={{ color: COLORS.slate }}>Thank you for applying to Bal Bodh Secondary School.</p>
                <p className="mt-2" style={{ color: COLORS.slate }}>Your admission application has been received successfully and is currently under review. Our admissions team will contact you shortly using the phone number provided in the application for further admission procedures and guidance.</p>
                <p className="mt-2" style={{ color: COLORS.slate }}>Please keep your phone available and check your contact details for accuracy.</p>
                {submittedApplicationId && (
                  <p className="mt-3 font-semibold" style={{ color: COLORS.dark }}>Application ID: {submittedApplicationId}</p>
                )}
                <p className="mt-3" style={{ color: COLORS.slate }}>We look forward to welcoming you to Bal Bodh Secondary School.</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6 overflow-hidden min-w-0 admissions-form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden min-w-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  viewport={{ once: true }}
                >
                  <label className="block font-semibold mb-2" style={{ color: COLORS.dark }}>
                    Student Name *
                  </label>
                  <input
                    type="text"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300"
                    style={{ borderColor: COLORS.lightGray, '--tw-ring-color': COLORS.secondary }}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <label className="block font-semibold mb-2" style={{ color: COLORS.dark }}>
                    Parent/Guardian Name *
                  </label>
                  <input
                    type="text"
                    name="parentName"
                    value={formData.parentName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300"
                    style={{ borderColor: COLORS.lightGray, '--tw-ring-color': COLORS.secondary }}
                  />
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="min-w-0"
                >
                  <label className="block font-semibold mb-2" style={{ color: COLORS.dark }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300"
                    style={{ borderColor: COLORS.lightGray, '--tw-ring-color': COLORS.secondary }}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="min-w-0"
                >
                  <label className="block font-semibold mb-2" style={{ color: COLORS.dark }}>
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300"
                    style={{ borderColor: COLORS.lightGray, '--tw-ring-color': COLORS.secondary }}
                  />
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                viewport={{ once: true }}
                className="min-w-0 w-full overflow-hidden"
              >
                <label className="block font-semibold mb-2" style={{ color: COLORS.dark }}>
                  Applying for Class *
                </label>
                <div className="w-full max-w-full min-w-0 overflow-hidden select-wrapper">
                  <select
                    name="class"
                    value={formData.class}
                    onChange={handleChange}
                    required
                    className="block w-full max-w-full min-w-0 appearance-none px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300"
                    style={{ borderColor: COLORS.lightGray, '--tw-ring-color': COLORS.secondary, boxSizing: 'border-box' }}
                  >
                    <option value="">Select Class</option>
                    {['Nursery', 'LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map(
                      (grade) => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                viewport={{ once: true }}
              >
                <label className="block font-semibold mb-2" style={{ color: COLORS.dark }}>
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300"
                  style={{ borderColor: COLORS.lightGray, '--tw-ring-color': COLORS.secondary }}
                ></textarea>
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-white transition-all text-lg shadow-lg hover:shadow-xl"
                style={{ backgroundColor: COLORS.secondary }}
              >
                Submit Application
              </motion.button>
            </form>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <SectionTitle
            title="Frequently Asked Questions"
            subtitle="Answers to common admission queries"
          />

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <button
                  onClick={() =>
                    setExpandedFaq(expandedFaq === index ? -1 : index)
                  }
                  className="w-full p-6 rounded-xl text-left hover:shadow-lg transition-all duration-300 flex items-center justify-between"
                  style={{ backgroundColor: COLORS.gray, borderLeft: `4px solid ${COLORS.secondary}` }}
                >
                  <span className="font-semibold flex items-center gap-3" style={{ color: COLORS.dark }}>
                    <FaQuestionCircle style={{ color: COLORS.secondary }} />
                    {faq.question}
                  </span>
                  <span
                    className="transition-transform"
                    style={{
                      color: COLORS.slate,
                      transform:
                        expandedFaq === index ? 'rotate(180deg)' : 'rotate(0)',
                    }}
                  >
                    ▼
                  </span>
                </button>

                <motion.div
                  initial={false}
                  animate={{
                    height: expandedFaq === index ? 'auto' : 0,
                    opacity: expandedFaq === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white p-6 rounded-b-xl border-l-4" style={{ color: COLORS.slate, borderLeftColor: COLORS.accent }}>
                    {faq.answer}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
    </TranslateText>
  );
};

export default Admissions;
