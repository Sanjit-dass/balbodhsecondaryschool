import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaFileAlt, FaQuestionCircle } from 'react-icons/fa';
import { SectionTitle } from '../../components/public/SectionComponents';
import TranslateText from '../../components/public/TranslateText';
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
      {/* Page Header */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-16 md:py-24"
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Admissions</h1>
          <p className="text-lg text-blue-100">
            Join Balbodh Secondary School and Start Your Journey of Excellence
          </p>
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
            <div className="hidden md:block absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>

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
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                      style={{ backgroundColor: COLORS.secondary }}
                    >
                      {item.step}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Eligibility Criteria */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Eligibility Criteria"
            subtitle="Age and requirements for each grade"
          />

          <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-900 to-blue-700 text-white">
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
                    className="border-b border-gray-200 hover:bg-blue-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900">{criteria.class}</td>
                    <td className="px-6 py-4 text-gray-600">{criteria.age}</td>
                    <td className="px-6 py-4 text-gray-600">{criteria.requirements}</td>
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
              className="bg-white rounded-lg p-8 shadow-lg"
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
                    className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <FaCheckCircle
                      className="text-green-500 flex-shrink-0"
                      size={20}
                    />
                    <span className="text-gray-700">{doc}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="mt-8 p-6 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg"
            >
              <p className="text-sm text-yellow-900">
                <strong>Note:</strong> All documents must be original or certified copies. Incomplete applications will not be processed.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Online Admission Form */}
      <section className="py-16 md:py-24 bg-gray-50 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 overflow-x-hidden">
          <SectionTitle
            title="Online Admission Form"
            subtitle="Fill the form below to start your application"
          />

          <div className="max-w-2xl w-full mx-auto bg-white rounded-lg shadow-lg p-8 md:p-12 overflow-x-hidden">
            {submissionSuccess && (
              <div className="mb-6 p-6 rounded-lg bg-green-50 border border-green-200">
                <h3 className="text-xl font-bold text-green-800">Application Submitted Successfully!</h3>
                <p className="mt-2 text-gray-700">Thank you for applying to Bal Bodh Secondary School.</p>
                <p className="mt-2 text-gray-700">Your admission application has been received successfully and is currently under review. Our admissions team will contact you shortly using the phone number provided in the application for further admission procedures and guidance.</p>
                <p className="mt-2 text-gray-700">Please keep your phone available and check your contact details for accuracy.</p>
                {submittedApplicationId && (
                  <p className="mt-3 font-semibold">Application ID: {submittedApplicationId}</p>
                )}
                <p className="mt-3 text-gray-700">We look forward to welcoming you to Bal Bodh Secondary School.</p>
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
                  <label className="block text-gray-700 font-semibold mb-2">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': COLORS.secondary }}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <label className="block text-gray-700 font-semibold mb-2">
                    Parent/Guardian Name *
                  </label>
                  <input
                    type="text"
                    name="parentName"
                    value={formData.parentName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': COLORS.secondary }}
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
                  <label className="block text-gray-700 font-semibold mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': COLORS.secondary }}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="min-w-0"
                >
                  <label className="block text-gray-700 font-semibold mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': COLORS.secondary }}
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
                <label className="block text-gray-700 font-semibold mb-2">
                  Applying for Class *
                </label>
                <div className="w-full max-w-full min-w-0 overflow-hidden select-wrapper">
                  <select
                    name="class"
                    value={formData.class}
                    onChange={handleChange}
                    required
                    className="block w-full max-w-full min-w-0 appearance-none px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': COLORS.secondary, boxSizing: 'border-box' }}
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
                <label className="block text-gray-700 font-semibold mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': COLORS.secondary }}
                ></textarea>
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="w-full py-3 rounded-lg font-bold text-white transition-all text-lg"
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
                  className="w-full bg-gradient-to-r from-blue-50 to-gray-50 p-6 rounded-lg text-left hover:shadow-lg transition-all flex items-center justify-between border-l-4"
                  style={{ borderLeftColor: COLORS.secondary }}
                >
                  <span className="font-semibold text-gray-900 flex items-center gap-3">
                    <FaQuestionCircle style={{ color: COLORS.secondary }} />
                    {faq.question}
                  </span>
                  <span
                    className="text-gray-600 transition-transform"
                    style={{
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
                  <div className="bg-white p-6 text-gray-600 border-l-4" style={{ borderLeftColor: COLORS.accent }}>
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
