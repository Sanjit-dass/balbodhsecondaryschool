const Timetable = require('../models/Timetable');

async function createTimetable(req, res) {
  try {
    const timetable = new Timetable({ ...req.body, createdBy: req.user.id });
    await timetable.save();
    res.status(201).json(timetable);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function listTimetables(req, res) {
  try {
    const { classId, academicYear, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (classId) filter.class = classId;
    if (academicYear) filter.academicYear = academicYear;
    const total = await Timetable.countDocuments(filter);
    const timetables = await Timetable.find(filter)
      .populate('class', 'name numeric academicYear')
      .populate('entries.subject', 'name code')
      .populate('entries.teacher', 'fullName email')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ timetables, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getTimetable(req, res) {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate('class', 'name numeric academicYear')
      .populate('entries.subject', 'name code')
      .populate('entries.teacher', 'fullName email');
    if (!timetable) return res.status(404).json({ message: 'Timetable not found' });
    res.json(timetable);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function updateTimetable(req, res) {
  try {
    const timetable = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!timetable) return res.status(404).json({ message: 'Timetable not found' });
    res.json(timetable);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteTimetable(req, res) {
  try {
    await Timetable.findByIdAndDelete(req.params.id);
    res.json({ message: 'Timetable deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { createTimetable, listTimetables, getTimetable, updateTimetable, deleteTimetable };
