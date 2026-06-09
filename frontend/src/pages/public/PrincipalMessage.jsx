import React from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import TranslateText from '../../components/public/TranslateText';
import { PRINCIPAL_MESSAGE } from '../../constants/schoolData';

const PrincipalMessagePage = () => {
  const navigate = useNavigate();

  return (
    <TranslateText>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-8 transition"
        >
          <FaArrowLeft /> Back
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Principal's Message
          </h1>
          <p className="text-xl text-gray-600">
            A message from the leadership of Bal Bodh Secondary School
          </p>
        </motion.div>

        {/* Principal Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-12"
        >
          <div className="md:flex">
            {/* Image */}
            <div className="md:w-1/3">
              <img
                src={PRINCIPAL_MESSAGE.image}
                alt={PRINCIPAL_MESSAGE.name}
                className="w-full h-96 md:h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="md:w-2/3 p-8 md:p-12 flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {PRINCIPAL_MESSAGE.name}
              </h2>
              <p className="text-xl text-blue-600 font-semibold mb-6">
                {PRINCIPAL_MESSAGE.designation}
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                Dedicated to educational excellence and student development.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Full Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-gray-700 leading-relaxed"
        >
          {PRINCIPAL_MESSAGE.fullMessage.split('\n\n').map((paragraph, index) => (
            <p key={index} className="mb-6 text-lg first:text-blue-700 first:font-semibold">
              {paragraph}
            </p>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Join Bal Bodh?
          </h3>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/admissions')}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-lg"
            >
              Start Your Journey
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="px-8 py-4 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-semibold text-lg"
            >
              Get in Touch
            </button>
          </div>
        </motion.div>
      </div>
    </div>
    </TranslateText>
  );
};

export default PrincipalMessagePage;
