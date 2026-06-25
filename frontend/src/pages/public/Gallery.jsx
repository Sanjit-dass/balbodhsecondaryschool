import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { SectionTitle, GalleryImage } from '../../components/public/SectionComponents';
import { getImageUrl } from '../../services/api';
import TranslateText from '../../components/public/TranslateText';
import GoBackButton from '../../components/common/GoBackButton';
import { GALLERY_CATEGORIES, COLORS } from '../../constants/schoolData';
import { useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/free-mode';
import { Autoplay, Pagination, FreeMode } from 'swiper/modules';

// Note: GALLERY_IMAGES removed — fetch from API

const Gallery = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const swiperRef = React.useRef(null);

  const [images, setImages] = React.useState([]);
  const [slidesPerViewState, setSlidesPerViewState] = React.useState(2);
  useEffect(() => { (async ()=>{ try{ const r = await fetch('/api/photo-gallery/photos'); const j = await r.json(); if (j.success && Array.isArray(j.data)) {
        const isFilename = s => !!(s && /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(String(s)));
        const mapped = j.data.map(item => {
          const url = item.url || item.image || item.file || (item.filename ? getImageUrl(item.filename) : (item.path ? getImageUrl(item.path) : ''));
          let displayTitle = item.title || item.caption || '';
          if (!displayTitle || isFilename(displayTitle)) {
            displayTitle = item.galleryTitle || item.albumTitle || item.albumName || (item.album && item.album.title) || item.title?.replace(/\.[^.]+$/, '') || 'Photo';
          }
          const displayCategory = item.category || item.galleryCategory || item.albumCategory || item.album?.category || '';
          const displayClass = item.className || item.class || item.albumClassName || item.galleryClassName || '';
          return { ...item, url, displayTitle, displayCategory, displayClass, title: displayTitle, category: displayCategory, className: displayClass };
        });
        setImages(mapped || []);
      }
    }catch(e){console.warn(e)} })(); }, []);

  // compute slidesPerView responsively and update on resize (Desktop:4, Tablet:2, Mobile:1)
  React.useEffect(() => {
    function compute() {
      const w = window.innerWidth;
      if (w >= 1024) return 4; // Desktop
      if (w >= 640) return 2;  // Tablet
      return 1;                // Mobile
    }
    const update = () => setSlidesPerViewState(compute());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Normalize and match category ids and names to avoid mismatch with backend values
  const categoryMap = Object.fromEntries(GALLERY_CATEGORIES.map(c => [c.id, c.name.toLowerCase()]));

  const urlClassName = React.useMemo(() => {
    try { return new URLSearchParams(window.location.search).get('className') || ''; } catch (e) { return ''; }
  }, []);

  let filteredImages = images;
  if (urlClassName) {
    const q = urlClassName.toString().trim().toLowerCase();
    filteredImages = images.filter(img => ((img.className||'') .toString().toLowerCase() === q) || ((img.displayClass||'') .toString().toLowerCase() === q) || ((img.galleryClassName||'') .toString().toLowerCase() === q));
  } else if (selectedCategory !== 'all' && selectedCategory) {
    filteredImages = images.filter(img => {
      const cat = (img.category || '').toLowerCase();
      const targetName = categoryMap[selectedCategory] || '';
      return cat === selectedCategory || cat === targetName || cat.includes(targetName) || targetName.includes(cat);
    });
  }

  // If a `className` is provided in the URL query, filter strictly by class
  React.useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const className = qs.get('className');
    if (className) {
      // normalize and filter images in-place by updating selectedCategory to 'class'
      setCurrentSlide(0);
      // ensure filteredImages respects className via derived state by setting selectedCategory to a unique value
      // but simpler: replace images displayed by setting a temporary state (we'll filter during render below)
    }
  }, []);

  // Ensure autoplay starts when swiper instance is ready and there are enough slides
  React.useEffect(() => {
    const effective = Math.max(1, Math.min(slidesPerViewState, filteredImages.length));
    const shouldAutoplay = filteredImages.length > effective;
    if (shouldAutoplay && swiperRef.current && swiperRef.current.autoplay) {
      try { swiperRef.current.autoplay.stop(); } catch(e) {}
      try { setTimeout(() => { try { swiperRef.current.autoplay.start(); } catch(e){} }, 150); } catch(e) {}
    }
  }, [filteredImages.length, slidesPerViewState]);

  const openLightbox = (index) => {
    setCurrentImageIndex(index);
    setSelectedImage(filteredImages[index]);
    setCurrentSlide(index);
    // move swiper to the clicked slide (works with loop)
    if (swiperRef.current && swiperRef.current.slideToLoop) {
      swiperRef.current.slideToLoop(index, 300);
    }
  };

  // lock body scroll when lightbox is open
  React.useEffect(() => {
    if (selectedImage) {
      const y = window.scrollY || window.pageYOffset;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${y}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        window.scrollTo(0, y || 0);
      };
    }
    return undefined;
  }, [selectedImage]);

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
      <GoBackButton label=" Back" color="blue" />
      {/* Page Header */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-10 md:py-16"
      >
        <div className="max-w-[1600px] mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Photo Gallery</h1>
          <p className="text-lg text-blue-100">
            Explore the vibrant campus life and memorable moments
          </p>
        </div>
      </motion.section>

      {/* Gallery Info (intro) */}
      <div className="max-w-[1600px] mx-auto px-4 text-center py-4">
        <p className="text-gray-600">
          Click on any image to view in fullscreen. Use arrow keys to navigate.
        </p>
      </div>

      {/* Category filters removed as requested */}

      {/* Gallery Grid - Masonry Layout */}
      <section className="py-8 md:py-12 bg-white">
        <div className="max-w-[1600px] mx-auto px-4">
          <SectionTitle
            title="Campus Moments"
            subtitle={`Showing ${filteredImages.length} images in ${selectedCategory === 'all' ? 'All Categories' : selectedCategory}`}
          />

          <div className="max-w-full">
            {/** Ensure slidesPerView never exceeds available images to avoid static non-moving layouts */}
            {(() => {
              const effectiveSlides = Math.max(1, Math.min(slidesPerViewState, filteredImages.length));
              const shouldLoop = filteredImages.length > effectiveSlides;
              const shouldAutoplay = filteredImages.length > effectiveSlides;

              return (
                  <Swiper
                    modules={[Autoplay, Pagination, FreeMode]}
                    loop={shouldLoop}
                    // Use discrete autoplay (~3s) for slower point-by-point advancing
                    freeMode={false}
                    autoplay={filteredImages.length > 1 ? { delay: 3000, disableOnInteraction: false, waitForTransition: false } : false}
                    grabCursor={true}
                    spaceBetween={16}
                    slidesPerView={effectiveSlides}
                    breakpoints={{
                      640: { slidesPerView: Math.min(2, filteredImages.length) },
                      1024: { slidesPerView: Math.min(4, filteredImages.length) }
                    }}
                    initialSlide={currentSlide}
                    onSlideChange={(s) => setCurrentSlide(s.realIndex ?? s.activeIndex)}
                    onSwiper={(s) => {
                      swiperRef.current = s;
                      if (shouldAutoplay && s && s.autoplay) {
                        try { s.autoplay.stop(); } catch(e) { /* ignore */ }
                        try { setTimeout(() => { try { s.autoplay.start(); } catch(e){} }, 120); } catch(e) { /* ignore */ }
                      }
                    }}
                    speed={600}
                    observer={true}
                    observeParents={true}
                    key={`${filteredImages.length}-${slidesPerViewState}`}
                    className="py-6"
                  >
                  {filteredImages.map((image, index) => (
                    <SwiperSlide key={image.id || image._id || index}>
                      <div onClick={() => openLightbox(index)} className="px-2">
                              <GalleryImage
                                image={image.url}
                                title={image.title}
                                // category is shown inside the image overlay on hover — avoid duplicate caption below
                                delay={0}
                              />
                              <div className="mt-3 text-center">
                                <div className="text-sm font-semibold text-gray-900">{image.title}</div>
                              </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              );
            })()}
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
                  src={selectedImage.url}
                  alt={selectedImage.title}
                  onError={(e)=>{ e.currentTarget.onerror = null; e.currentTarget.src = '/default-placeholder.png'; }}
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
                className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition-all"
              >
                <FaChevronLeft size={24} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => nextImage()}
                className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition-all"
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

      {/* Gallery Stats removed — statistics now omitted per request */}

      {/* Share Gallery CTA */}
      <section className="py-8 md:py-12 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-[1600px] mx-auto px-4 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Share Your School Memories
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Have great photos from school events? Share them with us and see your memories featured in our gallery!
          </p>
          
        </motion.div>
      </section>
    </div>
    </TranslateText>
  );
};

export default Gallery;
