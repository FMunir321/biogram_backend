// filepath: e:\react\biogram\backend\controllers\socialLinkController.js
const SocialLink = require('../models/SocialLink');

// POST /social-links
exports.createSocialLink = async (req, res) => {
  try {
    const { userId, platform, url } = req.body;
    const socialLink = new SocialLink({ userId, platform, url });
    await socialLink.validate(); // To catch validation errors
    const saved = await socialLink.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PUT /social-links/:id
exports.updateSocialLink = async (req, res) => {
  console.log('Update social link request:', req.body);
  try {
    const { id } = req.params;
    const userId = req.user.id; // Extracted from JWT token
    const { platform, url } = req.body;

    const link = await SocialLink.findById(id);
    if (!link) return res.status(404).json({ error: 'Link not found' });

    // Authorization check
    if (link.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Apply updates
    if (platform) link.platform = platform;
    if (url) link.url = url;

    await link.validate(); // Optional: to catch validation issues early
    const updatedLink = await link.save();

    res.status(200).json(updatedLink);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE /social-links/:id
exports.deleteSocialLink = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // Extracted from token

    const link = await SocialLink.findById(id);
    if (!link) return res.status(404).json({ error: 'Link not found' });

    if (link.userId.toString() !== userId)
      return res.status(403).json({ error: 'Forbidden' });

    await link.deleteOne();
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /social-links/:userId
exports.getUserSocialLinks = async (req, res) => {
  try {
    const { userId } = req.params;
    const links = await SocialLink.find({ userId });
    res.status(200).json(links);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};