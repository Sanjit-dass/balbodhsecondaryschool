const express = require('express');
const router = express.Router();
const PhotoGallery = require('../models/PhotoGallery');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('../utils/cloudinary');

const upload = multer({ storage: multer.memoryStorage() });

// Public: list all published photos (flattened)
router.get('/photos', async (req, res) => {
  try {
    const docs = await PhotoGallery.find({ status: 'published' }).lean();
    const photos = (docs || []).reduce((arr, g) => {
      (g.photos||[]).forEach(p => arr.push(Object.assign({}, p, { galleryId: g._id, galleryTitle: g.title, galleryCategory: g.category, galleryCover: g.coverPhoto }))); return arr;
    }, []);
    return res.json({ success: true, data: photos });
  } catch (err) { console.error(err); return res.status(500).json({ success: false, message: 'Server error' }); }
});

// Public: list galleries
router.get('/', async (req, res) => {
  try { const list = await PhotoGallery.find({}).sort({ createdAt: -1 }).lean(); return res.json({ success: true, data: list }); } catch (err) { console.error(err); return res.status(500).json({ success: false, message: 'Server error' }); }
});

// Admin: create gallery
router.post('/', auth, roles(['superadmin','principal','admin']), async (req, res) => {
  try {
    const g = new PhotoGallery({ title: req.body.title||'', description: req.body.description||'', category: req.body.category||'other', status: req.body.status||'published', createdBy: req.user.id || req.user._id });
    await g.save();
    return res.json({ success: true, data: g });
  } catch (err) { console.error(err); return res.status(500).json({ success: false, message: 'Server error' }); }
});

// Admin: upload photos to gallery
router.post('/:id/photos', auth, roles(['superadmin','principal','admin']), upload.array('photos'), async (req, res) => {
  try {
    const g = await PhotoGallery.findById(req.params.id);
    if (!g) return res.status(404).json({ success: false, message: 'Not found' });
    if (req.files && req.files.length) {
      const folder = `balbodh-school/gallery/${g._id}`;
      for (const file of req.files) {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'auto', use_filename: true, unique_filename: false }, (err, r) => err? reject(err): resolve(r));
          streamifier.createReadStream(file.buffer).pipe(stream);
        });
        const url = result.secure_url || result.url;
        g.photos.push({ title: file.originalname, url, caption: req.body.caption || '', publicId: result.public_id });
        // If no cover set, make the first uploaded photo the cover
        if (!g.coverPhoto) {
          // will be populated after save; set to last pushed id after save below
        }
      }
      await g.save();
      // ensure coverPhoto is set to first photo if missing
      if (!g.coverPhoto && g.photos && g.photos.length) {
        g.coverPhoto = g.photos[0]._id;
        await g.save();
      }
    }
    return res.json({ success: true, data: g });
  } catch (err) { console.error(err); return res.status(500).json({ success: false, message: 'Upload failed' }); }
});

// Admin: update gallery metadata
router.patch('/:id', auth, roles(['superadmin','principal','admin']), async (req, res) => {
  try {
    const g = await PhotoGallery.findById(req.params.id);
    if (!g) return res.status(404).json({ success: false, message: 'Not found' });
    if (req.body.title !== undefined) g.title = req.body.title;
    if (req.body.description !== undefined) g.description = req.body.description;
    if (req.body.status !== undefined) g.status = req.body.status;
    if (req.body.category !== undefined) g.category = req.body.category;
    if (req.body.coverPhotoId !== undefined) g.coverPhoto = req.body.coverPhotoId || null;
    await g.save();
    return res.json({ success: true, data: g });
  } catch (err) { console.error(err); return res.status(500).json({ success: false, message: 'Server error' }); }
});

// Admin: delete photo
router.delete('/:id/photos/:photoId', auth, roles(['superadmin','principal','admin']), async (req, res) => {
  try {
    const g = await PhotoGallery.findById(req.params.id);
    if (!g) return res.status(404).json({ success: false, message: 'Not found' });
    const photo = g.photos.id(req.params.photoId);
    if (!photo) return res.status(404).json({ success: false, message: 'Photo not found' });
    try { if (photo.publicId) await cloudinary.uploader.destroy(photo.publicId); }catch(e){ console.warn('cloudinary destroy failed', e.message||e); }
    // if this photo is set as cover, unset cover
    if (g.coverPhoto && g.coverPhoto.toString() === photo._id.toString()) {
      g.coverPhoto = null;
    }
    photo.remove(); await g.save();
    return res.json({ success: true, data: g });
  } catch (err) { console.error(err); return res.status(500).json({ success: false, message: 'Server error' }); }
});

// Admin: delete gallery
router.delete('/:id', auth, roles(['superadmin','principal','admin']), async (req, res) => {
  try { await PhotoGallery.findByIdAndDelete(req.params.id); return res.json({ success: true }); } catch (err) { console.error(err); return res.status(500).json({ success: false, message: 'Server error' }); }
});

module.exports = router;
