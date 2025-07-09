const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/authMiddleware');
const { uploadProfileImage } = require('../middleware/upload');

router.get('/', auth, userController.getAllUsers);
router.get('/:id', auth, userController.getUserById)
router.patch('/profile-image', auth, uploadProfileImage, userController.uploadProfileImage);
router.patch('/visibility', auth, userController.updateVisibilitySetting);
router.patch('/bio', auth, userController.updateBio);

module.exports = router;