const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');

// Public events are stored as notices with category 'Events'.
router.get('/', noticeController.listPublicEvents);
router.get('/public', noticeController.listPublicEvents);

module.exports = router;
