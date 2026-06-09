const Notification = require('../models/Notification');
const Student = require('../models/Student');

const ADMIN_ROLES = ['superadmin','admin','principal','accountant','examcontroller'];

async function resolveUserClassId(user) {
  if (!user || !user.role) return null;
  if (user.role === 'student') {
    const student = await Student.findOne({ user: user.id || user._id }).lean();
    if (student) return String(student.classId || student.class || '');
  }
  if (user.role === 'parent') {
    const student = await Student.findOne({ email: user.email }).lean();
    if (student) return String(student.classId || student.class || '');
  }
  return null;
}

function notificationMatchesUser(notification, user, userClassId) {
  if (!notification) return false;
  if (ADMIN_ROLES.includes(user.role)) return true;
  if (!notification.audience || notification.audience === 'all') return true;
  if (notification.audience === 'students' && user.role === 'student') return true;
  if (notification.audience === 'teachers' && user.role === 'teacher') return true;
  if (notification.audience === 'parents' && user.role === 'parent') return true;
  if (notification.audience === 'specificClass' && notification.classId && userClassId) {
    return String(notification.classId) === String(userClassId);
  }
  return false;
}

function normalizeNotificationPayload(body, createdBy) {
  const audience = ['all','students','teachers','parents','specificClass'].includes(body.audience) ? body.audience : 'all';
  const status = body.status === 'sent' ? 'sent' : 'draft';
  const priority = ['Low','Medium','High','Urgent'].includes(body.priority) ? body.priority : 'Medium';
  const message = body.message || body.body || '';

  return {
    title: String(body.title || '').trim(),
    message: message.trim(),
    body: message.trim(),
    audience,
    classId: audience === 'specificClass' ? (body.classId || null) : null,
    priority,
    status,
    createdBy,
    createdAt: body.createdAt || new Date(),
    readBy: Array.isArray(body.readBy) ? body.readBy : []
  };
}

function decorateNotification(notification, userId) {
  if (!notification) return notification;
  const raw = notification.toObject ? notification.toObject() : { ...notification };
  const readBy = Array.isArray(raw.readBy) ? raw.readBy : [];
  return {
    ...raw,
    message: raw.message || raw.body || '',
    body: raw.body || raw.message || '',
    isRead: readBy.some((id) => String(id) === String(userId))
  };
}

async function filterNotificationsForUser(list, user) {
  if (!Array.isArray(list)) return [];
  if (ADMIN_ROLES.includes(user.role)) {
    return list.map((item) => decorateNotification(item, user.id || user._id));
  }
  const userClassId = await resolveUserClassId(user);
  return list
    .filter((item) => item.status === 'sent' && notificationMatchesUser(item, user, userClassId))
    .map((item) => decorateNotification(item, user.id || user._id));
}

async function markNotificationRead(notificationId, userId) {
  return Notification.findByIdAndUpdate(notificationId, { $addToSet: { readBy: userId } }, { new: true });
}

async function markRelevantNotificationsRead(user) {
  const list = await Notification.find({ status: 'sent' }).lean();
  const userClassId = await resolveUserClassId(user);
  const relevantIds = list
    .filter((item) => notificationMatchesUser(item, user, userClassId))
    .map((item) => item._id);

  if (!relevantIds.length) return 0;
  const result = await Notification.updateMany(
    { _id: { $in: relevantIds } },
    { $addToSet: { readBy: user.id || user._id } }
  );
  return result.modifiedCount || 0;
}

async function createNotificationFromData(data, createdBy) {
  const payload = normalizeNotificationPayload(data, createdBy);
  const notification = new Notification(payload);
  await notification.save();
  return notification;
}

module.exports = {
  ADMIN_ROLES,
  resolveUserClassId,
  notificationMatchesUser,
  normalizeNotificationPayload,
  decorateNotification,
  filterNotificationsForUser,
  markNotificationRead,
  markRelevantNotificationsRead,
  createNotificationFromData
};
