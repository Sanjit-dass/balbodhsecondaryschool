const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validator = require('validator');
const validate = require('../middleware/validate');
const audit = require('../middleware/audit');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const authController = require('../controllers/authController');

const publicRegisterRoles = ['student', 'parent'];
const allRoles = ['superadmin','admin','principal','teacher','accountant','examcontroller','student','parent'];

router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
  body('role').optional().isIn(allRoles)
], validate, audit('login'), authController.login);

router.post('/register', [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(publicRegisterRoles)
], validate, authController.register);

router.post('/create-user', auth, roles(['superadmin','admin','principal']), [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').optional().isIn(allRoles)
], validate, audit('create_user'), authController.createUser);

router.post('/refresh', [
  body('refreshToken').notEmpty()
], validate, authController.refresh);

router.put('/update-profile', auth, [
  body('email').optional().isEmail(),
  body('name').optional().isString().trim().notEmpty(),
  body('currentPassword').optional().isLength({ min: 6 }),
  body('password').optional().isLength({ min: 6 }),
  body('profile.phone').optional().isString().trim(),
  body('profile.address').optional().isString().trim(),
  body('profile.department').optional().isString().trim(),
  body('profile.designation').optional().isString().trim(),
  body('profile.photoUrl').optional({ nullable: true }).custom((value) => {
    if (value === null || value === '') return true;
    return validator.isURL(String(value));
  }).withMessage('Profile photo must be a valid URL if provided.')
], validate, audit('update_profile'), authController.updateProfile);

router.post('/logout', auth, authController.logout);
router.get('/me', auth, authController.me);

router.post('/forgot', [
  body('email').isEmail().withMessage('Please provide a valid email address.')
], validate, authController.forgotPassword);

router.get('/reset/:token', authController.validateResetToken);

router.post('/reset/:token', [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
], validate, authController.resetPassword);

module.exports = router;
