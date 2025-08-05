const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const thumbnailController = require('../controllers/thumbnailController');
const upload = require('../middleware/uploadThumbnail');


router.post('/', auth, thumbnailController.createThumbnail);
router.get('/user/:userId', auth, thumbnailController.getThumbnails);
router.get('/my-thumbnails', auth, thumbnailController.getMyThumbnails);
router.put('/:id', auth, thumbnailController.updateThumbnail);
router.delete('/:id', auth, thumbnailController.deleteThumbnail);
router.post('/upload', auth, upload.single('image'), thumbnailController.uploadImage);

module.exports = router;