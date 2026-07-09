import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://balbodhsecondaryschool.edu.np';
const DEFAULT_TITLE = 'Bal Bodh Secondary School';
const DEFAULT_DESCRIPTION = 'Official website of Bal Bodh Secondary School, Kanchanpur-08, Saptari, Nepal. Explore admissions, notices, events, academics, gallery, and contact information.';
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;

const pageMeta = {
  '/': {
    title: 'Home',
    description: 'Official website of Bal Bodh Secondary School with admissions, notices, events, academics, gallery, and contact information.'
  },
  '/about': {
    title: 'About Us',
    description: 'Learn about Bal Bodh Secondary School, its mission, values, and commitment to quality education.'
  },
  '/academics': {
    title: 'Academics',
    description: 'Explore the school’s academic programs, curriculum, and learning opportunities.'
  },
  '/admissions': {
    title: 'Admissions',
    description: 'Find details about admissions, eligibility, and the application process for Bal Bodh Secondary School.'
  },
  '/facilities': {
    title: 'Facilities',
    description: 'Discover the campus facilities, classrooms, laboratories, and learning spaces at Bal Bodh Secondary School.'
  },
  '/principal-message': {
    title: 'Principal’s Message',
    description: 'Read the principal’s message and vision for student growth and academic excellence.'
  },
  '/student-achievements': {
    title: 'Student Achievements',
    description: 'Celebrate the achievements and accomplishments of students from Bal Bodh Secondary School.'
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
    description: 'Browse photos and highlights from school events, programs, and campus life.'
  },
  '/notice-board': {
    title: 'Notice Board',
    description: 'Stay updated with the latest notices, announcements, and school news.'
  },
  '/events': {
    title: 'Events',
    description: 'See upcoming school events, programs, and important academic and cultural activities.'
  },
  '/staff': {
    title: 'Staff',
    description: 'Meet the dedicated faculty and staff members of Bal Bodh Secondary School.'
  },
  '/school-leadership': {
    title: 'School Leadership',
    description: 'Learn about the school leadership team and their commitment to excellence.'
  },
  '/contact': {
    title: 'Contact Us',
    description: 'Get in touch with Bal Bodh Secondary School for admissions, inquiries, or support.'
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

  const title = `${meta.title} | ${DEFAULT_TITLE}`;
  const description = meta.description || DEFAULT_DESCRIPTION;
  const canonical = `${SITE_URL}${normalizedPath === '/' ? '' : normalizedPath}`;
  const robots = meta.robots || 'index, follow';

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: DEFAULT_TITLE,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    logo: `${SITE_URL}/logo.png`
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
    </Helmet>
  );
}
