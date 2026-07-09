const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Facility = require('../models/Facility');

const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://balbodhsecondaryschool.edu.np').replace(/\/$/, '');

function formatUrl(loc, lastmod, changefreq = 'weekly', priority = '0.8') {
  let xml = '  <url>\n';
  xml += `    <loc>${FRONTEND_URL}${loc}</loc>\n`;
  if (lastmod) xml += `    <lastmod>${new Date(lastmod).toISOString()}</lastmod>\n`;
  xml += `    <changefreq>${changefreq}</changefreq>\n`;
  xml += `    <priority>${priority}</priority>\n`;
  xml += '  </url>\n';
  return xml;
}

router.get('/sitemap.xml', async (req, res) => {
  try {
    const staticPages = [
      '/',
      '/about',
      '/admissions',
      '/academics',
      '/facilities',
      '/student-achievements',
      '/academic-excellence',
      '/gallery',
      '/notice-board',
      '/events',
      '/staff',
      '/school-leadership',
      '/contact'
    ];

    const parts = [];
    parts.push('<?xml version="1.0" encoding="UTF-8"?>\n');
    parts.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n');

    // static pages
    for (const p of staticPages) parts.push(formatUrl(p, null, 'weekly', '0.8'));

    // dynamic events
    const events = await Event.find({ status: 'published' }).select('_id updatedAt createdAt eventDate').lean();
    for (const ev of events) {
      const last = ev.updatedAt || ev.createdAt || ev.eventDate;
      parts.push(formatUrl(`/events/${ev._id}`, last, 'monthly', '0.6'));
    }

    // dynamic facilities
    const facilities = await Facility.find({ status: { $ne: 'hidden' } }).select('_id updatedAt createdAt').lean();
    for (const f of facilities) {
      const last = f.updatedAt || f.createdAt;
      parts.push(formatUrl(`/facilities/${f._id}`, last, 'monthly', '0.6'));
    }

    parts.push('</urlset>');

    const xml = parts.join('');
    res.header('Content-Type', 'application/xml');
    // cache for 1 hour
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    console.error('Sitemap generation error', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
