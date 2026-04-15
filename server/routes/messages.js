const express = require('express');
const router = express.Router();
const { getMessages, postMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// GET /messages/:bookingId — fetch chat history
router.get('/:bookingId', protect, getMessages);

// POST /messages — send a message (HTTP polling mode)
router.post('/', protect, postMessage);

module.exports = router;
