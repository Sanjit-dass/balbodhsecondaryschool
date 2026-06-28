const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const multer = require('multer');
const path = require('path');
const streamifier = require('streamifier');
const cloudinary = require('../utils/cloudinary');
const Document = require('../models/Document');

// Use memory storage and upload buffer to Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', auth, roles(['superadmin','principal','admin']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const folder = `balbodh-school/${req.query.folder || 'uploads'}`;
    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    if (!cloudinaryUrl) {
      return res.status(503).json({ message: 'Cloudinary not configured. Please set CLOUDINARY_URL.' });
    }
    if (cloudinaryUrl.includes('<your_api_key>') || cloudinaryUrl.includes('<your_api_secret>') || cloudinaryUrl.includes('<cloud_name>')) {
      return res.status(503).json({ message: 'Cloudinary configuration is using placeholder values. Update CLOUDINARY_URL in server/.env with your real Cloudinary credentials.' });
    }

    const mimeType = req.file.mimetype || '';
    const fileExtension = (req.file.originalname || '').split('.').pop().toLowerCase();
    
    // Decide resource_type. Prefer 'auto' so Cloudinary serves PDFs inline and
    // images are handled correctly. Using 'raw' forces download for PDFs.
    const resourceType = 'auto';

    console.log('📤 Memory storage upload: file=', req.file.originalname, 'ext=', fileExtension, 'mimetype=', mimeType, 'resource_type=', resourceType);

    // Create upload stream and capture returned stream to attach error handlers.
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error && (error.stack || error.message || error));
          return res.status(500).json({ message: (error && error.message) || 'Upload failed' });
        }

        if (!result || !(result.secure_url || result.url)) {
          console.error('Cloudinary returned no URL, result:', result);
          return res.status(500).json({ message: 'Upload succeeded but no file URL returned' });
        }

        // Validate the URL is properly formed
        const fileUrl = result.secure_url || result.url;
        if (!fileUrl || !fileUrl.startsWith('http')) {
          console.error('Invalid Cloudinary URL:', fileUrl);
          return res.status(500).json({ message: 'Cloudinary returned invalid URL' });
        }

        console.log('Cloudinary upload response:', result);
        console.log('📎 Upload complete: resource_type=', result.resource_type, 'type=', result.type, 'format=', result.format);
        console.log('SAVED FILE URL:', fileUrl, 'PUBLIC ID:', result.public_id);

        const docType = req.body.type || req.query.folder || 'other';
        // determine strict category
        let category = req.body.category || req.query.category || null;
        const mime = (req.file.mimetype || '').toLowerCase();
        const ext = (req.file.originalname || '').split('.').pop().toLowerCase();
        if (!category) {
          if (mime.startsWith('image/')) {
            // infer from folder name hints
            if (/staff|teacher/i.test(folder)) category = 'staff-gallery';
            else if (/event|events/i.test(folder)) category = 'event-gallery';
            else if (/class|classroom|class-?/i.test(folder) || /students?/i.test(folder)) category = 'class-gallery';
            else category = 'student-gallery';
          } else if (['pdf','doc','docx'].includes(ext) || mime === 'application/pdf' || /word|pdf/.test(mime)) {
            category = 'important-document';
          } else {
            category = 'important-document';
          }
        }

        const documentData = {
          title: (req.body.title || req.file.originalname || `${docType} document`).trim(),
          description: req.body.description,
          type: docType,
          category,
          folder,
          fileUrl,
          publicId: result.public_id,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          audience: 'public',
          status: 'published',
          createdBy: req.user?.id || req.user?._id
        };

        try {
          const document = new Document(documentData);
          await document.save();
          return res.json({ fileUrl, publicId: result.public_id, originalName: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size, document });
        } catch (saveErr) {
          console.error('Failed to persist document metadata:', saveErr);
          return res.status(500).json({ message: 'File uploaded but document metadata could not be saved.' });
        }
      }
    );

    const readStream = streamifier.createReadStream(req.file.buffer);
    readStream.on('error', (streamErr) => {
      console.error('Upload read stream error:', streamErr && (streamErr.stack || streamErr.message || streamErr));
      return res.status(500).json({ message: 'Upload stream failed.' });
    });

    uploadStream.on('error', (uploadErr) => {
      console.error('Cloudinary upload stream error:', uploadErr && (uploadErr.stack || uploadErr.message || uploadErr));
      return res.status(500).json({ message: (uploadErr && uploadErr.message) || 'Cloudinary upload failed.' });
    });

    // Pipe buffer into Cloudinary upload stream
    readStream.pipe(uploadStream);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/public', async (req, res) => {
  try {
    // Return only published public documents that are explicitly important documents
    const documents = await Document.find({ status: 'published', audience: 'public', category: 'important-document' })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ documents });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', auth, roles(['superadmin','principal','admin']), async (req, res) => {
  try {
    const documents = await Document.find({ createdBy: req.user.id || req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ documents });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id', auth, roles(['superadmin','principal','admin']), async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    if (document.createdBy.toString() !== (req.user.id || req.user._id).toString() && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const { title, description, status, audience } = req.body;
    if (title) document.title = title;
    if (description !== undefined) document.description = description;
    if (status) document.status = status;
    if (audience) document.audience = audience;
    await document.save();
    res.json(document);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', auth, roles(['superadmin','principal','admin']), async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    if (document.createdBy.toString() !== (req.user.id || req.user._id).toString() && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (document.publicId) {
      try {
        const resourceType = document.mimetype ? (document.mimetype.startsWith('video') ? 'video' : (document.mimetype.startsWith('image') ? 'image' : 'auto')) : 'auto';
        await cloudinary.uploader.destroy(document.publicId, { resource_type: resourceType });
      } catch (cloudErr) {
        console.error('Failed to delete from Cloudinary:', cloudErr);
      }
    }
    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
