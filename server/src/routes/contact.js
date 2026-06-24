const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const contactController = require('../controllers/contactController');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const validate = require('../middleware/validate');

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').optional({ checkFalsy: true }).isString(),
    body('subject').notEmpty().isIn(['admission', 'fees', 'academics', 'facilities', 'other']),
    body('message').notEmpty().withMessage('Message is required'),
  ],
  validate,
  contactController.submitContact
);

router.get(
  '/',
  auth,
  roles(['superadmin', 'principal', 'admin']),
  [
    query('status').optional().isIn(['new', 'read', 'archived']),
    query('subject').optional().isIn(['admission', 'fees', 'academics', 'facilities', 'other']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  contactController.listMessages
);

router.get('/:id', auth, roles(['superadmin', 'principal', 'admin']), param('id').isMongoId(), validate, contactController.getMessage);

router.patch('/:id', auth, roles(['superadmin', 'principal', 'admin']), [
  param('id').isMongoId(),
  body('status').optional().isIn(['new', 'read', 'archived']),
], validate, contactController.updateMessage);

router.delete('/:id', auth, roles(['superadmin', 'principal', 'admin']), param('id').isMongoId(), validate, contactController.deleteMessage);

module.exports = router;
