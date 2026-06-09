const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const validate = require('../middleware/validate');
const audit = require('../middleware/audit');
const userController = require('../controllers/userController');

router.get('/', auth, roles(['superadmin','principal']), userController.listUsers);
router.post('/', auth, roles(['superadmin','principal']), [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('role').notEmpty()
], validate, audit('create_user'), userController.createUser);
router.get('/me', auth, async (req, res) => {
  const User = require('../models/User');
  const user = await User.findById(req.user.id).select('-password');
  res.json({ user });
});
router.get('/:id', auth, roles(['superadmin','principal']), param('id').isMongoId(), validate, userController.getUser);
router.put('/:id', auth, roles(['superadmin','principal']), validate, audit('update_user'), userController.updateUser);
router.delete('/:id', auth, roles(['superadmin','principal']), param('id').isMongoId(), validate, audit('delete_user'), userController.deleteUser);

module.exports = router;
