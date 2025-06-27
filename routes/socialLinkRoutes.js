const express = require('express');
const router = express.Router();
const controller = require('../controllers/socialLinkController');

router.post('/', controller.createSocialLink);
router.delete('/:id', controller.deleteSocialLink);
router.get('/:userId', controller.getUserSocialLinks);

module.exports = router;