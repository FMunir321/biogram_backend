const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/authMiddleware')

// Public endpoints (no auth required)
router.post('/profile-view/:userId', analyticsController.recordProfileView);
router.post('/link-click/:userId', analyticsController.recordLinkClick);
router.get('/:userId', auth, analyticsController.getAnalytics);

module.exports = router;