const express = require('express');
const router = express.Router();
const Facility = require('../models/Facility');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('../utils/cloudinary');

// public list
router.get('/', async (req, res) => {
  try {
    const facilities = await Facility.find({ status: { $ne: 'hidden' } })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();
    return res.json({ success: true, data: facilities });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// public get single
router.get('/:id', async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id).lean();
    if (!facility) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, data: facility });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// admin create (accept JSON or multipart/form-data with photos)
const upload = multer({ storage: multer.memoryStorage() });
router.post('/', auth, roles(['superadmin','principal','admin']), upload.array('photos'), async (req, res) => {
  try {
    const body = req.body || {};
    const facilityName = body.facilityName || '';
    const shortDescription = body.shortDescription || '';
    const fullDescription = body.fullDescription || '';
    const category = body.category || 'Infrastructure';
    const status = body.status || 'published';
    const featured = body.featured === 'true' || body.featured === true;
    const displayOrder = body.displayOrder ? Number(body.displayOrder) : 0;

    const facility = new Facility({ 
      facilityName, 
      shortDescription, 
      fullDescription, 
      category, 
      status, 
      featured, 
      displayOrder, 
      createdBy: req.user.id || req.user._id 
    });

    // handle uploaded photos (if any)
    if (req.files && req.files.length) {
      const folder = `balbodh-school/facilities/${facility._id}`;
      for (const file of req.files) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'auto', use_filename: true, unique_filename: false }, (err, res) => err ? reject(err) : resolve(res));
          streamifier.createReadStream(file.buffer).pipe(stream);
        });
        const url = result.secure_url || result.url;
        const publicId = result.public_id;
        facility.photos.push({ url, caption: file.originalname, publicId });
      }
    }

    // cover index handling (if supplied)
    if (body.coverIndex !== undefined && facility.photos && facility.photos.length) {
      const idx = Number(body.coverIndex) || 0;
      if (facility.photos[idx]) facility.coverPhoto = facility.photos[idx]._id;
    }

    await facility.save();
    return res.json({ success: true, data: facility });
  } catch (err) {
    console.error('Create facility error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// admin update
router.patch('/:id', auth, roles(['superadmin','principal','admin']), async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) return res.status(404).json({ message: 'Not found' });
    const { facilityName, shortDescription, fullDescription, category, status, featured, displayOrder } = req.body;
    if (facilityName !== undefined) facility.facilityName = facilityName;
    if (shortDescription !== undefined) facility.shortDescription = shortDescription;
    if (fullDescription !== undefined) facility.fullDescription = fullDescription;
    if (category !== undefined) facility.category = category;
    if (status !== undefined) facility.status = status;
    if (featured !== undefined) facility.featured = featured === 'true' || featured === true;
    if (displayOrder !== undefined) facility.displayOrder = displayOrder;
    if (req.body.coverPhoto !== undefined) {
      facility.coverPhoto = req.body.coverPhoto || undefined;
    }
    await facility.save();
    return res.json({ success: true, data: facility });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// admin update via PUT (also accept multipart/form-data with photos)
router.put('/:id', auth, roles(['superadmin','principal','admin']), upload.array('photos'), async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) return res.status(404).json({ success: false, message: 'Not found' });
    const body = req.body || {};
    if (body.facilityName !== undefined) facility.facilityName = body.facilityName;
    if (body.shortDescription !== undefined) facility.shortDescription = body.shortDescription;
    if (body.fullDescription !== undefined) facility.fullDescription = body.fullDescription;
    if (body.category !== undefined) facility.category = body.category;
    if (body.status !== undefined) facility.status = body.status;
    if (body.featured !== undefined) facility.featured = body.featured === 'true' || body.featured === true;
    if (body.displayOrder !== undefined) facility.displayOrder = Number(body.displayOrder);

    if (req.files && req.files.length) {
      const folder = `balbodh-school/facilities/${req.params.id}`;
      for (const file of req.files) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'auto', use_filename: true, unique_filename: false }, (err, res) => err ? reject(err) : resolve(res));
          streamifier.createReadStream(file.buffer).pipe(stream);
        });
        const url = result.secure_url || result.url;
        const publicId = result.public_id;
        facility.photos.push({ url, caption: file.originalname, publicId });
      }
    }

    // handle coverIndex for PUT requests
    if (body.coverIndex !== undefined && facility.photos && facility.photos.length) {
      const idx = Number(body.coverIndex) || 0;
      if (facility.photos[idx]) facility.coverPhoto = facility.photos[idx]._id;
    }

    await facility.save();
    return res.json({ success: true, data: facility });
  } catch (err) {
    console.error('PUT facility error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// admin delete
router.delete('/:id', auth, roles(['superadmin','principal','admin']), async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) return res.status(404).json({ success: false, message: 'Not found' });
    await Facility.findByIdAndDelete(req.params.id);
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
    const facility = await Facility.findById(id);
    if (!facility) return res.status(404).json({ success: false, message: 'Not found' });
    const photo = facility.photos.id(photoId);
    if (!photo) return res.status(404).json({ success: false, message: 'Photo not found' });
    // attempt to remove from cloudinary if publicId present
    try { if (photo.publicId) await cloudinary.uploader.destroy(photo.publicId); } catch(e){ console.warn('Cloudinary destroy failed', e.message||e); }
    photo.remove();
    // if removed photo was coverPhoto, clear coverPhoto
    if (facility.coverPhoto && String(facility.coverPhoto) === String(photo._id)) facility.coverPhoto = undefined;
    await facility.save();
    return res.json({ success: true, data: facility.photos });
  } catch (err) {
    console.error('Delete photo error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// upload photos (multipart) - admin
router.post('/:id/photos', auth, roles(['superadmin','principal','admin']), upload.array('photos'), async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) return res.status(404).json({ message: 'Not found' });
    if (!req.files || !req.files.length) return res.status(400).json({ message: 'No files' });
    const folder = `balbodh-school/facilities/${req.params.id}`;
    const uploaded = [];
    for (const file of req.files) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'auto', use_filename: true, unique_filename: false }, (err, res) => err ? reject(err) : resolve(res));
        streamifier.createReadStream(file.buffer).pipe(stream);
      });
      const url = result.secure_url || result.url;
      const publicId = result.public_id;
      facility.photos.push({ url, caption: file.originalname, publicId });
      uploaded.push({ url, caption: file.originalname, publicId });
    }
    await facility.save();
    return res.json({ success: true, data: facility.photos });
  } catch (err) {
    console.error('Upload photos error', err);
    return res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

module.exports = router;
