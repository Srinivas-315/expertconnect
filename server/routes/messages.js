const express = require('express');
const router = express.Router();
const { getMessages } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// GET /messages/:bookingId — fetch chat history
router.get('/:bookingId', protect, getMessages);

module.exports = router;
