const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Mount all auth routes
router.use('/', authController);

module.exports = router;