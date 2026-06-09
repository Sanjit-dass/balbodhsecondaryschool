const express = require('express');
const router = express.Router();
const { extractCloudinaryPublicId } = require('../utils/cloudinaryHelpers');
const cloudinary = require('../utils/cloudinary');

// Dev-only endpoint to inspect Cloudinary resource metadata for a given URL or publicId.
// Usage: GET /api/cloudinary/check?url=<secure_url>  OR  /api/cloudinary/check?publicId=<public_id>
router.get('/check', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') return res.status(403).json({ message: 'Forbidden in production' });

    const { url, publicId } = req.query;
    let pid = publicId || (url ? extractCloudinaryPublicId(url) : null);
    if (!pid) return res.status(400).json({ message: 'publicId or url query required' });

    // Try auto/resource detection first
    try {
      const info = await cloudinary.api.resource(pid, { resource_type: 'auto' });
      return res.json({ resolved: true, resource_type: info.resource_type, secure_url: info.secure_url || info.url, info });
    } catch (errAuto) {
      // Try raw then image
      try {
        const infoRaw = await cloudinary.api.resource(pid, { resource_type: 'raw' });
        return res.json({ resolved: true, resource_type: infoRaw.resource_type, secure_url: infoRaw.secure_url || infoRaw.url, info: infoRaw });
      } catch (errRaw) {
        try {
          const infoImg = await cloudinary.api.resource(pid, { resource_type: 'image' });
          return res.json({ resolved: true, resource_type: infoImg.resource_type, secure_url: infoImg.secure_url || infoImg.url, info: infoImg });
        } catch (errImg) {
          return res.status(404).json({ resolved: false, message: 'Not found in Cloudinary', errors: [errAuto && errAuto.message, errRaw && errRaw.message, errImg && errImg.message] });
        }
      }
    }
  } catch (err) {
    console.error('Cloudinary check error:', err && err.message);
    res.status(500).json({ message: 'Server error', error: err && err.message });
  }
});

module.exports = router;
