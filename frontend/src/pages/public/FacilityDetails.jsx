import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaArrowRight, FaTimes } from 'react-icons/fa';
import TranslateText from '../../components/public/TranslateText';
import { SCHOOL_INFO } from '../../constants/schoolData';
import { apiBaseURL } from '../../services/api';

const FacilityDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const API = apiBaseURL.replace(/\/api$/, '');

  const sanitizeText = (text) => {
    if (!text) return '';
    const lines = String(text).split(/\r?\n/).map(l => l.trim());
    const filtered = lines.filter(l => {
      if (!l) return false;
      if (/^#{1,6}\s*Sport\b/i.test(l)) return false;
      if (/^#{1,6}\s*(Features|Benefits for Students|Sport Champions?)\b/i.test(l)) return false;
      if (/^Sport Champions\b/i.test(l)) return false;
      if (/^Sport Champions\s*\d{4}\b/i.test(l)) return false;
      // remove specific unwanted promotional sentence and tuition mentions
      if (/provide.*food/i.test(l)) return false;
      if (/\b(tuiti?on)\b/i.test(l)) return false;
      return true;
    });
    return filtered.join('\n\n');
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/facilities/${id}`);
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) throw new Error('Invalid response');
        const body = await res.json();
        if (mounted) setFacility(body.data || null);
      } catch (e) {
        console.error('Failed to load facility', e);
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    if (facility && facility.photos && facility.photos.length) {
      setSelectedImage(facility.photos[0].url);
      setCurrentImageIndex(0);
    }
  }, [facility]);

  const images = (facility && facility.photos) ? facility.photos.map(p => p.url) : [];
  const currentImage = selectedImage || images[0];

  const nextImage = () => {
    if (!images.length) return;
    const nextIndex = (currentImageIndex + 1) % images.length;
    setCurrentImageIndex(nextIndex);
    setSelectedImage(images[nextIndex]);
  };

  const prevImage = () => {
    if (!images.length) return;
    const prevIndex = (currentImageIndex - 1 + images.length) % images.length;
    setCurrentImageIndex(prevIndex);
    setSelectedImage(images[prevIndex]);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (!facility) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Facility Not Found</h1>
        <button
          onClick={() => navigate('/facilities')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Facilities
        </button>
      </div>
    </div>
  );

  return (
    <TranslateText>
      <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/facilities')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-8 transition"
        >
          <FaArrowLeft /> Back to Facilities
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            {facility.facilityName}
          </h1>
          <p className="text-xl text-gray-600">{facility.shortDescription}</p>
        </motion.div>

        {/* Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-12"
        >
            <div className="relative h-96 md:h-[500px] bg-gray-900 flex items-center justify-center group">
            <img
              src={currentImage}
              alt={facility.facilityName}
              className="w-full h-full object-cover"
            />

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/75 transition opacity-0 group-hover:opacity-100"
                >
                  <FaArrowLeft size={20} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/75 transition opacity-0 group-hover:opacity-100"
                >
                  <FaArrowRight size={20} />
                </button>
              </>
            )}

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full">
                {currentImageIndex + 1} / {images.length}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="p-4 bg-gray-100 flex gap-4 overflow-x-auto">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedImage(img);
                    setCurrentImageIndex(index);
                  }}
                  className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition ${
                    currentImage === img ? 'border-blue-600' : 'border-gray-300'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${facility.facilityName} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Description */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-8 mb-8"
            >
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">About</h2>
                  <div className="max-h-[40vh] overflow-auto pr-2 whitespace-pre-line text-gray-700 text-lg leading-relaxed">
                  {facility.fullDescription || facility.shortDescription}
                </div>
            </motion.div>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Benefits for Students</h2>
                {(facility.benefits && facility.benefits.length) && (
                <div className="max-h-[40vh] overflow-auto pr-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {facility.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          ✓
                        </div>
                        <p className="text-gray-700">{benefit}</p>
                      </div>
                    ))}
                  </div>
                </div>
                )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Features */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-blue-50 rounded-2xl shadow-lg p-6 sticky top-24 max-h-[60vh] overflow-auto"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h2>
              <ul className="space-y-3">
                {(facility.features || []).map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-gray-700">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => window.location.href = `mailto:${SCHOOL_INFO.email}?subject=Facility%20Inquiry`}
                className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Inquire About This Facility
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
    </TranslateText>
  );
};

export default FacilityDetails;
