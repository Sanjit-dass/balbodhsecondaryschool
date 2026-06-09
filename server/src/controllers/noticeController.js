const Notice = require('../models/Notice');
const { extractCloudinaryPublicId, getCloudinaryResourceType } = require('../utils/cloudinaryHelpers');
const { createNotificationFromData } = require('../utils/notificationUtils');

const sseClients = new Set();

function sendSseEvent(notice) {
  const payload = `event: notice\ndata: ${JSON.stringify(notice)}\n\n`;
  sseClients.forEach((client) => {
    client.write(payload);
  });
}

async function createNotice(req, res) {
  try {
    const { normalizeAttachmentsArray } = require('../utils/cloudinaryHelpers');
    let attachments = normalizeAttachmentsArray(req.body.attachments);
    const { resolveAttachmentRemote } = require('../utils/cloudinaryHelpers');
    // resolve missing fileUrl by querying Cloudinary when only publicId is provided
    attachments = await Promise.all(attachments.map(a => resolveAttachmentRemote(a)));
    const noticeData = {
      ...req.body,
      attachments,
      createdBy: req.user.id
    };
    // Only set publishedAt automatically if notice is being published
    if (req.body.status === 'published') {
      noticeData.publishedAt = req.body.publishedAt || new Date();
    } else if (req.body.publishedAt) {
      noticeData.publishedAt = req.body.publishedAt;
    }
    const notice = new Notice(noticeData);
    console.log('SAVING NOTICE, ATTACHMENTS:', req.body.attachments || req.body.attachment || null);
    await notice.save();
    if (notice.status === 'published') {
      await createNotificationFromData({
        title: 'New Notice Published',
        message: `A new notice has been published: ${notice.title}`,
        audience: notice.audience || 'all',
        classId: notice.targetClassId || notice.classId || null,
        priority: notice.priority || 'Medium',
        status: 'sent'
      }, req.user.id || req.user._id);
    }
    sendSseEvent(notice);
    res.json(notice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function listNotices(req, res) {
  try {
    const { q, audience, category, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (q) filter.title = new RegExp(q, 'i');
    if (audience) filter.audience = audience;
    if (category) filter.category = category;
    filter.publishedAt = { $lte: new Date() };
    const total = await Notice.countDocuments(filter);
    const notices = await Notice.find(filter)
      .sort({ publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ notices, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function listPublic(req, res) {
  try {
    const { q, category, page = 1, limit = 20 } = req.query;
    const filter = {
      publishedAt: { $lte: new Date() },
      audience: { $in: ['all','students','teachers','parents','public'] }
    };
    if (q) filter.title = new RegExp(q, 'i');
    if (category) filter.category = category;
    const total = await Notice.countDocuments(filter);
    const notices = await Notice.find(filter)
      .sort({ publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ notices, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function listPublicEvents(req, res) {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const filter = {
      publishedAt: { $lte: new Date() },
      audience: { $in: ['all','students','teachers','parents','public'] },
      category: 'Events'
    };
    if (q) filter.title = new RegExp(q, 'i');
    const total = await Notice.countDocuments(filter);
    const notices = await Notice.find(filter)
      .sort({ publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ notices, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getNotice(req, res) {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ message: 'Notice not found' });
    res.json(notice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function updateNotice(req, res) {
  try {
    const { normalizeAttachmentsArray } = require('../utils/cloudinaryHelpers');
    if (req.body.attachments) {
      req.body.attachments = normalizeAttachmentsArray(req.body.attachments);
      const { resolveAttachmentRemote } = require('../utils/cloudinaryHelpers');
      req.body.attachments = await Promise.all(req.body.attachments.map(a => resolveAttachmentRemote(a)));
    }
    const notice = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!notice) return res.status(404).json({ message: 'Notice not found' });
    res.json(notice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteNotice(req, res) {
  try {
    const notice = await Notice.findById(req.params.id).lean();
    if (notice && notice.attachments && notice.attachments.length) {
      const cloudinary = require('../utils/cloudinary');
      for (const att of notice.attachments) {
        let pub = null;
        let resourceType = 'auto';
        if (!att) continue;
        if (typeof att === 'string') {
          pub = extractCloudinaryPublicId(att);
          resourceType = getCloudinaryResourceType(att);
        } else {
          pub = att.publicId || att.public_id || (att.fileUrl ? extractCloudinaryPublicId(att.fileUrl) : null);
          resourceType = att.fileUrl ? getCloudinaryResourceType(att.fileUrl) : 'auto';
        }
        if (pub) {
          try { await cloudinary.uploader.destroy(pub, { resource_type: resourceType }); } catch (e) { console.error('Failed to delete notice asset', e); }
        }
      }
    }
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notice deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

function noticeStream(req, res) {
  res.writeHead(200, {
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache'
  });
  res.write('retry: 10000\n\n');
  sseClients.add(res);
  req.on('close', () => {
    sseClients.delete(res);
  });
}

module.exports = { createNotice, listNotices, listPublic, listPublicEvents, getNotice, updateNotice, deleteNotice, noticeStream };
