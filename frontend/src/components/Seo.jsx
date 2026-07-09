import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { SCHOOL_INFO } from '../constants/schoolData';

const SITE_URL = 'https://balbodhsecondaryschool.edu.np';
const DEFAULT_TITLE = SCHOOL_INFO.name || 'Bal Bodh Secondary School';
const DEFAULT_DESCRIPTION = SCHOOL_INFO.about || 'Official website of Bal Bodh Secondary School, Kanchanpur-08, Saptari, Nepal. Explore admissions, notices, events, academics, gallery, and contact information.';
const DEFAULT_IMAGE = `${SITE_URL}/images/schoolphoto.png`;

const pageMeta = {
  '/': {
    title: 'Kanchanrup Municipality-08, Kanchanpur Saptari Nepal',
    description: 'Official website of Bal Bodh Secondary School. Explore admissions, notices, events, academics, gallery, and contact information.'
  },
  '/about': {
    title: 'About Us',
    description: 'Learn about Bal Bodh Secondary School — mission, values, history, and commitment to quality education.'
  },
  '/academics': {
    title: 'Academics',
    description: 'Explore Bal Bodh Secondary School academic programs, curriculum, and learning opportunities for all grades.'
  },
  '/admissions': {
    title: 'Admissions',
    description: 'Admissions information, eligibility, application process, important dates, and contact details for prospective students.'
  },
  '/facilities': {
    title: 'Facilities',
    description: 'Discover the campus facilities, classrooms, laboratories, sports grounds, and learning spaces at Bal Bodh Secondary School.'
  },
  '/principal-message': {
    title: 'Principal’s Message',
    description: 'Read the principal’s message and vision for student growth and academic excellence.'
  },
  '/student-achievements': {
    title: 'Student Achievements',
    description: 'Celebrate student achievements, awards, and success stories from Bal Bodh Secondary School.'
  },
  '/academic-excellence': {
    title: 'Academic Excellence',
    description: 'Explore academic excellence initiatives and student success at Bal Bodh Secondary School.'
  },
  '/student-life': {
    title: 'Student Life',
    description: 'Learn about student life, activities, and the vibrant school culture.'
  },
  '/gallery': {
    title: 'Gallery',
    description: 'Browse photos and highlights from school events, programs, and campus life at Bal Bodh Secondary School.'
  },
  '/notice-board': {
    title: 'Notice Board',
    description: 'Latest notices, announcements, and school news for students, parents, and staff.'
  },
  '/events': {
    title: 'Events',
    description: 'Upcoming and past school events, programs, and important academic and cultural activities.'
  },
  '/staff': {
    title: 'Staff',
    description: 'Meet the dedicated faculty and staff members of Bal Bodh Secondary School.'
  },
  '/school-leadership': {
    title: 'School Leadership',
    description: 'Learn about the school leadership team, principal, and administrative staff committed to excellence.'
  },
  '/contact': {
    title: 'Contact Us',
    description: 'Contact Bal Bodh Secondary School for admissions, inquiries, directions, and general information.'
  },
  '/student-results': {
    title: 'Student Results',
    description: 'View student results and academic performance information for the school.'
  },
  '/login': {
    title: 'Login',
    description: 'Access the Bal Bodh Secondary School portal login.',
    robots: 'noindex, nofollow'
  },
  '/forgot-password': {
    title: 'Forgot Password',
    description: 'Reset your Bal Bodh Secondary School portal password.',
    robots: 'noindex, nofollow'
  },
  '/register': {
    title: 'Register',
    description: 'Create an account for the Bal Bodh Secondary School portal.',
    robots: 'noindex, nofollow'
  }
};

export default function Seo() {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/+$/, '') || '/';
  const normalizedPath = pathname === '' ? '/' : pathname;
  const meta = pageMeta[normalizedPath] || {
    title: 'Page',
    description: DEFAULT_DESCRIPTION
  };

  const title = `${DEFAULT_TITLE} | ${meta.title}`;
  const description = meta.description || DEFAULT_DESCRIPTION;
  const canonical = `${SITE_URL}${normalizedPath === '/' ? '' : normalizedPath}`;
  // Mark private and portal routes as noindex
  const privatePrefixes = ['/admin', '/student', '/teacher', '/parent', '/account', '/exam', '/fee-management'];
  const isPrivate = privatePrefixes.some(p => normalizedPath.startsWith(p));
  const robots = meta.robots || (isPrivate ? 'noindex, nofollow' : 'index, follow');

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'School',
    name: DEFAULT_TITLE,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    logo: `${SITE_URL}/favicon-512.png`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SCHOOL_INFO.address || '',
      addressLocality: '',
      addressRegion: '',
      postalCode: '',
      addressCountry: 'NP'
    },
    telephone: SCHOOL_INFO.phone || '',
    email: SCHOOL_INFO.email || '',
    sameAs: [
      SCHOOL_INFO.facebook,
      SCHOOL_INFO.twitter,
      SCHOOL_INFO.youtube,
      SCHOOL_INFO.instagram
    ].filter(Boolean),
    contactPoint: SCHOOL_INFO.phone ? [{
      '@type': 'ContactPoint',
      telephone: SCHOOL_INFO.phone,
      contactType: 'customer service'
    }] : [],
    hasMap: SCHOOL_INFO.mapsLink || '',
    image: {
      '@type': 'ImageObject',
      url: DEFAULT_IMAGE,
      width: 1200,
      height: 630
    }
  };

  // Add a LocalBusiness/Google Business Profile hint to help match GMB listings
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: DEFAULT_TITLE,
    url: SITE_URL,
    telephone: SCHOOL_INFO.phone || '',
    email: SCHOOL_INFO.email || '',
    address: organizationSchema.address,
    sameAs: organizationSchema.sameAs,
    logo: `${SITE_URL}/favicon.png`,
    openingHours: SCHOOL_INFO.openingHours || undefined,
    hasMap: SCHOOL_INFO.mapsLink || undefined
  };

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <meta name="theme-color" content="#0f766e" />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={DEFAULT_IMAGE} />
      <meta property="og:site_name" content={DEFAULT_TITLE} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={DEFAULT_IMAGE} />
      <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(localBusinessSchema)}</script>
    </Helmet>
  );
}
