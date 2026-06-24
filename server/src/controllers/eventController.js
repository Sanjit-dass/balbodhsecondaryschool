const Event = require('../models/Event');
const { normalizeAttachmentsArray, resolveAttachmentRemote } = require('../utils/cloudinaryHelpers');

async function createEvent(req, res) {
  try {
    let data = { ...req.body };
    console.log('Incoming Event Data (raw):', req.body);
    if (data.photos) data.photos = normalizeAttachmentsArray(data.photos);
    if (data.coverPhoto) data.coverPhoto = (Array.isArray(data.coverPhoto) ? data.coverPhoto[0] : data.coverPhoto);
    // Resolve remote attachments to include fileUrl when only publicId is present
    if (data.photos && data.photos.length) {
      data.photos = await Promise.all(data.photos.map(a => resolveAttachmentRemote(a)));
      // normalize to { url, caption, publicId } and filter invalid
      data.photos = data.photos.map(att => ({ url: att.fileUrl || att.url || att.path || null, caption: att.caption || att.originalName || '', publicId: att.publicId || att.public_id || null })).filter(p => p && p.url);
    } else {
      data.photos = [];
    }
    if (data.coverPhoto) {
      const resolved = await resolveAttachmentRemote(data.coverPhoto);
      const cpUrl = resolved.fileUrl || resolved.url || resolved.path || null;
      if (cpUrl) data.coverPhoto = { url: cpUrl, caption: resolved.caption || resolved.originalName || '', publicId: resolved.publicId || resolved.public_id || null };
      else data.coverPhoto = null;
    }
    console.log('Incoming Event Data (normalized):', { title: data.title, eventDate: data.eventDate, photos: data.photos, coverPhoto: data.coverPhoto });
    data.createdBy = req.user?.id || req.user?._id;
    if (data.status === 'published' && !data.publishedAt) data.publishedAt = new Date();
    if (data.eventDate) data.eventDate = new Date(data.eventDate);
    const ev = new Event(data);
    await ev.save();
    res.json(ev);
  } catch (err) {
    console.error(err);
    const payload = { message: err.message || 'Server error' };
    if (process.env.NODE_ENV !== 'production') payload.stack = err.stack;
    res.status(500).json(payload);
  }
}

async function listPublicEvents(req, res) {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const filter = { status: 'published' };
    if (q) filter.title = new RegExp(q, 'i');
    const total = await Event.countDocuments(filter);
    const events = await Event.find(filter)
      .sort({ eventDate: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ events, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    const payload = { message: err.message || 'Server error' };
    if (process.env.NODE_ENV !== 'production') payload.stack = err.stack;
    res.status(500).json(payload);
  }
}

async function listEventsAdmin(req, res) {
  try {
    const { q, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (q) filter.title = new RegExp(q, 'i');
    const total = await Event.countDocuments(filter);
    const events = await Event.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ events, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    const payload = { message: err.message || 'Server error' };
    if (process.env.NODE_ENV !== 'production') payload.stack = err.stack;
    res.status(500).json(payload);
  }
}

async function getEvent(req, res) {
  try {
    const ev = await Event.findById(req.params.id);
    if (!ev) return res.status(404).json({ message: 'Event not found' });
    res.json(ev);
  } catch (err) {
    console.error(err);
    const payload = { message: err.message || 'Server error' };
    if (process.env.NODE_ENV !== 'production') payload.stack = err.stack;
    res.status(500).json(payload);
  }
}

async function updateEvent(req, res) {
  try {
    const data = { ...req.body };
    console.log('Update Event incoming (raw):', req.body);
    if (data.photos) data.photos = normalizeAttachmentsArray(data.photos);
    if (data.coverPhoto) data.coverPhoto = (Array.isArray(data.coverPhoto) ? data.coverPhoto[0] : data.coverPhoto);
    if (data.photos && data.photos.length) {
      data.photos = await Promise.all(data.photos.map(a => resolveAttachmentRemote(a)));
      data.photos = data.photos.map(att => ({ url: att.fileUrl || att.url || att.path || null, caption: att.caption || att.originalName || '', publicId: att.publicId || att.public_id || null })).filter(p => p && p.url);
    } else {
      data.photos = [];
    }
    if (data.coverPhoto) {
      const resolved = await resolveAttachmentRemote(data.coverPhoto);
      const cpUrl = resolved.fileUrl || resolved.url || resolved.path || null;
      if (cpUrl) data.coverPhoto = { url: cpUrl, caption: resolved.caption || resolved.originalName || '', publicId: resolved.publicId || resolved.public_id || null };
      else data.coverPhoto = null;
    }
    console.log('Update Event normalized:', { photos: data.photos, coverPhoto: data.coverPhoto });
    if (data.eventDate) data.eventDate = new Date(data.eventDate);
    const ev = await Event.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!ev) return res.status(404).json({ message: 'Event not found' });
    res.json(ev);
  } catch (err) {
    console.error(err);
    const payload = { message: err.message || 'Server error' };
    if (process.env.NODE_ENV !== 'production') payload.stack = err.stack;
    res.status(500).json(payload);
  }
}

async function deleteEvent(req, res) {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { createEvent, listPublicEvents, listEventsAdmin, getEvent, updateEvent, deleteEvent };
