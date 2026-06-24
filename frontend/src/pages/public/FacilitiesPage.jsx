import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaFilter, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import ResponsiveSelect from '../../components/ResponsiveSelect';
import { apiBaseURL } from '../../services/api';

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'gallery'
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const API = apiBaseURL.replace(/\/api$/, '');

  const categories = ['All', 'Academic', 'Technology', 'Science', 'Sports', 'Hostel', 'Library', 'Transportation', 'Medical', 'Infrastructure', 'Other'];

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/facilities`);
      if (!res.ok) throw new Error('Failed to load facilities');
      const body = await res.json();
      const list = Array.isArray(body.data) ? body.data : [];
      list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setFacilities(list);
    } catch (err) {
      console.error(err);
      setFacilities([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter facilities
  const filteredFacilities = facilities.filter(facility => {
    const matchesSearch = facility.facilityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         facility.shortDescription.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || facility.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleFacilityClick = (facility) => {
    setSelectedFacility(facility);
    const coverPhotoIndex = facility.coverPhoto
      ? facility.photos?.findIndex(p => String(p._id) === String(facility.coverPhoto))
      : 0;
    setCurrentPhotoIndex(coverPhotoIndex >= 0 ? coverPhotoIndex : 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">World-Class Facilities</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our state-of-the-art infrastructure designed to provide the best learning environment for our students.
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search facilities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <div className="pl-12">
                <ResponsiveSelect
                  value={selectedCategory}
                  onChange={(v) => setSelectedCategory(v)}
                  options={categories.map(c => ({ value: c, label: c }))}
                  placeholder="All"
                  className="w-56"
                  maxHeight={360}
                />
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('gallery')}
                className={`px-4 py-3 rounded-xl font-medium transition-all ${viewMode === 'gallery' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Gallery
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-gray-600">
          Showing {filteredFacilities.length} {filteredFacilities.length === 1 ? 'facility' : 'facilities'}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading facilities...</p>
          </div>
        )}

        {/* No Results */}
        {!loading && filteredFacilities.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No facilities found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Facilities Grid */}
        {!loading && filteredFacilities.length > 0 && (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' 
            : 'grid grid-cols-1 md:grid-cols-2 gap-8'
          }>
            {filteredFacilities.map((facility, index) => (
              <FacilityCard
                key={facility._id}
                facility={facility}
                onClick={() => handleFacilityClick(facility)}
                delay={index * 0.1}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}

        {/* Modal */}
        {selectedFacility && (
          <FacilityModal
            facility={selectedFacility}
            onClose={() => setSelectedFacility(null)}
            currentPhotoIndex={currentPhotoIndex}
            setCurrentPhotoIndex={setCurrentPhotoIndex}
          />
        )}
      </div>
    </div>
  );
}

function FacilityCard({ facility, onClick, delay, viewMode }) {
  const coverPhoto = facility.coverPhoto
    ? facility.photos?.find(p => String(p._id) === String(facility.coverPhoto))
    : facility.photos?.[0];

  const imageUrl = coverPhoto?.url || facility.photos?.[0]?.url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl overflow-hidden cursor-pointer transition-all duration-500"
      onClick={onClick}
    >
      {/* Cover Photo */}
      <div className={`relative ${viewMode === 'gallery' ? 'h-80' : 'h-64'} overflow-hidden`}>
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={facility.facilityName}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center">
            <span className="text-white text-6xl font-bold tracking-wider">{facility.facilityName?.charAt(0) || 'F'}</span>
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
          <span className="text-xs font-semibold text-gray-800">
            {facility.category || 'Infrastructure'}
          </span>
        </div>

        {/* Featured Badge */}
        {facility.featured && (
          <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 px-3 py-1.5 rounded-full shadow-lg">
            <span className="text-xs font-semibold">⭐ Featured</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {facility.facilityName}
        </h3>
        <p className="text-gray-600 text-sm mb-5 line-clamp-2 leading-relaxed">
          {facility.shortDescription}
        </p>

        {/* View More Button */}
        <button className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl">
          View Details
        </button>
      </div>

      {/* Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </motion.div>
  );
}

function FacilityModal({ facility, onClose, currentPhotoIndex, setCurrentPhotoIndex }) {
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayRef = React.useRef(null);
  const modalScrollRef = useRef(0);

  const photos = facility.photos || [];

  // Auto slideshow
  React.useEffect(() => {
    if (isAutoPlaying && photos.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
      }, 3000);
    }
    return () => clearInterval(autoPlayRef.current);
  }, [isAutoPlaying, photos.length]);

  const handlePrev = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleNext = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photos.length]);

  // lock body scroll while modal is open
  React.useEffect(() => {
    const y = window.scrollY || window.pageYOffset;
    modalScrollRef.current = y;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${y}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      window.scrollTo(0, modalScrollRef.current || 0);
    };
  }, []);

  const currentPhoto = photos[currentPhotoIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{facility.facilityName}</h3>
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                {facility.category || 'Infrastructure'}
              </span>
              <span>•</span>
              <span>Photo {currentPhotoIndex + 1} of {photos.length}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/80 rounded-full transition-all duration-300 hover:rotate-90"
          >
            <FaTimes className="text-gray-600 text-xl" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row max-h-[calc(90vh-100px)]">
          {/* Photo Gallery */}
          <div className="lg:w-2/3 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-6">
            {photos.length > 0 ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="relative">
                  <img
                    src={currentPhoto?.url}
                    alt={currentPhoto?.caption || facility.facilityName}
                    className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-2xl"
                  />
                  {currentPhoto?.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-xl">
                      <p className="text-white text-sm">{currentPhoto.caption}</p>
                    </div>
                  )}
                </div>

                {photos.length > 1 && (
                  <>
                    <button
                      onClick={handlePrev}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-white/95 hover:bg-white rounded-full shadow-xl transition-all duration-300 hover:scale-110"
                    >
                      <FaChevronLeft className="text-gray-800 text-xl" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-white/95 hover:bg-white rounded-full shadow-xl transition-all duration-300 hover:scale-110"
                    >
                      <FaChevronRight className="text-gray-800 text-xl" />
                    </button>
                  </>
                )}

                {photos.length > 1 && (
                  <button
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-xl text-sm font-semibold transition-all duration-300 ${
                      isAutoPlaying 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                        : 'bg-white text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    {isAutoPlaying ? '⏸ Pause Slideshow' : '▶ Start Slideshow'}
                  </button>
                )}
              </div>
            ) : (
              <div className="text-gray-400 text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                  <span className="text-4xl">📷</span>
                </div>
                <p className="text-lg">No photos available</p>
              </div>
            )}
          </div>

          {/* Details Panel */}
          <div className="lg:w-1/3 p-6 overflow-y-auto bg-white">
            <div className="mb-6">
              <h4 className="text-lg font-bold text-gray-900 mb-3">About</h4>
              <p className="text-gray-600 leading-relaxed">{facility.shortDescription}</p>
            </div>

            {facility.fullDescription && (
              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-900 mb-3">Details</h4>
                <p className="text-gray-600 leading-relaxed">{facility.fullDescription}</p>
              </div>
            )}

            {photos.length > 1 && (
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4">All Photos</h4>
                <div className="grid grid-cols-4 gap-3">
                  {photos.map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPhotoIndex(idx)}
                      className={`aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${
                        idx === currentPhotoIndex
                          ? 'border-indigo-500 ring-4 ring-indigo-200 shadow-lg'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
