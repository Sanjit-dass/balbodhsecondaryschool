/**
 * Global Spacing System
 * Consistent spacing scale across the entire application
 */

export const SPACING = {
  // Base spacing unit (4px)
  base: '0.25rem', // 4px
  
  // Spacing scale
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
  '4xl': '6rem',    // 96px
  '5xl': '8rem',    // 128px
  
  // Component-specific spacing
  // Page layout
  pagePadding: {
    mobile: '1rem',      // 16px
    tablet: '1.5rem',    // 24px
    desktop: '2rem',     // 32px
  },
  
  pageTopSpacing: {
    mobile: '1.5rem',    // 24px - below navbar
    tablet: '2rem',      // 32px
    desktop: '2.5rem',   // 40px
  },
  
  // Section spacing
  sectionSpacing: {
    mobile: '2rem',      // 32px
    tablet: '3rem',      // 48px
    desktop: '4rem',     // 64px
  },
  
  // Card spacing
  cardPadding: {
    mobile: '1rem',      // 16px
    tablet: '1.25rem',   // 20px
    desktop: '1.5rem',   // 24px
  },
  
  cardGap: {
    mobile: '1rem',      // 16px
    tablet: '1.25rem',   // 20px
    desktop: '1.5rem',   // 24px
  },
  
  // Form spacing
  formGap: {
    mobile: '1rem',      // 16px
    tablet: '1.25rem',   // 20px
    desktop: '1.5rem',   // 24px
  },
  
  inputPadding: {
    mobile: '0.75rem 1rem',    // 12px 16px
    tablet: '0.875rem 1rem',   // 14px 16px
    desktop: '1rem 1rem',      // 16px 16px
  },
  
  // Button spacing
  buttonGap: {
    mobile: '0.5rem',     // 8px
    tablet: '0.75rem',    // 12px
    desktop: '1rem',      // 16px
  },
  
  buttonPadding: {
    sm: {
      mobile: '0.5rem 1rem',     // 8px 16px
      tablet: '0.625rem 1.25rem', // 10px 20px
      desktop: '0.75rem 1.5rem', // 12px 24px
    },
    md: {
      mobile: '0.75rem 1.5rem',  // 12px 24px
      tablet: '0.875rem 1.75rem', // 14px 28px
      desktop: '1rem 2rem',      // 16px 32px
    },
    lg: {
      mobile: '1rem 2rem',       // 16px 32px
      tablet: '1.25rem 2.5rem',  // 20px 40px
      desktop: '1.5rem 3rem',    // 24px 48px
    },
  },
  
  // Heading spacing
  headingGap: {
    mobile: '1rem',      // 16px
    tablet: '1.25rem',   // 20px
    desktop: '1.5rem',   // 24px
  },
  
  // Table spacing
  tablePadding: {
    mobile: '0.75rem 1rem',    // 12px 16px
    tablet: '0.875rem 1rem',   // 14px 16px
    desktop: '1rem 1.25rem',   // 16px 20px
  },
  
  // Back button spacing
  backButtonTop: {
    mobile: '1.5rem',    // 24px - below navbar
    tablet: '2rem',      // 32px
    desktop: '2.5rem',   // 40px
  },
  backButtonBottom: {
    mobile: '1.5rem',    // 24px
    tablet: '2rem',      // 32px
    desktop: '2.5rem',   // 40px
  },
  
  // Sidebar
  sidebarWidth: {
    mobile: '280px',
    tablet: '280px',
    desktop: '280px',
  },
  
  // Content margin from sidebar
  contentMarginLeft: {
    mobile: '0',
    tablet: '0',
    desktop: '280px',
  },
};

// Tailwind class mappings for common spacing patterns
export const SPACING_CLASSES = {
  pagePadding: 'p-4 md:p-6 lg:p-8',
  pageTopSpacing: 'pt-6 md:pt-8 lg:pt-10',
  sectionSpacing: 'my-8 md:my-12 lg:my-16',
  cardPadding: 'p-4 md:p-5 lg:p-6',
  cardGap: 'gap-4 md:gap-5 lg:gap-6',
  formGap: 'gap-4 md:gap-5 lg:gap-6',
  buttonGap: 'gap-2 md:gap-3 lg:gap-4',
  headingGap: 'mb-4 md:mb-5 lg:mb-6',
  backButtonTop: 'mt-6 md:mt-8 lg:mt-10',
  backButtonBottom: 'mb-6 md:mb-8 lg:mb-10',
};
