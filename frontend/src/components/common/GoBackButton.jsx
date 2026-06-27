import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft } from 'react-icons/fa';
import { SPACING_CLASSES } from '../../constants/spacing';

/**
 * Reusable Go Back Button Component
 * Features:
 * - Smooth navigation to previous page with fallback to home
 * - Professional styling with school theme colors
 * - Fully accessible with ARIA labels
 * - Mobile responsive
 * - Animated entry effect
 * - Consistent across all detail pages
 */
const GoBackButton = ({ 
  label = 'Go Back',
  fallbackRoute = '/',
  className = '',
  color = 'blue',
  animated = true 
}) => {
  const navigate = useNavigate();
  const [canGoBack, setCanGoBack] = React.useState(false);

  React.useEffect(() => {
    // Check if there's browser history to go back to
    setCanGoBack(window.history.length > 1);
  }, []);

  const handleClick = () => {
    if (canGoBack && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackRoute);
    }
  };

  // Color scheme mapping
  const colorSchemes = {
    blue: {
      bg: 'bg-blue-50 hover:bg-blue-100',
      text: 'text-blue-700 hover:text-blue-900',
      border: 'border-blue-200 hover:border-blue-300',
    },
    indigo: {
      bg: 'bg-indigo-50 hover:bg-indigo-100',
      text: 'text-indigo-700 hover:text-indigo-900',
      border: 'border-indigo-200 hover:border-indigo-300',
    },
    gray: {
      bg: 'bg-gray-100 hover:bg-gray-200',
      text: 'text-gray-700 hover:text-gray-900',
      border: 'border-gray-300 hover:border-gray-400',
    },
  };

  const scheme = colorSchemes[color] || colorSchemes.blue;

  const buttonContent = (
    <button
      onClick={handleClick}
      aria-label={`${label} to previous page`}
      className={`
        inline-flex items-center gap-2 px-4 py-2.5 md:px-6 md:py-3
        rounded-lg border-2 transition-all duration-200
        font-semibold text-sm md:text-base
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        active:scale-95
        ${scheme.bg}
        ${scheme.text}
        ${scheme.border}
        ${className}
      `}
    >
      <FaArrowLeft className="text-sm md:text-base flex-shrink-0" />
      <span>{label}</span>
    </button>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="mt-6 mb-6 md:mb-8"
      >
        {buttonContent}
      </motion.div>
    );
  }

  return (
    <div className="mt-6 mb-6 md:mb-8">
      {buttonContent}
    </div>
  );
};

export default GoBackButton;
