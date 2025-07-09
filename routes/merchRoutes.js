const express = require('express');
const router = express.Router();
const merchController = require('../controllers/merchController');
const auth = require('../middleware/authMiddleware');
const { uploadMerchImages } = require('../middleware/upload');


// Merch CRUD routes
router.post('/', auth, uploadMerchImages, merchController.createMerchItem);
router.get('/user/:userId', auth, merchController.getUserMerch);
router.get('/:id', auth, merchController.getMerchItem);
router.put('/:id', auth, uploadMerchImages, merchController.updateMerchItem);
router.delete('/:id', auth, merchController.deleteMerchItem);

module.exports = router;