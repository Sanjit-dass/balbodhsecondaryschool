const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const validate = require('../middleware/validate');
const audit = require('../middleware/audit');
const quizController = require('../controllers/quizController');

router.post('/', auth, roles(['superadmin','principal','teacher']), [
  body('title').notEmpty(),
  body('questions').isArray({ min: 1 })
], validate, audit('create_quiz'), quizController.createQuiz);
router.get('/', auth, quizController.listQuizzes);
router.get('/:id', auth, param('id').isMongoId(), validate, quizController.getQuiz);
router.put('/:id', auth, roles(['superadmin','principal','teacher']), param('id').isMongoId(), validate, audit('update_quiz'), quizController.updateQuiz);
router.delete('/:id', auth, roles(['superadmin','principal']), param('id').isMongoId(), validate, audit('delete_quiz'), quizController.deleteQuiz);

module.exports = router;
