const multer = require('multer');
const { getCloudinaryResourceType } = require('../utils/cloudinaryHelpers');
let CloudinaryStorage = null;
try {
  // optional dependency — allow graceful fallback if not installed
  CloudinaryStorage = require('multer-storage-cloudinary').CloudinaryStorage || require('multer-storage-cloudinary');
} catch (e) {
  CloudinaryStorage = null;
}
const cloudinary = require('../utils/cloudinary');

const imageFormats = ['jpg','jpeg','png','webp','gif','bmp','svg','ico','tiff'];
const docFormats = ['pdf','doc','docx','txt','xls','xlsx','ppt','pptx','odt','rtf'];

function getFileExtension(filename) {
  if (!filename) return '';
  return filename.split('.').pop().toLowerCase();
}

function shouldUseRawType(filename, mimetype) {
  // Don't use 'raw' for PDFs - use 'auto' instead so they display inline
  // Previously, 'raw' was used which forced Cloudinary to serve PDFs as downloads
  return false; // Always use 'auto' for better browser compatibility
}

function createStorage(folder, allowedFormats = [...imageFormats, ...docFormats], maxSize = 10 * 1024 * 1024) {
  const fileFilter = (req, file, cb) => {
    const ext = getFileExtension(file.originalname);
    console.log('📤 File upload detected: name=', file.originalname, 'ext=', ext, 'mimetype=', file.mimetype);
    if ([...imageFormats, ...docFormats].includes(ext)) return cb(null, true);
    if (file.mimetype === 'application/pdf' || file.mimetype === 'application/msword' || file.mimetype.includes('word')) return cb(null, true);
    console.error('❌ File type rejected: ext=', ext, 'mimetype=', file.mimetype);
    cb(new Error('Unsupported file type'));
  };

  const limits = { fileSize: maxSize };

  if (CloudinaryStorage) {
    const storage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: async (req, file) => {
        const original = file.originalname || 'file';
        const isRaw = shouldUseRawType(original, file.mimetype);
        return {
          folder: `balbodh-school/${folder}`,
          public_id: `${Date.now()}_${original.replace(/\.[^/.]+$/, '')}`,
          resource_type: isRaw ? 'raw' : 'auto'
        };
      },
    });
    return multer({ storage, fileFilter, limits });
  }

  // Fallback: multer memory storage + cloudinary upload stream
  const memoryUpload = multer({ storage: multer.memoryStorage(), fileFilter, limits });

  return {
    single: (fieldName) => (req, res, next) => {
      memoryUpload.single(fieldName)(req, res, function (err) {
        if (err) return next(err);
        if (!req.file) return next();

        if (!process.env.CLOUDINARY_URL) {
          return next(new Error('Cloudinary not configured'));
        }

        const streamifier = require('streamifier');
        const isRaw = shouldUseRawType(req.file.originalname, req.file.mimetype);
        console.log('☁️ Fallback upload: file=', req.file.originalname, 'resource_type=', isRaw ? 'raw' : 'auto');
        const opts = { folder: `balbodh-school/${folder}`, resource_type: isRaw ? 'raw' : 'auto' };
        const uploadStream = cloudinary.uploader.upload_stream(opts, (error, result) => {
          if (error) return next(error);
          console.log('✅ Cloudinary upload result:', result);
          console.log('UPLOAD RESPONSE:', result);
          // attach fields similar to multer-storage-cloudinary
          req.file.path = result.secure_url || result.url;
          req.file.filename = result.public_id;
          req.file.public_id = result.public_id;
          req.file.secure_url = result.secure_url;
          req.file.size = req.file.size || 0;
          console.log('SAVED FILE URL:', req.file.path, 'PUBLIC ID:', req.file.public_id);
          next();
        });

        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      });
    }
  };
}

module.exports = { createStorage, imageFormats, docFormats };
