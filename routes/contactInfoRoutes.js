const express = require('express');
const router = express.Router();
const contactInfoController = require('../controllers/contactInfoController');
const auth = require('../middleware/authMiddleware');

// GET contact info (public access)
router.get('/:id', auth, contactInfoController.getContactInfo);
router.post('/', auth, contactInfoController.createContactInfo);
router.put('/', auth, contactInfoController.updateContactInfo);
router.delete('/:id', auth, contactInfoController.deleteContactInfo);

module.exports = router;