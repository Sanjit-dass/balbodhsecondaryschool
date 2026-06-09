const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const Notification = require('../models/Notification');
const {
  ADMIN_ROLES,
  normalizeNotificationPayload,
  decorateNotification,
  filterNotificationsForUser,
  markNotificationRead,
  markRelevantNotificationsRead,
  createNotificationFromData
} = require('../utils/notificationUtils');

router.post('/', auth, roles(ADMIN_ROLES), async (req, res) => {
  try {
    const notification = await createNotificationFromData(req.body, req.user.id || req.user._id);
    res.json(decorateNotification(notification, req.user.id || req.user._id));
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const list = await Notification.find().sort({ createdAt: -1 }).lean();
    const userId = req.user.id || req.user._id;
    let notifications;

    if (ADMIN_ROLES.includes(req.user.role)) {
      notifications = list.map((item) => decorateNotification(item, userId));
    } else {
      notifications = await filterNotificationsForUser(list, req.user);
    }

    res.json({ notifications });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/latest', auth, async (req, res) => {
  try {
    const list = await Notification.find({ status: 'sent' }).sort({ createdAt: -1 }).limit(10).lean();
    const notifications = await filterNotificationsForUser(list, req.user);
    res.json({ notifications });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/center', auth, async (req, res) => {
  try {
    const list = await Notification.find({ status: 'sent' }).sort({ createdAt: -1 }).lean();
    const notifications = await filterNotificationsForUser(list, req.user);
    res.json({ notifications });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/unread-count', auth, async (req, res) => {
  try {
    const list = await Notification.find({ status: 'sent' }).lean();
    const notifications = await filterNotificationsForUser(list, req.user);
    const count = notifications.filter((item) => !item.isRead).length;
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.put('/:id', auth, roles(ADMIN_ROLES), async (req, res) => {
  try {
    const payload = normalizeNotificationPayload(req.body, req.user.id || req.user._id);
    const notification = await Notification.findByIdAndUpdate(req.params.id, payload, { new: true });
    res.json(decorateNotification(notification, req.user.id || req.user._id));
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.delete('/:id', auth, roles(ADMIN_ROLES), async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await markNotificationRead(req.params.id, req.user.id || req.user._id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(decorateNotification(notification, req.user.id || req.user._id));
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.put('/mark-all-read', auth, async (req, res) => {
  try {
    const updated = await markRelevantNotificationsRead(req.user);
    res.json({ updated });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.post('/:id/send-again', auth, roles(ADMIN_ROLES), async (req, res) => {
  try {
    const original = await Notification.findById(req.params.id).lean();
    if (!original) return res.status(404).json({ message: 'Notification not found' });
    const payload = normalizeNotificationPayload({
      ...original,
      status: 'sent',
      createdAt: new Date(),
      readBy: []
    }, req.user.id || req.user._id);
    delete payload._id;
    const notification = new Notification(payload);
    await notification.save();
    res.json(decorateNotification(notification, req.user.id || req.user._id));
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/export/csv', auth, async (req, res) => {
  try {
    const { Parser } = require('json2csv');
    const list = await Notification.find().sort({ createdAt: -1 }).lean();
    const data = list.map(item => ({
      title: item.title,
      audience: item.audience,
      priority: item.priority,
      status: item.status,
      createdAt: item.createdAt ? item.createdAt.toISOString() : ''
    }));
    const parser = new Parser({ fields: ['title', 'audience', 'priority', 'status', 'createdAt'] });
    res.header('Content-Type', 'text/csv');
    res.attachment('notifications.csv');
    res.send(parser.parse(data));
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
