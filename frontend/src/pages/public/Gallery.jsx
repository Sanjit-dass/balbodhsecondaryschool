import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { SectionTitle, GalleryImage } from '../../components/public/SectionComponents';
import TranslateText from '../../components/public/TranslateText';
import { GALLERY_IMAGES, GALLERY_CATEGORIES, COLORS } from '../../constants/schoolData';

const Gallery = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const filteredImages = selectedCategory === 'all'
    ? GALLERY_IMAGES
    : GALLERY_IMAGES.filter(img => img.category === selectedCategory);

  const openLightbox = (index) => {
    setCurrentImageIndex(index);
    setSelectedImage(GALLERY_IMAGES.find(img => img.id === filteredImages[index].id));
  };

  const nextImage = () => {
    const nextIndex = (currentImageIndex + 1) % filteredImages.length;
    setCurrentImageIndex(nextIndex);
    setSelectedImage(filteredImages[nextIndex]);
  };

  const prevImage = () => {
    const prevIndex = currentImageIndex === 0 ? filteredImages.length - 1 : currentImageIndex - 1;
    setCurrentImageIndex(prevIndex);
    setSelectedImage(filteredImages[prevIndex]);
  };

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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Photo Gallery</h1>
          <p className="text-lg text-blue-100">
            Explore the vibrant campus life and memorable moments
          </p>
        </div>
      </motion.section>

      {/* Gallery Info */}
      <section className="py-8 md:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-600">
            Click on any image to view in fullscreen. Use arrow keys to navigate.
          </p>
        </div>
      </section>

     {/* ================= CATEGORY FILTER (STICKY NAVBAR) ================= */}
<motion.section
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}

  className="sticky top-16 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200 shadow-sm py-6"
>
  <div className="max-w-7xl mx-auto px-4">

    {/* CATEGORY BUTTONS */}
    <div className="flex flex-wrap justify-center gap-3">

      {GALLERY_CATEGORIES.map((category, index) => (
        <motion.button
          key={category.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}

          onClick={() => {
            setSelectedCategory(category.id);
            setCurrentImageIndex(0);
          }}

          className={`px-5 py-2 rounded-full font-semibold transition-all duration-300 ${
            selectedCategory === category.id
              ? "text-white shadow-lg scale-105"
              : "bg-white text-gray-700 border border-gray-200 hover:shadow-md"
          }`}

          style={{
            backgroundColor:
              selectedCategory === category.id ? COLORS.secondary : "",
          }}
        >
          {category.name}
        </motion.button>
      ))}

    </div>
  </div>
</motion.section>

      {/* Gallery Grid - Masonry Layout */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <SectionTitle
            title="Campus Moments"
            subtitle={`Showing ${filteredImages.length} images in ${selectedCategory === 'all' ? 'All Categories' : selectedCategory}`}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 auto-rows-max">
            {filteredImages.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                viewport={{ once: true }}
                onClick={() => openLightbox(index)}
              >
                <GalleryImage
                  image={image.image}
                  title={image.title}
                  delay={0}
                />
              </motion.div>
            ))}
          </div>

          {filteredImages.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-xl text-gray-600">
                No images found in this category.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 text-white text-3xl hover:scale-110 transition-transform z-60"
            >
              <FaTimes />
            </motion.button>

            {/* Image Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full"
            >
              {/* Main Image */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                <img
                  src={`/src/images/${selectedImage.image}`}
                  alt={selectedImage.title}
                  className="w-full max-h-96 md:max-h-[600px] object-contain"
                />
                <p className="text-center text-white mt-4 font-semibold">
                  {selectedImage.title}
                </p>
              </div>

              {/* Navigation Buttons */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => prevImage()}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition-all"
              >
                <FaChevronLeft size={24} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => nextImage()}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition-all"
              >
                <FaChevronRight size={24} />
              </motion.button>

              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-semibold">
                {currentImageIndex + 1} / {filteredImages.length}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gallery Stats */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-blue-50 to-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { label: 'Total Photos', value: GALLERY_IMAGES.length },
              { label: 'Categories', value: GALLERY_CATEGORIES.length },
              { label: 'Campus Events', value: '50+' },
              { label: 'Memories Captured', value: '24 hrs' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</p>
                <p className="text-gray-600 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Share Gallery CTA */}
      <section className="py-16 md:py-24 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto px-4 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Share Your School Memories
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Have great photos from school events? Share them with us and see your memories featured in our gallery!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 rounded-lg font-bold text-white transition-all"
            style={{ backgroundColor: COLORS.secondary }}
          >
            Submit Your Photos
          </motion.button>
        </motion.div>
      </section>
    </div>
    </TranslateText>
  );
};

export default Gallery;
