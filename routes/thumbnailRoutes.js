const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const thumbnailController = require('../controllers/thumbnailController');
const upload = require('../middleware/uploadThumbnail');

// Create thumbnail
router.post('/', auth, thumbnailController.createThumbnail);

// Get user's thumbnails
router.get('/user/:userId', auth, thumbnailController.getThumbnails);

// Update thumbnail
router.put('/:id', auth, thumbnailController.updateThumbnail);

// Delete thumbnail
router.delete('/:id', auth, thumbnailController.deleteThumbnail);

// Upload image
router.post('/upload', auth, upload.single('image'), thumbnailController.uploadImage);

module.exports = router;