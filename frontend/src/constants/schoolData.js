// Minimal defaults — prefer loading these from the backend at runtime.
export const SCHOOL_INFO = {
  name: 'Bal Bodh Secondary School',
  tagline: 'Nurturing Excellence in Every Student',
  about:
    'Bal Bodh Secondary School is a premier educational institution dedicated to nurturing young minds and fostering academic excellence, character development, and holistic growth.',
  address: 'Kanchanpur, Saptari, Nepal',
  phone: '+977-985-2860773',
  email: 'balbodhschool9@gmail.com',
  website: 'https://balbodhsecondaryschool.vercel.app/',
  facebook: 'https://www.facebook.com/bal.bodh.31',
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
  { label: 'Students', value: 600, suffix: '+', icon: 'FaUsers' },
  { label: 'Teachers', value: 20, suffix: '+', icon: 'FaChalkboardTeacher' },
  { label: 'Classrooms', value: 20, suffix: '+', icon: 'FaSchool' },
  { label: 'Awards', value: 100, suffix: '+', icon: 'FaTrophy' },
  { label: 'Pass Rate', value: 98, suffix: '%', icon: 'FaAward' },
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
  name: 'Sanjay Khadga',
  designation: 'Founder',
  image: '/images/principal.png',
  cardMessage: `At Bal Bodh Secondary School, we believe that education is the foundation of a brighter future. Our commitment is to empower students with knowledge, character, leadership, and lifelong learning skills. Through dedication, innovation, and excellence, we strive to shape responsible citizens who will positively impact society and the world around them.`,
  fullMessage: `Education is the most powerful tool for transforming lives and building a prosperous society. At Bal Bodh Secondary School, we are dedicated to creating an environment where students are encouraged to learn, explore, and grow into confident, responsible, and compassionate individuals.

Our institution was established with the vision of providing quality education that combines academic excellence with strong moral values. We believe that every child possesses unique talents and potential, and it is our responsibility to help them discover and develop those abilities. Through modern teaching practices, experienced educators, and a student-centered approach, we strive to make learning meaningful, engaging, and inspiring.

Along with academic achievement, we emphasize discipline, leadership, creativity, critical thinking, and social responsibility. We encourage our students to participate actively in cultural, sports, and extracurricular activities that contribute to their holistic development and prepare them for future challenges.

The success and growth of our school have been possible because of the continuous support and trust of parents, teachers, students, alumni, and well-wishers. Their dedication and cooperation motivate us to continuously improve and maintain the highest standards of education.

As we move forward, we remain committed to nurturing future leaders, innovators, and responsible citizens who will contribute positively to their communities and the nation. Together, let us continue our journey toward excellence, knowledge, and character building.

Thank you for being a valued part of the Bal Bodh Secondary School family.`,
  nepaliMessage: `शिक्षा व्यक्तिको जीवन परिवर्तन गर्ने तथा समाजको समग्र विकासको आधारशिला हो। बाल बोध माध्यमिक विद्यालयले प्रत्येक विद्यार्थीलाई गुणस्तरीय शिक्षा प्रदान गर्दै उनीहरूलाई सक्षम, जिम्मेवार र नैतिक नागरिकको रूपमा विकास गर्ने उद्देश्यका साथ आफ्नो शैक्षिक यात्रा अघि बढाइरहेको छ।

हाम्रो विद्यालयको स्थापना विद्यार्थीहरूलाई आधुनिक ज्ञान, सीप तथा जीवनोपयोगी मूल्यहरू प्रदान गर्ने लक्ष्यका साथ गरिएको हो। हामी विश्वास गर्छौं कि प्रत्येक विद्यार्थीमा विशेष क्षमता र सम्भावना रहेको हुन्छ, जसलाई उचित मार्गदर्शन, प्रेरणा र अवसरको माध्यमबाट उजागर गर्न सकिन्छ। त्यसैले विद्यालयले विद्यार्थीमैत्री वातावरण, अनुभवी शिक्षक तथा आधुनिक शिक्षण विधिको प्रयोगमार्फत प्रभावकारी सिकाइ सुनिश्चित गर्न निरन्तर प्रयास गरिरहेको छ।

शैक्षिक उपलब्धिसँगै अनुशासन, नेतृत्व क्षमता, नैतिकता, रचनात्मक सोच तथा सामाजिक उत्तरदायित्वको विकासमा पनि हामी विशेष ध्यान दिन्छौं। विभिन्न अतिरिक्त क्रियाकल्प, खेलकुद, सांस्कृतिक कार्यक्रम तथा सामाजिक गतिविधिहरूमा विद्यार्थीहरूको सक्रिय सहभागिताले उनीहरूको सर्वाङ्गीण विकासमा महत्वपूर्ण भूमिका खेल्दछ।

विद्यालयको निरन्तर प्रगति र सफलतामा अभिभावक, शिक्षक, विद्यार्थी, पूर्वविद्यार्थी तथा सम्पूर्ण शुभेच्छुकहरूको अमूल्य सहयोग र विश्वास रहेको छ। उहाँहरूको साथ, सहयोग र प्रेरणाले विद्यालयलाई अझ उत्कृष्ट बनाउने हाम्रो प्रयासलाई थप ऊर्जा प्रदान गरेको छ。

भविष्यमा पनि ज्ञान, चरित्र, अनुशासन र उत्कृष्टताको मार्गमा अग्रसर रहँदै सक्षम, आत्मनिर्भर तथा राष्ट्रप्रेमी नागरिक उत्पादन गर्ने हाम्रो प्रतिबद्धता यथावत् रहनेछ। सबैको सहयोग र सहकार्यबाट विद्यालयलाई अझ उन्नत र उदाहरणीय शैक्षिक संस्थाको रूपमा विकास गर्दै लैजाने विश्वास व्यक्त गर्दछु।

बाल बोध माध्यमिक विद्यालय परिवारप्रति देखाउनुभएको विश्वास, सहयोग र सद्भावका लागि हार्दिक धन्यवाद।`
};