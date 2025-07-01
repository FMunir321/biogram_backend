const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.patch('/profile-image', auth, upload.single('profileImage'), userController.uploadProfileImage);
router.get('/', auth, userController.getAllUsers);
router.get('/:id', auth, userController.getUserById)

module.exports = router;