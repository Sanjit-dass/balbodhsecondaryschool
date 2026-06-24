const express = require('express');
const router = express.Router();
const Brochure = require('../models/Brochure');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('../utils/cloudinary');

const upload = multer({ storage: multer.memoryStorage() });

// public: get latest published brochure
router.get('/latest', async (req, res) => {
  try {
    const item = await Brochure.findOne({ status: 'Published' }).sort({ createdAt: -1 }).lean();
    if (!item) return res.status(404).json({ success: false, message: 'No brochure found' });
    return res.json({ success: true, data: item });
  } catch (err) {
    console.error('Get latest brochure error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// admin list
router.get('/', auth, roles(['admin','superadmin','principal']), async (req, res) => {
  try {
    const items = await Brochure.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// admin upload
router.post('/', auth, roles(['admin','superadmin','principal']), upload.single('file'), async (req, res) => {
  try {
    const { title, academicSession, status } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    // upload to cloudinary
    const folder = `balbodh-school/brochures`;
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'auto', use_filename: true, unique_filename: false }, (err, result) => err ? reject(err) : resolve(result));
      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });

    const fileUrl = result.secure_url || result.url;
    const publicId = result.public_id;

    // if publishing, unpublish others
    if (status === 'Published') {
      await Brochure.updateMany({ status: 'Published' }, { $set: { status: 'Draft' } });
    }

    const item = new Brochure({ title, academicSession, fileUrl, fileName: req.file.originalname, publicId, status: status || 'Draft', uploadedBy: req.user.id || req.user._id });
    await item.save();
    return res.json({ success: true, data: item });
  } catch (err) {
    console.error('Upload brochure error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// admin patch
router.patch('/:id', auth, roles(['admin','superadmin','principal']), async (req, res) => {
  try {
    const item = await Brochure.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    const { title, academicSession, status } = req.body;
    if (title !== undefined) item.title = title;
    if (academicSession !== undefined) item.academicSession = academicSession;
    if (status !== undefined) {
      if (status === 'Published') await Brochure.updateMany({ status: 'Published' }, { $set: { status: 'Draft' } });
      item.status = status;
    }
    await item.save();
    return res.json({ success: true, data: item });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// admin delete
router.delete('/:id', auth, roles(['admin','superadmin','principal']), async (req, res) => {
  try {
    const item = await Brochure.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    try { if (item.publicId) await cloudinary.uploader.destroy(item.publicId); } catch(e){ console.warn('Cloudinary destroy failed', e.message||e); }
    await Brochure.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
