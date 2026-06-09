const validDocExtensions = ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'];

function extractCloudinaryPublicId(urlOrId) {
  if (!urlOrId || typeof urlOrId !== 'string') return null;

  // If the value already looks like a Cloudinary public ID, return it as-is.
  if (!urlOrId.startsWith('http') && !urlOrId.startsWith('//')) {
    return urlOrId;
  }

  try {
    const parsed = new URL(urlOrId);
    const path = parsed.pathname || '';
    const uploadIndex = path.indexOf('/upload/');
    if (uploadIndex === -1) return null;

    let publicId = path.slice(uploadIndex + '/upload/'.length);

    // Remove leading transformation segments such as fl_attachment:false, c_fill, w_200, ar_16:9, etc.
    const parts = publicId.split('/');
    const filtered = [];
    for (const part of parts) {
      if (part.includes(':')) continue;
      if (/^v\d+$/.test(part)) continue;
      if (/^(?:fl|c|w|h|q|e|ar|g|b|co|f|o|pg|usm|dpr|vc|x|y)_[^/]+$/.test(part)) continue;
      filtered.push(part);
    }

    publicId = filtered.join('/');
    publicId = publicId.replace(/\.[a-zA-Z0-9]+$/, '');

    return publicId || null;
  } catch (err) {
    return null;
  }
}

function getCloudinaryResourceType(urlOrId) {
  if (!urlOrId || typeof urlOrId !== 'string') return 'auto';
  const publicId = extractCloudinaryPublicId(urlOrId);
  if (!publicId) return 'auto';

  const extMatch = publicId.match(/\.(pdf|docx?|txt|xls|xlsx|pptx?)$/i);
  if (extMatch) return 'raw';
  if (/\/raw\/upload\//.test(urlOrId)) return 'raw';
  return 'auto';
}

module.exports = {
  extractCloudinaryPublicId,
  getCloudinaryResourceType,
  validDocExtensions,
};

// Normalize attachment inputs into objects { fileUrl, publicId }
function normalizeAttachment(input) {
  if (!input) return null;
  if (typeof input === 'string') {
    const trimmed = input.trim();
    // If it looks like a URL, treat as fileUrl
    if (/^https?:\/\//i.test(trimmed) || /^\/\//.test(trimmed)) {
      return { fileUrl: trimmed, publicId: extractCloudinaryPublicId(trimmed) };
    }
    // Otherwise treat as a bare publicId
    return { publicId: trimmed };
  }
  if (typeof input === 'object') {
    const fileUrl = input.fileUrl || input.url || input.path || null;
    const publicId = input.publicId || input.public_id || (fileUrl ? extractCloudinaryPublicId(fileUrl) : null) || null;
    return { fileUrl: fileUrl || null, publicId: publicId || null };
  }
  return null;
}

function normalizeAttachmentsArray(arr) {
  if (!arr) return [];
  if (!Array.isArray(arr)) arr = [arr];
  return arr.map(a => normalizeAttachment(a)).filter(Boolean);
}

module.exports.normalizeAttachment = normalizeAttachment;
module.exports.normalizeAttachmentsArray = normalizeAttachmentsArray;

const cloudinary = require('./cloudinary');

// Try to resolve a secure fileUrl for a given attachment object based on its Cloudinary publicId
async function resolveAttachmentRemote(att) {
  if (!att) return att;
  const fileUrl = att.fileUrl || att.url || att.path || null;
  let publicId = att.publicId || att.public_id || (fileUrl ? extractCloudinaryPublicId(fileUrl) : null) || null;
  if (!publicId) return att;
  att.publicId = publicId;

  const shouldResolve = !fileUrl || !fileUrl.includes('cloudinary.com') ||
    (typeof fileUrl === 'string' && fileUrl.toLowerCase().endsWith('.pdf') && fileUrl.includes('/image/upload/'));

  if (!shouldResolve && fileUrl) {
    return att;
  }

  try {
    let res = null;
    // Prefer 'auto' so Cloudinary determines the resource type; fallback to
    // raw/image if needed. This increases chances of finding the stored asset
    // without guessing a wrong resource_type that leads to 404s.
    try { res = await cloudinary.api.resource(publicId, { resource_type: 'auto' }); } catch(e) { res = null; }
    if (!res) {
      try { res = await cloudinary.api.resource(publicId, { resource_type: 'raw' }); } catch(e) { res = null; }
    }
    if (!res) {
      try { res = await cloudinary.api.resource(publicId, { resource_type: 'image' }); } catch(e) { res = null; }
    }
    if (res && (res.secure_url || res.url)) {
      att.fileUrl = res.secure_url || res.url;
    }
  } catch (err) {
    // don't fail the request; leave attachment as-is
    console.error('Failed to resolve remote attachment for', publicId, err && err.message);
  }
  return att;
}

module.exports.resolveAttachmentRemote = resolveAttachmentRemote;
