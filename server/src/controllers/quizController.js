const Quiz = require('../models/Quiz');

async function createQuiz(req, res) {
  try {
    const quiz = new Quiz({ ...req.body, createdBy: req.user.id, publishDate: req.body.publishDate || null });
    await quiz.save();
    res.status(201).json(quiz);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function listQuizzes(req, res) {
  try {
    const { q, classId, isPublished, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (q) filter.title = new RegExp(q, 'i');
    if (classId) filter.class = classId;
    if (isPublished !== undefined) filter.isPublished = isPublished === 'true';
    const total = await Quiz.countDocuments(filter);
    const quizzes = await Quiz.find(filter)
      .populate('class', 'name numeric')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    res.json({ quizzes, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getQuiz(req, res) {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('class', 'name numeric');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json(quiz);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function updateQuiz(req, res) {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.json(quiz);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function deleteQuiz(req, res) {
  try {
    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: 'Quiz deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { createQuiz, listQuizzes, getQuiz, updateQuiz, deleteQuiz };
