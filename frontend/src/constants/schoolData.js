// Minimal defaults — prefer loading these from the backend at runtime.
export const SCHOOL_INFO = {
  name: 'Bal Bodh Secondary School',
  tagline: 'Nurturing Excellence in Every Student',
  about:
    'Bal Bodh Secondary School is a premier educational institution dedicated to nurturing young minds and fostering academic excellence, character development, and holistic growth.',
  address: 'Kanchanpur, Saptari, Nepal',
  phone: '+977-9801234567',
  email: 'info@balbodh.edu.np',
  website: 'https://balbodh.edu.np',
  facebook: '',
  twitter: '',
  youtube: '',
  instagram: '',
  mapsLink: '',
  established: 2055,
  logo: '/logo.png',
};

export const COLORS = {
  primary: '#0F4C81',
  secondary: '#1E88E5',
  accent: '#FFC107',
  white: '#FFFFFF',
  dark: '#1A1A1A',
  gray: '#F5F5F5',
  lightGray: '#E0E0E0',
};

export const STATISTICS = [
  { label: 'Students', value: 1200, suffix: '+', icon: 'FaUsers' },
  { label: 'Teachers', value: 85, suffix: '+', icon: 'FaChalkboardTeacher' },
  { label: 'Classrooms', value: 40, suffix: '+', icon: 'FaSchool' },
  { label: 'Awards', value: 150, suffix: '+', icon: 'FaTrophy' },
  { label: 'Recognitions', value: 35, suffix: '+', icon: 'FaAward' },
  { label: 'Years', value: 21, suffix: '+', icon: 'FaCalendar' },
];

export const WHY_CHOOSE = [
  {
    title: 'Modern Education',
    description: 'Contemporary curriculum designed for 21st-century learning',
    icon: 'FaBook',
  },
  {
    title: 'Qualified Teachers',
    description: 'Experienced and dedicated faculty members',
    icon: 'FaChalkboardTeacher',
  },
  {
    title: 'Practical Learning',
    description: 'Hands-on experience and real-world applications',
    icon: 'FaFlask',
  },
  {
    title: 'Strong Discipline',
    description: 'Character development and moral values',
    icon: 'FaShield',
  },
  {
    title: 'Technology Integration',
    description: 'Latest tech tools and digital learning resources',
    icon: 'FaLaptop',
  },
  {
    title: 'Holistic Development',
    description: 'Sports, arts, and extracurricular activities',
    icon: 'FaMedal',
  },
];

// FACILITIES removed - now loaded from database via /api/facilities

export const ACADEMIC_PROGRAMS = [
  { class: 'Nursery to Grade 2', focus: 'Foundation & Basics' },
  { class: 'Grade 3 to Grade 5', focus: 'Primary Education' },
  { class: 'Grade 6 to Grade 8', focus: 'Lower Secondary' },
  { class: 'Grade 9 to Grade 10', focus: 'Secondary (SEE)' },
  { class: 'Grade 11 to Grade 12', focus: 'Higher Secondary (NEB)' },
];

export const TESTIMONIALS = [
  {
    name: 'Er. Sanjit Das',
    role: 'Software Developer • Alumni Batch 2074',
    text: 'Bal Bodh Secondary School provided me with a strong academic foundation and valuable life skills. The supportive teachers and learning environment played a significant role in my personal and professional growth.',
    image: 'sanjitPhoto.jpeg',
  },
  {
    name: 'Er. Puspendra Birajee',
    role: 'Computer Engineer • Alumni Batch 2074',
    text: 'My journey at Bal Bodh Secondary School was filled with opportunities to learn, participate, and grow. The school helped me build confidence and prepare for future challenges.',
    image: 'puspendra.png',
  },
  {
    name: 'Mr. Dhiraj Sah',
    role: 'Pharmacist • Alumni Batch 2074',
    text: 'The discipline, quality education, and encouragement from teachers helped shape my future. I am proud to be a former student of Bal Bodh Secondary School.',
    image: 'Dhiraj.png',
  },
];

// EVENTS removed — upcoming events are loaded from the API (/api/events-v2 or /api/events)

// ACHIEVEMENTS removed — now loaded from database via /api/achievements

export const GALLERY_CATEGORIES = [
  { id: 'school', name: 'School' },
  { id: 'classrooms', name: 'Classrooms' },
  { id: 'labs', name: 'Laboratories' },
  { id: 'sports', name: 'Sports' },
  { id: 'events', name: 'Events' },
  { id: 'activities', name: 'Activities' },
  { id: 'celebration', name: 'Celebration' },
  { id: 'hostel', name: 'Hostel' },
  { id: 'transport', name: 'Transportation' },
  
];
// GALLERY_IMAGES removed — images are loaded from the API at runtime.

export const NOTICES = [];

// Staff data removed — now loaded from backend via /api/staff-leadership

export const HERO_IMAGES = [];

// STUDENT_ACHIEVEMENTS removed — frontend now reads from /api/achievements only

export const PRINCIPAL_MESSAGE = {
  name: '',
  designation: '',
  image: '',
  fullMessage: ''
};