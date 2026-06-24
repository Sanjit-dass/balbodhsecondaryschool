const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const Setting = require('../models/Setting');
const { createStorage } = require('../middleware/upload');

router.get('/', auth, roles(['superadmin','admin','principal','accountant','examcontroller']), async (req, res) => {
  try {
    const setting = await Setting.findOne().lean();
    res.json({ setting: setting || {} });
  } catch (err) {
    console.error('Failed to load settings:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public settings for frontend (safe to expose site-level content like principal message)
router.get('/public', async (req, res) => {
  try {
    const setting = await Setting.findOne().lean();
    // only expose public fields
    const publicFields = {};
    if (setting) {
      publicFields.schoolName = setting.schoolName;
      publicFields.logoUrl = setting.logoUrl;
      publicFields.principalName = setting.principalName;
      publicFields.principalDesignation = setting.principalDesignation;
      publicFields.principalImage = setting.principalImage;
      publicFields.principalMessageEnglish = setting.principalMessageEnglish;
      publicFields.principalMessageNepali = setting.principalMessageNepali;
    }
    res.json({ setting: publicFields });
  } catch (err) {
    console.error('Failed to load public settings:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/', auth, roles(['superadmin','admin','principal']), async (req, res) => {
  try {
    const payload = {
      schoolName: req.body.schoolName,
      schoolAddress: req.body.schoolAddress,
      admitCardHeader: req.body.admitCardHeader,
      admitCardWatermark: req.body.admitCardWatermark
    };
    const setting = await Setting.findOneAndUpdate({}, payload, { upsert: true, new: true, setDefaultsOnInsert: true });
    res.json({ setting });
  } catch (err) {
    console.error('Failed to update settings:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload school logo
router.post('/logo', auth, roles(['superadmin','principal']), (req, res) => {
  const upload = createStorage('school-logo').single('file');
  upload(req, res, async function(err) {
    if (err) return res.status(400).json({ message: err.message || 'Upload error' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    try{
      const fileUrl = req.file.path || req.file.secure_url || req.file.location || '';
      const publicId = req.file.filename || req.file.public_id || req.file.key || '';
      // upsert setting
      const s = await Setting.findOneAndUpdate({}, { logoUrl: fileUrl, logo: { fileUrl, publicId } }, { upsert: true, new: true, setDefaultsOnInsert: true });
      res.json({ setting: s });
    }catch(e){ console.error(e); res.status(500).json({ message: 'Server error' }); }
  });
});

module.exports = router;
