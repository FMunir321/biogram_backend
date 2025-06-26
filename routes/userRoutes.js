const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Mount all user routes
router.use('/', userController);

module.exports = router;