const express = require('express');
const router = express.Router();
const controller = require('../controllers/socialLinkController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, controller.createSocialLink);
router.delete('/:id', auth, controller.deleteSocialLink);
router.get('/:userId', auth, controller.getUserSocialLinks);
router.put('/:id', auth, controller.updateSocialLink);


module.exports = router;