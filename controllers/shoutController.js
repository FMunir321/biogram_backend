const Shout = require('../models/Shout');
const fs = require('fs');
const path = require('path');

exports.createShout = async (req, res) => {
    try {
        const { isMedia } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        const fileUrl = `/uploads/shouts/${isMedia ? 'videos' : 'images'}/${file.filename}`;

        const shout = new Shout({
            userId: req.user.id,
            isMedia: isMedia === 'true',
            imageUrl: isMedia ? undefined : fileUrl,
            videoUrl: isMedia ? fileUrl : undefined,
        });

        await shout.save();
        res.status(201).json({ message: 'Shout created successfully', shout });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
// Get all shouts for the authenticated user
exports.getMyShouts = async (req, res) => {
    try {
        const userId = req.user.id;

        const shouts = await Shout.find({ userId }).sort({ createdAt: -1 });

        res.status(200).json({ shouts });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch shouts' });
    }
};
// Delete a shout by ID
exports.deleteShout = async (req, res) => {
    try {
        const userId = req.user.id;
        const shoutId = req.params.id;

        const shout = await Shout.findOne({ _id: shoutId, userId });

        if (!shout) {
            return res.status(404).json({ error: 'Shout not found or unauthorized' });
        }

        // Delete the associated media file
        const mediaPath = path.join(
            __dirname,
            '..',
            shout.isMedia ? shout.videoUrl : shout.imageUrl
        );

        if (fs.existsSync(mediaPath)) {
            fs.unlinkSync(mediaPath);
        }

        // Delete the shout from the DB
        await Shout.deleteOne({ _id: shoutId });

        res.status(200).json({ message: 'Shout deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete shout' });
    }
};