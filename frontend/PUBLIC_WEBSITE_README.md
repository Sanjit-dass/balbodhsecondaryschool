# Balbodh Secondary School - Premium Website

A modern, responsive, and fully-featured website for Balbodh Secondary School built with React.js, Tailwind CSS, and Framer Motion.

## 🌟 Features

### Pages Included
 - **Home Page** - Hero slider, statistics, facilities preview, student testimonials, achievements, and admission CTA
- **About** - School history, vision, mission, values, timeline, and achievements
- **Academics** - Curriculum, programs, teaching methodology, examination system, and co-curricular activities
- **Admissions** - Admission process, eligibility criteria, required documents, and online form
- **Facilities** - Complete showcase of school facilities with search and filter
- **Student Life** - Activities, clubs, events, hostel life, and achievements
- **Gallery** - Photo gallery with lightbox viewer and category filters
- **Notice Board** - Latest notices with search and download capabilities
- **Events** - Upcoming and past events with calendar
- **Staff** - Staff directory with search and department filters
- **Contact** - Contact form, location, hours, and social media links

### Technical Features
- ✨ **Smooth Animations** - Framer Motion animations throughout
- 📱 **Fully Responsive** - Mobile-first design for all devices
- 🎨 **Premium UI** - Glassmorphism, gradients, and modern design
- 🖼️ **Real Images** - Uses actual school photos from `/images` folder
- 🔍 **SEO Optimized** - Semantic HTML and meta tags
- ⚡ **Fast Loading** - Optimized components and lazy loading
- 🎭 **Sticky Navigation** - Persistent header with mobile menu
- 🔄 **Image Slider** - Swiper.js image carousel with Framer Motion
- 🎯 **Interactive Elements** - Hover effects, modal galleries, form handling

## 🎨 Design System

### Color Palette
- **Primary**: #0F4C81 (Deep Blue)
- **Secondary**: #1E88E5 (Bright Blue)
- **Accent**: #FFC107 (Golden Yellow)
- **White & Grays**: Clean backgrounds

### Typography
- **Display Font**: Outfit (headings)
- **Body Font**: Plus Jakarta Sans (content)

### Components
- SectionTitle - Reusable section headers
- StatCard - Statistics cards
- FeatureCard - Feature showcase cards
- FacilityCard - Facility cards with images
- TestimonialCard - Student testimonials
- EventCard - Event cards
- AchievementCard - Achievement cards
- GalleryImage - Gallery images with hover effects
- StaffCard - Staff member cards
- NoticeCard - Notice board items

## 📦 Installation

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Setup Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Build for production**
   ```bash
   npm run build
   ```

4. **Preview production build**
   ```bash
   npm run preview
   ```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── public/
│   │   │   ├── PublicLayout.jsx
│   │   │   ├── PublicHeader.jsx
│   │   │   ├── PublicFooter.jsx
│   │   │   └── SectionComponents.jsx
│   │   └── ...existing components
│   ├── pages/
│   │   ├── public/
│   │   │   ├── Home.jsx
│   │   │   ├── About.jsx
│   │   │   ├── Academics.jsx
│   │   │   ├── Admissions.jsx
│   │   │   ├── Facilities.jsx
│   │   │   ├── StudentLife.jsx
│   │   │   ├── Gallery.jsx
│   │   │   ├── NoticeBoard.jsx
│   │   │   ├── Events.jsx
│   │   │   ├── Staff.jsx
│   │   │   └── Contact.jsx
│   │   └── ...existing pages
│   ├── constants/
│   │   └── schoolData.js
│   ├── images/
│   │   └── ...school photos
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── tailwind.config.js
├── vite.config.js
└── package.json
```

## 🎯 Customization Guide

### Update School Information
Edit `src/constants/schoolData.js`:
```javascript
export const SCHOOL_INFO = {
  name: 'Your School Name',
  tagline: 'Your Tagline',
  phone: 'Your Phone',
  email: 'Your Email',
  address: 'Your Address',
  // ... other fields
};
```

### Change Color Scheme
Update in `src/constants/schoolData.js`:
```javascript
export const COLORS = {
  primary: '#Your Color',
  secondary: '#Your Color',
  accent: '#Your Color',
};
```

### Add/Update Images
Place school photos in `/src/images/` and reference them in components:
```jsx
<img src="/src/images/your-image.png" alt="Description" />
```

### Customize Navigation
Edit the `navItems` array in `PublicHeader.jsx`:
```javascript
const navItems = [
  { label: 'Home', path: '/' },
  // Add your items here
];
```

## 🚀 Deployment

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Render
```bash
# Build
npm run build

# Create render.yaml (already included)
# Push to GitHub and connect to Render
```

### Deploy to Other Platforms
The `render.yaml` and `vercel.json` files are already configured for deployment.

## 📚 Dependencies

- **React** - UI library
- **React Router DOM** - Client-side routing
- **Framer Motion** - Animations
- **Tailwind CSS** - Styling
- **Swiper** - Image carousel
- **React Icons** - Icon library
- **Axios** - HTTP client
- **React Intersection Observer** - Scroll animations

## 🔧 Environment Variables

Create a `.env` file:
```env
VITE_API_URL=https://api.example.com
```

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## 🎓 Admin Dashboard

The website also includes an admin dashboard at `/admin/*` for managing:
- Students
- Teachers
- Classes
- Attendance
- Exams
- Results
- And more

Access at: `/admin/login`

## 📞 Support

For issues or questions about the website:
- Email: balbodhschool9@gmail.com
- Phone: +977-985-2860773

## 📄 License

This website is proprietary to Balbodh Secondary School.

## 🙏 Credits

Built with ❤️ for Balbodh Secondary School
- React.js
- Tailwind CSS
- Framer Motion
- Swiper.js
- And many more open-source libraries

---

**Last Updated**: May 2026
**Version**: 1.0.0
