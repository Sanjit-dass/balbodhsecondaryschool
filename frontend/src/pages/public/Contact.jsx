import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaFacebook,
  FaTwitter,
  FaYoutube,
  FaInstagram,
} from 'react-icons/fa';
import api from '../../services/api';
import { SectionTitle } from '../../components/public/SectionComponents';
import TranslateText from '../../components/public/TranslateText';
import { SCHOOL_INFO, COLORS } from '../../constants/schoolData';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const [submitting, setSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmissionStatus(null);

    try {
      const response = await api.post('/contact', formData);
      if (response.status === 201) {
        setSubmissionStatus({ type: 'success', message: response.data?.message || 'Your message has been sent.' });
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setSubmissionStatus({ type: 'success', message: response.data?.message || 'Your message has been sent.' });
      }
    } catch (err) {
      console.error('Contact submit failed', err);
      const errorMessage = err?.response?.data?.message || 'Failed to send your message. Please try again later.';
      setSubmissionStatus({ type: 'error', message: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToForm = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const el = document.getElementById('contact-form');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    else window.location.hash = '#contact-form';
  };

  // Map coordinates and URLs (used by map embed and CTA buttons)
  const MAP_LAT = 26.6351401;
  const MAP_LNG = 86.9133698;
  const MAP_QUERY = `${MAP_LAT},${MAP_LNG}`;
  const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${MAP_QUERY}`;
  const OPEN_MAP_URL = SCHOOL_INFO && SCHOOL_INFO.mapsLink ? SCHOOL_INFO.mapsLink : `https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`;

  const contactMethods = [
    {
      icon: FaPhone,
      title: 'Phone',
      value: SCHOOL_INFO.phone,
      subtext: 'Monday - Friday: 9:00 AM - 5:00 PM',
    },
    {
      icon: FaEnvelope,
      title: 'Email',
      value: SCHOOL_INFO.email,
      subtext: 'Response within 24 hours',
    },
    {
      icon: FaMapMarkerAlt,
      title: 'Address',
      value: SCHOOL_INFO.address,
      subtext: 'Visit us anytime',
    },
    {
      icon: FaClock,
      title: 'Office Hours',
      value: '7:00 AM - 4:00 PM',
      subtext: 'Monday to Friday',
    },
  ];

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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-lg text-blue-100">
            We'd love to hear from you. Get in touch with us today
          </p>
        </div>
      </motion.section>

      {/* Contact Methods */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Get in Touch"
            subtitle="Multiple ways to reach us"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -10 }}
                  className="bg-gradient-to-br from-blue-50 to-gray-50 rounded-lg p-8 shadow-lg hover:shadow-xl transition-all text-center"
                >
                  <div className="flex justify-center mb-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl"
                      style={{ backgroundColor: COLORS.secondary }}
                    >
                      <Icon />
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{method.title}</h3>
                  <p className="text-gray-600 font-semibold mb-1">{method.value}</p>
                  <p className="text-gray-500 text-sm">{method.subtext}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Send us a Message</h2>

              <form id="contact-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  viewport={{ once: true }}
                >
                  <label className="block text-gray-700 font-semibold mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': COLORS.secondary }}
                  />
                </motion.div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    viewport={{ once: true }}
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': COLORS.secondary }}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    viewport={{ once: true }}
                  >
                    <label className="block text-gray-700 font-semibold mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': COLORS.secondary }}
                    />
                  </motion.div>
                </div>

                {/* Subject */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <label className="block text-gray-700 font-semibold mb-2">
                    Subject *
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': COLORS.secondary }}
                  >
                    <option value="">Select a subject</option>
                    <option value="admission">Admission Inquiry</option>
                    <option value="fees">Fees & Payment</option>
                    <option value="academics">Academics</option>
                    <option value="facilities">Facilities</option>
                    <option value="other">Other</option>
                  </select>
                </motion.div>

                {/* Message */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <label className="block text-gray-700 font-semibold mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="5"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 resize-none"
                    style={{ '--tw-ring-color': COLORS.secondary }}
                  ></textarea>
                </motion.div>

                {/* Submit Button */}
                {submissionStatus ? (
                  <div className={`rounded-lg p-4 text-sm font-semibold ${submissionStatus.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {submissionStatus.message}
                  </div>
                ) : null}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-lg font-bold text-white transition-all text-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: COLORS.secondary }}
                >
                  {submitting ? 'Sending...' : 'Send Message'}
                </motion.button>
              </form>
            </motion.div>

            {/* Map & Social Media */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              {/* Map Embed */}
              <div className="rounded-lg overflow-hidden shadow-lg bg-white w-full">
                {/* Map header */}
                <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-white">
                  <h3 className="text-2xl font-bold text-gray-900">Our Location</h3>
                  <p className="text-sm text-gray-600">Bal Bodh Secondary School<br/>Kanchanpur, Saptari, Nepal</p>
                </div>

                {/* Map iframe and actions */}
                <div className="w-full h-72 md:h-96">
                  {/* Using specific coordinates for Bal Bodh location */}
                  {(() => {
                    const lat = 26.6351401;
                    const lng = 86.9133698;
                    const mapsQuery = `${lat},${lng}`;
                    const embedSrc = `https://www.google.com/maps?q=${mapsQuery}&z=17&output=embed`;
                    const mapsPlaceUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
                    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`;
                    const openUrl = SCHOOL_INFO && SCHOOL_INFO.mapsLink ? SCHOOL_INFO.mapsLink : mapsPlaceUrl;

                    return (
                      <div className="w-full h-full flex flex-col">
                        <iframe
                          src={embedSrc}
                          width="100%"
                          height="100%"
                          className="border-0 w-full h-full"
                          loading="lazy"
                          title="Bal Bodh Secondary School Location"
                        />

                          <div className="p-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-900">Bal Bodh Secondary School</p>
                            <p className="text-sm text-gray-600">Kanchanpur, Saptari, Nepal</p>
                          </div>

                          <div className="flex gap-3">
                            <button onClick={scrollToForm} className="px-4 py-2 bg-green-600 text-white rounded-lg shadow">Schedule a School Visit</button>
                            <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 border border-gray-200 rounded-lg">Get Directions</a>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Social Media */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Connect With Us</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    SCHOOL_INFO.facebook ? { icon: FaFacebook, name: 'Facebook', url: SCHOOL_INFO.facebook, color: '#1877F2' } : null,
                    SCHOOL_INFO.twitter ? { icon: FaTwitter, name: 'Twitter', url: SCHOOL_INFO.twitter, color: '#1DA1F2' } : null,
                    SCHOOL_INFO.youtube ? { icon: FaYoutube, name: 'YouTube', url: SCHOOL_INFO.youtube, color: '#FF0000' } : null,
                    SCHOOL_INFO.instagram ? { icon: FaInstagram, name: 'Instagram', url: SCHOOL_INFO.instagram, color: '#E4405F' } : null,
                  ].filter(Boolean).map((social, index) => {
                    const Icon = social.icon;
                    return (
                      <motion.a
                        key={index}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center justify-center gap-3 p-4 rounded-lg bg-white shadow-lg hover:shadow-xl transition-all"
                      >
                        <Icon size={24} style={{ color: social.color }} />
                        <span className="font-semibold text-gray-700">
                          {social.name}
                        </span>
                      </motion.a>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ & Additional Info */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Frequently Asked Questions"
            subtitle="Quick answers to common queries"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
                {
                q: 'What are the visiting hours?',
                a: 'School is open for visitors from 7:00 AM to 4:00 PM on weekdays. Please call ahead to schedule a visit.',
              },
              {
                q: 'How can I enroll my child?',
                a: 'You can download the admission form from our website or contact the admissions office directly.',
              },
              {
                q: 'What is the fee structure?',
                a: 'Fee structure varies by class. Please visit the Admissions page or contact us for detailed information.',
              },
              {
                q: 'How can I contact a specific teacher?',
                a: 'You can reach out to teachers through our main office or email. We will facilitate the connection.',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-blue-50 to-gray-50 rounded-lg p-6 shadow-lg"
              >
                <h3 className="font-bold text-gray-900 mb-3">{item.q}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Location Card */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white rounded-lg shadow-xl p-8 md:p-12 text-center"
          >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Visit Our School
            </h2>
            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
              We invite you to visit our state-of-the-art school and experience the Balbodh difference. Our team will be happy to show you around and answer any questions you may have.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 rounded-lg font-bold text-white transition-all"
                style={{ backgroundColor: COLORS.secondary }}
                onClick={scrollToForm}
              >
                Schedule a School Visit
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 rounded-lg font-bold border-2 transition-all"
                style={{ borderColor: COLORS.secondary, color: COLORS.secondary }}
                onClick={() => window.open(DIRECTIONS_URL, '_blank', 'noopener')}
              >
                Get Directions
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
    </TranslateText>
  );
};

export default Contact;
