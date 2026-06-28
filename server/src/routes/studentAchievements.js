const express = require('express');
const router = express.Router();
const StudentAchievement = require('../models/StudentAchievement');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('../utils/cloudinary');

const upload = multer({ storage: multer.memoryStorage() });

// public list
router.get('/', async (req, res) => {
  try {
    const { category, academicYear, featured } = req.query;
    const filter = { status: 'published' };
    if (category) filter.category = category;
    if (academicYear) filter.academicYear = academicYear;
    if (featured === 'true') filter.featured = true;
    const items = await StudentAchievement.find(filter).sort({ displayOrder: 1, createdAt: -1 }).lean();
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// public get single
router.get('/:id', async (req, res) => {
  try {
    const item = await StudentAchievement.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, data: item });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// admin create
router.post('/', auth, roles(['superadmin','principal','admin']), upload.array('photos'), async (req, res) => {
  try {
    console.log('POST student-achievements body:', req.body);
    console.log('POST student-achievements files:', req.files?.length);
    const body = req.body || {};
    const title = body.title || '';
    const studentName = body.studentName || '';
    const studentClass = body.studentClass || '';
    const achievementDate = body.achievementDate ? new Date(body.achievementDate) : undefined;
    const shortDescription = body.shortDescription || '';
    const description = body.description || '';
    const category = body.category || 'Academic';
    let statistics = [];
    if (body.statistics) {
      try {
        const parsed = typeof body.statistics === 'string' ? JSON.parse(body.statistics) : body.statistics;
        if (Array.isArray(parsed)) statistics = parsed;
        else if (parsed && typeof parsed === 'object') statistics = Object.entries(parsed).map(([k,v])=> ({ label:k, value:String(v) }));
      } catch(e){ console.error('Statistics parse error:', e); statistics = []; }
    }
    const displayOrder = body.displayOrder ? Number(body.displayOrder) : 0;
    const status = body.status || 'published';

    const item = new StudentAchievement({ 
      title, studentName, studentClass, achievementDate, shortDescription, description, 
      category, statistics, displayOrder, status, createdBy: req.user?.id || req.user?._id 
    });

    if (req.files && req.files.length) {
      const folder = `balbodh-school/student-achievements/${item._id}`;
      for (const file of req.files) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'auto', use_filename: true, unique_filename: false }, (err, res) => err ? reject(err) : resolve(res));
          streamifier.createReadStream(file.buffer).pipe(stream);
        });
        const url = result.secure_url || result.url;
        const publicId = result.public_id;
        item.photos.push({ url, caption: file.originalname, publicId });
      }
    }

    if (body.coverIndex !== undefined && item.photos && item.photos.length) {
      const idx = Number(body.coverIndex) || 0;
      if (item.photos[idx]) item.coverPhoto = item.photos[idx]._id;
    }

    await item.save();
    console.log('Student achievement saved successfully:', item._id);
    return res.json({ success: true, data: item });
  } catch (err) {
    console.error('Create student achievement error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// admin patch
router.patch('/:id', auth, roles(['superadmin','principal','admin']), async (req, res) => {
  try {
    const item = await StudentAchievement.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    const { title, description, statistics, displayOrder, status, shortDescription, studentName, studentClass, achievementDate, category } = req.body;
    if (title !== undefined) item.title = title;
    if (description !== undefined) item.description = description;
    if (studentName !== undefined) item.studentName = studentName;
    if (studentClass !== undefined) item.studentClass = studentClass;
    if (achievementDate !== undefined) item.achievementDate = achievementDate ? new Date(achievementDate) : undefined;
    if (shortDescription !== undefined) item.shortDescription = shortDescription;
    if (category !== undefined) item.category = category;
    if (statistics !== undefined) item.statistics = statistics;
    if (displayOrder !== undefined) item.displayOrder = displayOrder;
    if (status !== undefined) item.status = status;
    if (req.body.coverPhoto !== undefined) item.coverPhoto = req.body.coverPhoto || undefined;
    await item.save();
    return res.json({ success: true, data: item });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// admin put (with photos)
router.put('/:id', auth, roles(['superadmin','principal','admin']), upload.array('photos'), async (req, res) => {
  try {
    const item = await StudentAchievement.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    const body = req.body || {};
    if (body.title !== undefined) item.title = body.title;
    if (body.description !== undefined) item.description = body.description;
    if (body.studentName !== undefined) item.studentName = body.studentName;
    if (body.studentClass !== undefined) item.studentClass = body.studentClass;
    if (body.achievementDate !== undefined) item.achievementDate = body.achievementDate ? new Date(body.achievementDate) : undefined;
    if (body.shortDescription !== undefined) item.shortDescription = body.shortDescription;
    if (body.category !== undefined) item.category = body.category;
    if (body.statistics !== undefined) {
      try {
        const parsed = typeof body.statistics === 'string' ? JSON.parse(body.statistics) : body.statistics;
        if (Array.isArray(parsed)) item.statistics = parsed;
        else if (parsed && typeof parsed === 'object') item.statistics = Object.entries(parsed).map(([k,v])=> ({ label:k, value:String(v) }));
      } catch(e){ }
    }
    if (body.displayOrder !== undefined) item.displayOrder = Number(body.displayOrder);
    if (body.status !== undefined) item.status = body.status;

    if (req.files && req.files.length) {
      const folder = `balbodh-school/student-achievements/${item._id}`;
      for (const file of req.files) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'auto', use_filename: true, unique_filename: false }, (err, res) => err ? reject(err) : resolve(res));
          streamifier.createReadStream(file.buffer).pipe(stream);
        });
        const url = result.secure_url || result.url;
        const publicId = result.public_id;
        item.photos.push({ url, caption: file.originalname, publicId });
      }
    }

    if (body.coverIndex !== undefined && item.photos && item.photos.length) {
      const idx = Number(body.coverIndex) || 0;
      if (item.photos[idx]) item.coverPhoto = item.photos[idx]._id;
    }

    await item.save();
    return res.json({ success: true, data: item });
  } catch (err) {
    console.error('PUT student achievement error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// admin delete
router.delete('/:id', auth, roles(['superadmin','principal','admin']), async (req, res) => {
  try {
    const item = await StudentAchievement.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    await StudentAchievement.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// delete photo
router.delete('/:id/photos/:photoId', auth, roles(['superadmin','principal','admin']), async (req, res) => {
  try {
    const { id, photoId } = req.params;
    const item = await StudentAchievement.findById(id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    const photo = item.photos.id(photoId);
    if (!photo) return res.status(404).json({ success: false, message: 'Photo not found' });
    try { if (photo.publicId) await cloudinary.uploader.destroy(photo.publicId); } catch(e){ console.warn('Cloudinary destroy failed', e.message||e); }
    photo.remove();
    if (item.coverPhoto && String(item.coverPhoto) === String(photo._id)) item.coverPhoto = undefined;
    await item.save();
    return res.json({ success: true, data: item.photos });
  } catch (err) {
    console.error('Delete photo error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// upload photos
router.post('/:id/photos', auth, roles(['superadmin','principal','admin']), upload.array('photos'), async (req, res) => {
  try {
    const item = await StudentAchievement.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    if (!req.files || !req.files.length) return res.status(400).json({ message: 'No files' });
    const folder = `balbodh-school/student-achievements/${req.params.id}`;
    const uploaded = [];
    for (const file of req.files) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'auto', use_filename: true, unique_filename: false }, (err, res) => err ? reject(err) : resolve(res));
        streamifier.createReadStream(file.buffer).pipe(stream);
      });
      const url = result.secure_url || result.url;
      const publicId = result.public_id;
      item.photos.push({ url, caption: file.originalname, publicId });
      uploaded.push({ url, caption: file.originalname, publicId });
    }
    await item.save();
    return res.json({ success: true, data: item.photos });
  } catch (err) {
    console.error('Upload photos error', err);
    return res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

module.exports = router;
