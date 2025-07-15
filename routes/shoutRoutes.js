const express = require('express');
const router = express.Router();
const shoutController = require('../controllers/shoutController');
const uploadShoutMedia = require('../middleware/uploadShoutMedia');
const auth = require('../middleware/authMiddleware');

router.post('/create', auth, uploadShoutMedia, shoutController.createShout);

module.exports = router;
