const express = require('express');
const router = express.Router();
const Achievement = require('../models/Achievement');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('../utils/cloudinary');

// public list
router.get('/', async (req, res) => {
  try {
    const achievements = await Achievement.find({ status: { $ne: 'hidden' } })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();
    return res.json({ success: true, data: achievements });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// public get single
router.get('/:id', async (req, res) => {
  try {
    const ach = await Achievement.findById(req.params.id).lean();
    if (!ach) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, data: ach });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// admin create (accept JSON or multipart/form-data with photos)
const upload = multer({ storage: multer.memoryStorage() });
router.post('/', auth, roles(['superadmin','principal','admin']), upload.array('photos'), async (req, res) => {
  try {
    // Fields may come as JSON body or as form fields (strings) when multipart
    const body = req.body || {};
    const title = body.title || '';
    const studentName = body.studentName || '';
    const studentClass = body.studentClass || '';
    const achievementDate = body.achievementDate ? new Date(body.achievementDate) : undefined;
    const shortDescription = body.shortDescription || '';
    const description = body.description || '';
    let statistics = [];
    if (body.statistics) {
      try {
        const parsed = typeof body.statistics === 'string' ? JSON.parse(body.statistics) : body.statistics;
        if (Array.isArray(parsed)) statistics = parsed;
        else if (parsed && typeof parsed === 'object') statistics = Object.entries(parsed).map(([k,v])=> ({ label: k, value: String(v) }));
      } catch(e){ statistics = []; }
    }
    const displayOrder = body.displayOrder ? Number(body.displayOrder) : (req.body.displayOrder || 0);
    const status = body.status || 'published';

    const ach = new Achievement({ title, studentName, studentClass, achievementDate, shortDescription, description, statistics, displayOrder, status, createdBy: req.user.id || req.user._id });

    // handle uploaded photos (if any)
    if (req.files && req.files.length) {
      const folder = `balbodh-school/achievements/${ach._id}`;
      for (const file of req.files) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'auto', use_filename: true, unique_filename: false }, (err, res) => err ? reject(err) : resolve(res));
          streamifier.createReadStream(file.buffer).pipe(stream);
        });
        const url = result.secure_url || result.url;
        const publicId = result.public_id;
        ach.photos.push({ url, caption: file.originalname, publicId });
      }
    }

    // cover index handling (if supplied)
    if (body.coverIndex !== undefined && ach.photos && ach.photos.length) {
      const idx = Number(body.coverIndex) || 0;
      if (ach.photos[idx]) ach.coverPhoto = ach.photos[idx]._id;
    }

    await ach.save();
    return res.json({ success: true, data: ach });
  } catch (err) {
    console.error('Create achievement error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// admin update
router.patch('/:id', auth, roles(['superadmin','principal','admin']), async (req, res) => {
  try {
    const ach = await Achievement.findById(req.params.id);
    if (!ach) return res.status(404).json({ message: 'Not found' });
    const { title, description, statistics, displayOrder, status, studentName, studentClass, achievementDate, shortDescription } = req.body;
    if (title !== undefined) ach.title = title;
    if (description !== undefined) ach.description = description;
    if (studentName !== undefined) ach.studentName = studentName;
    if (studentClass !== undefined) ach.studentClass = studentClass;
    if (achievementDate !== undefined) ach.achievementDate = achievementDate ? new Date(achievementDate) : undefined;
    if (shortDescription !== undefined) ach.shortDescription = shortDescription;
    if (statistics !== undefined) ach.statistics = statistics;
    if (displayOrder !== undefined) ach.displayOrder = displayOrder;
    if (status !== undefined) ach.status = status;
    if (req.body.coverPhoto !== undefined) {
      ach.coverPhoto = req.body.coverPhoto || undefined;
    }
    await ach.save();
    return res.json({ success: true, data: ach });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// admin update via PUT (also accept multipart/form-data with photos)
router.put('/:id', auth, roles(['superadmin','principal','admin']), upload.array('photos'), async (req, res) => {
  try {
    const ach = await Achievement.findById(req.params.id);
    if (!ach) return res.status(404).json({ success: false, message: 'Not found' });
    const body = req.body || {};
    if (body.title !== undefined) ach.title = body.title;
    if (body.description !== undefined) ach.description = body.description;
    if (body.studentName !== undefined) ach.studentName = body.studentName;
    if (body.studentClass !== undefined) ach.studentClass = body.studentClass;
    if (body.achievementDate !== undefined) ach.achievementDate = body.achievementDate ? new Date(body.achievementDate) : undefined;
    if (body.shortDescription !== undefined) ach.shortDescription = body.shortDescription;
    if (body.statistics !== undefined) {
      try {
        const parsed = typeof body.statistics === 'string' ? JSON.parse(body.statistics) : body.statistics;
        if (Array.isArray(parsed)) ach.statistics = parsed;
        else if (parsed && typeof parsed === 'object') ach.statistics = Object.entries(parsed).map(([k,v])=> ({ label: k, value: String(v) }));
      } catch(e){ /* ignore */ }
    }
    if (body.displayOrder !== undefined) ach.displayOrder = Number(body.displayOrder);
    if (body.status !== undefined) ach.status = body.status;

    if (req.files && req.files.length) {
      const folder = `balbodh-school/achievements/${ach._id}`;
      for (const file of req.files) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'auto', use_filename: true, unique_filename: false }, (err, res) => err ? reject(err) : resolve(res));
          streamifier.createReadStream(file.buffer).pipe(stream);
        });
        const url = result.secure_url || result.url;
        const publicId = result.public_id;
        ach.photos.push({ url, caption: file.originalname, publicId });
      }
    }

    // handle coverIndex for PUT requests
    if (body.coverIndex !== undefined && ach.photos && ach.photos.length) {
      const idx = Number(body.coverIndex) || 0;
      if (ach.photos[idx]) ach.coverPhoto = ach.photos[idx]._id;
    }

    await ach.save();
    return res.json({ success: true, data: ach });
  } catch (err) {
    console.error('PUT achievement error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// admin delete
router.delete('/:id', auth, roles(['superadmin','principal','admin']), async (req, res) => {
  try {
    const ach = await Achievement.findById(req.params.id);
    if (!ach) return res.status(404).json({ success: false, message: 'Not found' });
    await Achievement.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// delete a photo by subdocument id
router.delete('/:id/photos/:photoId', auth, roles(['superadmin','principal','admin']), async (req, res) => {
  try {
    const { id, photoId } = req.params;
    const ach = await Achievement.findById(id);
    if (!ach) return res.status(404).json({ success: false, message: 'Not found' });
    const photo = ach.photos.id(photoId);
    if (!photo) return res.status(404).json({ success: false, message: 'Photo not found' });
    // attempt to remove from cloudinary if publicId present
    try { if (photo.publicId) await cloudinary.uploader.destroy(photo.publicId); } catch(e){ console.warn('Cloudinary destroy failed', e.message||e); }
    photo.remove();
    // if removed photo was coverPhoto, clear coverPhoto
    if (ach.coverPhoto && String(ach.coverPhoto) === String(photo._id)) ach.coverPhoto = undefined;
    await ach.save();
    return res.json({ success: true, data: ach.photos });
  } catch (err) {
    console.error('Delete photo error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// upload photos (multipart) - admin
router.post('/:id/photos', auth, roles(['superadmin','principal','admin']), upload.array('photos'), async (req, res) => {
  try {
    const ach = await Achievement.findById(req.params.id);
    if (!ach) return res.status(404).json({ message: 'Not found' });
    if (!req.files || !req.files.length) return res.status(400).json({ message: 'No files' });
    const folder = `balbodh-school/achievements/${req.params.id}`;
    const uploaded = [];
    for (const file of req.files) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'auto', use_filename: true, unique_filename: false }, (err, res) => err ? reject(err) : resolve(res));
        streamifier.createReadStream(file.buffer).pipe(stream);
      });
      const url = result.secure_url || result.url;
      const publicId = result.public_id;
      ach.photos.push({ url, caption: file.originalname, publicId });
      uploaded.push({ url, caption: file.originalname, publicId });
    }
    await ach.save();
    return res.json({ success: true, data: ach.photos });
  } catch (err) {
    console.error('Upload photos error', err);
    return res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

module.exports = router;
