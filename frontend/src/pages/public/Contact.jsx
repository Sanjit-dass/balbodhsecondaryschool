import React, { useState, useEffect } from 'react';
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
import api, { apiBaseURL, API_BASE } from '../../services/api';
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
  const [diagStatus, setDiagStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmissionStatus(null);
    // Basic client-side validation to avoid unnecessary 400 responses
    try {
      if (!formData.name || String(formData.name).trim() === '') throw new Error('Name is required');
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(formData.email))) throw new Error('A valid email is required');
      const okSubjects = ['admission', 'fees', 'academics', 'facilities', 'other'];
      if (!formData.subject || !okSubjects.includes(formData.subject)) throw new Error('Please select a subject');
      if (!formData.message || String(formData.message).trim() === '') throw new Error('Message is required');
    } catch (clientErr) {
      setSubmissionStatus({ type: 'error', message: clientErr.message });
      setSubmitting(false);
      return;
    }

    try {
      const response = await api.post('/contact', formData);
      if (response.status === 201) {
        setSubmissionStatus({ type: 'success', message: response.data?.message || 'Your message has been sent.' });
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setSubmissionStatus({ type: 'success', message: response.data?.message || 'Your message has been sent.' });
      }
    } catch (err) {
      console.error('Contact submit failed (axios):', err);
      // If no response (network error / CORS / unreachable host), try fallbacks
      if (err && err.request && !err.response) {
        try {
          console.debug('[Contact] no axios response — attempting fetch fallback to apiBaseURL', apiBaseURL, API_BASE);
          const candidates = [];
          if (apiBaseURL) candidates.push(`${apiBaseURL}/contact`);
          if (API_BASE) candidates.push(`${API_BASE}/api/contact`);
          try { candidates.push(`${window.location.origin}/api/contact`); } catch(e) {}

          let ok = false;
          let fetchErr = null;
          for (const url of candidates) {
            try {
              console.debug('[Contact] trying fallback URL', url);
              const fres = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
              });
              if (fres && (fres.status === 200 || fres.status === 201)) {
                const body = await fres.json().catch(()=>({}));
                setSubmissionStatus({ type: 'success', message: body?.message || 'Your message has been sent.' });
                setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
                ok = true;
                break;
              } else {
                fetchErr = fetchErr || new Error('fallback failed: ' + (fres && fres.status));
              }
            } catch (e) {
              fetchErr = e;
            }
          }
          if (ok) {
            // success via fallback
          } else {
            console.error('[Contact] all fallbacks failed', fetchErr);
            const msg = (fetchErr && fetchErr.message) ? `Network error: ${fetchErr.message}` : 'Failed to send your message. Please check your network or try again later.';
            setSubmissionStatus({ type: 'error', message: msg });
          }
        } catch (fallbackErr) {
          console.error('[Contact] fallback attempt error', fallbackErr);
          setSubmissionStatus({ type: 'error', message: 'Failed to send your message. Please try again later.' });
        }
      } else {
        // If server returned validation errors, show them
        try {
          const resp = err.response && err.response.data;
          if (resp) {
            if (Array.isArray(resp.errors) && resp.errors.length > 0) {
              const msgs = resp.errors.map(e => (e.msg ? `${e.param}: ${e.msg}` : JSON.stringify(e))).join(' | ');
              setSubmissionStatus({ type: 'error', message: msgs });
            } else if (resp.message) {
              setSubmissionStatus({ type: 'error', message: resp.message });
            } else {
              setSubmissionStatus({ type: 'error', message: 'Failed to send your message. Please try again later.' });
            }
          } else {
            setSubmissionStatus({ type: 'error', message: 'Failed to send your message. Please try again later.' });
          }
        } catch (e) {
          setSubmissionStatus({ type: 'error', message: 'Failed to send your message. Please try again later.' });
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const runDiagnostics = async () => {
    setDiagStatus({ running: true, results: [] });
    const candidates = [];
    if (apiBaseURL) candidates.push({ url: `${apiBaseURL}/contact`, label: 'apiBaseURL/contact' });
    if (API_BASE) candidates.push({ url: `${API_BASE}/api/contact`, label: 'API_BASE/api/contact' });
    try { candidates.push({ url: `${window.location.origin}/api/contact`, label: 'origin/api/contact' }); } catch(e){}

    const results = [];
    for (const c of candidates) {
      try {
        console.debug('[Contact][diag] testing', c.url);
        const res = await fetch(c.url, { method: 'OPTIONS' });
        results.push({ url: c.url, ok: res.ok, status: res.status, type: 'options' });
      } catch (e) {
        results.push({ url: c.url, ok: false, error: String(e && e.message), type: 'error' });
      }
    }
    setDiagStatus({ running: false, results });
    console.debug('[Contact][diag] results', results);
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

  // If URL contains ?focus=phone then scroll to form and focus phone input
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const focus = params.get('focus');
      if (focus === 'phone') {
        const el = document.querySelector('#contact-form input[name="phone"]');
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          // fallback: scroll to form and try again shortly after render
          scrollToForm();
          setTimeout(() => {
            const el2 = document.querySelector('#contact-form input[name="phone"]');
            if (el2) el2.focus();
          }, 350);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <TranslateText>
      <div>
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
            Contact Us
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg md:text-xl text-white/90"
          >
            We'd love to hear from you. Get in touch with us today
          </motion.p>
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
                  className="rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all text-center"
                  style={{ background: `linear-gradient(135deg, ${COLORS.gray}, white)` }}
                >
                  <div className="flex justify-center mb-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                      style={{ backgroundColor: COLORS.secondary }}
                    >
                      <Icon />
                    </div>
                  </div>
                  <h3 className="font-bold mb-2" style={{ color: COLORS.dark }}>{method.title}</h3>
                  <p className="font-semibold mb-1" style={{ color: COLORS.dark }}>{method.value}</p>
                  <p className="text-sm" style={{ color: COLORS.slate }}>{method.subtext}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-16 md:py-24" style={{ backgroundColor: COLORS.gray }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-8" style={{ color: COLORS.dark }}>Send us a Message</h2>

              <form id="contact-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  viewport={{ once: true }}
                >
                  <label className="block font-semibold mb-2" style={{ color: COLORS.dark }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300"
                    style={{ borderColor: COLORS.lightGray, '--tw-ring-color': COLORS.secondary }}
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
                    <label className="block font-semibold mb-2" style={{ color: COLORS.dark }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300"
                      style={{ borderColor: COLORS.lightGray, '--tw-ring-color': COLORS.secondary }}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    viewport={{ once: true }}
                  >
                    <label className="block font-semibold mb-2" style={{ color: COLORS.dark }}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300"
                      style={{ borderColor: COLORS.lightGray, '--tw-ring-color': COLORS.secondary }}
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
                  <label className="block font-semibold mb-2" style={{ color: COLORS.dark }}>
                    Subject *
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300"
                    style={{ borderColor: COLORS.lightGray, '--tw-ring-color': COLORS.secondary }}
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
                  <label className="block font-semibold mb-2" style={{ color: COLORS.dark }}>
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="5"
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 resize-none transition-all duration-300"
                    style={{ borderColor: COLORS.lightGray, '--tw-ring-color': COLORS.secondary }}
                  ></textarea>
                </motion.div>

                {/* Submit Button */}
                {submissionStatus ? (
                  <div className="rounded-xl p-4 text-sm font-semibold shadow-lg"
                    style={{ 
                      backgroundColor: submissionStatus.type === 'success' ? `${COLORS.success}10` : `${COLORS.error}10`,
                      color: submissionStatus.type === 'success' ? COLORS.success : COLORS.error,
                      border: `1px solid ${submissionStatus.type === 'success' ? COLORS.success : COLORS.error}`
                    }}
                  >
                    {submissionStatus.message}
                  </div>
                ) : null}
                {diagStatus && diagStatus.results ? (
                  <div className="mt-4 text-sm">
                    {diagStatus.running ? (
                      <div className="rounded-lg p-3 bg-yellow-50 text-yellow-800">Running diagnostics…</div>
                    ) : (
                      <div className="space-y-2">
                        {diagStatus.results.map((r, i) => (
                          <div key={i} className={`rounded-md p-2 ${r.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                            <div className="font-semibold">{r.url}</div>
                            <div className="text-xs">{r.ok ? `OK (${r.status || 'n/a'})` : `Error: ${r.error || 'no response'}`}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl font-bold text-white transition-all text-lg disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
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
              <div className="rounded-2xl overflow-hidden shadow-2xl bg-white w-full">
                {/* Map header */}
                <div className="p-6 border-b" style={{ background: `linear-gradient(to right, ${COLORS.gray}, white)`, borderColor: COLORS.lightGray }}>
                  <h3 className="text-2xl font-bold" style={{ color: COLORS.dark }}>Our Location</h3>
                  <p className="text-sm" style={{ color: COLORS.slate }}>Bal Bodh Secondary School<br/>Kanchanpur, Saptari, Nepal</p>
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
                            <p className="font-semibold" style={{ color: COLORS.dark }}>Bal Bodh Secondary School</p>
                            <p className="text-sm" style={{ color: COLORS.slate }}>Kanchanpur, Saptari, Nepal</p>
                          </div>

                          <div className="flex gap-3">
                            <button onClick={scrollToForm} className="px-4 py-2 text-white rounded-lg shadow-lg hover:shadow-xl transition-all" style={{ backgroundColor: COLORS.success }}>Schedule a School Visit</button>
                            <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all" style={{ border: `1px solid ${COLORS.lightGray}`, color: COLORS.dark }}>Get Directions</a>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Social Media */}
              <div>
                <h3 className="text-2xl font-bold mb-6" style={{ color: COLORS.dark }}>Connect With Us</h3>
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
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center justify-center gap-3 p-4 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Icon size={24} style={{ color: social.color }} />
                        <span className="font-semibold" style={{ color: COLORS.dark }}>
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
                className="rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300"
                style={{ background: `linear-gradient(135deg, ${COLORS.gray}, white)` }}
              >
                <h3 className="font-bold mb-3" style={{ color: COLORS.dark }}>{item.q}</h3>
                <p className="text-sm leading-relaxed" style={{ color: COLORS.slate }}>{item.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Location Card */}
      <section className="py-16 md:py-24" style={{ backgroundColor: COLORS.gray }}>
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center"
          >
              <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: COLORS.dark }}>
              Visit Our School
            </h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: COLORS.slate }}>
              We invite you to visit our state-of-the-art school and experience the Balbodh difference. Our team will be happy to show you around and answer any questions you may have.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3.5 rounded-xl font-bold text-white transition-all shadow-xl hover:shadow-2xl"
                style={{ backgroundColor: COLORS.secondary }}
                onClick={scrollToForm}
              >
                Schedule a School Visit
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3.5 rounded-xl font-bold border-2 transition-all shadow-lg hover:shadow-xl"
                style={{ borderColor: COLORS.secondary, color: COLORS.secondary, backgroundColor: 'transparent' }}
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
