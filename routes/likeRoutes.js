const express = require('express');
const router = express.Router();
const likeController = require('../controllers/likeController');
const auth = require('../middleware/authMiddleware');

// Like/unlike a profile
router.post('/:userId', auth, likeController.toggleProfileLike)
router.get('/:userId/count', likeController.getProfileLikes);

module.exports = router;