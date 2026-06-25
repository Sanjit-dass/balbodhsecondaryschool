const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const { createStorage } = require('../middleware/upload');

// Generic upload endpoint — returns fileUrl and publicId
router.post('/', auth, roles(['superadmin','principal','admin','teacher','accountant']), (req, res, next) => {
  // allow folder param to decide storage folder
  const folder = `balbodh-school/${req.query.folder || 'others'}`;
  const upload = createStorage(folder).single('file');
  upload(req, res, function(err) {
    if (err) return res.status(400).json({ message: err.message || 'Upload error' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const f = req.file;
    // multer-storage-cloudinary stores file info on req.file with secure_url and public_id
    const fileUrl = f.secure_url || f.path || (f.location || '');
    const publicId = f.public_id || f.filename || f.key || '';
    console.log('Cloudinary upload response:', f);
    console.log('SAVED FILE URL:', fileUrl, 'PUBLIC ID:', publicId);
    return res.json({ fileUrl, publicId, originalName: f.originalname, mimetype: f.mimetype, size: f.size });
  });
});

// Delete by publicId
router.delete('/', auth, roles(['superadmin','principal']), async (req, res) => {
  try{
    const { publicId } = req.body;
    if(!publicId) return res.status(400).json({ message: 'publicId required' });
    const cloudinary = require('../utils/cloudinary');
    const { getCloudinaryResourceType, extractCloudinaryPublicId } = require('../utils/cloudinaryHelpers');
    const resourceType = getCloudinaryResourceType(publicId) || 'auto';
    const pub = extractCloudinaryPublicId(publicId) || publicId;
    console.log('Deleting Cloudinary asset:', pub, 'resource_type:', resourceType);
    await cloudinary.uploader.destroy(pub, { resource_type: resourceType });
    res.json({ message: 'Deleted' });
  }catch(err){ console.error(err); res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;
