const express = require('express');
const router = express.Router();
const Staff = require('../models/StaffLeadership');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('../utils/cloudinary');

// public list
router.get('/', async (req, res) => {
  try {
    const list = await Staff.find({ status: { $ne: 'inactive' } }).sort({ displayOrder: 1, fullName: 1 }).lean();
    return res.json({ success: true, data: list });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// public single
router.get('/:id', async (req, res) => {
  try {
    const item = await Staff.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, data: item });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

const upload = multer({ storage: multer.memoryStorage() });

// create (admin)
router.post('/', auth, roles(['superadmin','admin','principal']), upload.single('photo'), async (req, res) => {
  try {
    const body = req.body || {};
    const staff = new Staff({
      fullName: body.fullName || '',
      designation: body.designation || '',
      department: body.department || '',
      roleCategory: body.roleCategory || '',
      shortBio: body.shortBio || '',
      status: body.status || 'active',
      displayOrder: body.displayOrder ? Number(body.displayOrder) : 0,
      createdBy: req.user && req.user.id ? req.user.id : undefined
    });

    if (req.file) {
      const folder = `balbodh-school/staff/${staff._id}`;
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image', use_filename: true, unique_filename: false }, (err, resp) => err ? reject(err) : resolve(resp));
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
      staff.photo = { url: result.secure_url || result.url, publicId: result.public_id, caption: req.file.originalname };
    }

    await staff.save();
    return res.json({ success: true, data: staff });
  } catch (err) {
    console.error('Create staff error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// update (admin)
router.put('/:id', auth, roles(['superadmin','admin','principal']), upload.single('photo'), async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Not found' });
    const body = req.body || {};
    if (body.fullName !== undefined) staff.fullName = body.fullName;
    if (body.designation !== undefined) staff.designation = body.designation;
    if (body.department !== undefined) staff.department = body.department;
    if (body.roleCategory !== undefined) staff.roleCategory = body.roleCategory;
    if (body.shortBio !== undefined) staff.shortBio = body.shortBio;
    if (body.status !== undefined) staff.status = body.status;
    if (body.displayOrder !== undefined) staff.displayOrder = Number(body.displayOrder);

    if (req.file) {
      const folder = `balbodh-school/staff/${staff._id}`;
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image', use_filename: true, unique_filename: false }, (err, resp) => err ? reject(err) : resolve(resp));
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
      // attempt to remove old photo if publicId present
      try { if (staff.photo && staff.photo.publicId) await cloudinary.uploader.destroy(staff.photo.publicId); } catch(e){ console.warn('old photo destroy failed', e.message||e); }
      staff.photo = { url: result.secure_url || result.url, publicId: result.public_id, caption: req.file.originalname };
    }

    await staff.save();
    return res.json({ success: true, data: staff });
  } catch (err) {
    console.error('Update staff error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// delete (admin)
router.delete('/:id', auth, roles(['superadmin','admin','principal']), async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Not found' });
    // attempt to destroy photo in cloudinary
    try { if (staff.photo && staff.photo.publicId) await cloudinary.uploader.destroy(staff.photo.publicId); } catch(e){ console.warn('photo destroy failed', e.message||e); }
    await Staff.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    console.error('Delete staff error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
