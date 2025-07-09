const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const auth = require('../middleware/authMiddleware');
const { uploadGalleryImage } = require('../middleware/upload');


router.post('/', auth, uploadGalleryImage, galleryController.addGalleryImage);
router.delete('/:id', auth, galleryController.deleteGalleryImage);
router.get('/:userId', auth, galleryController.getGallery);

module.exports = router;