const Thumbnail = require('../models/Thumbnail');
const fs = require('fs');
const path = require('path');

// Create thumbnail
exports.createThumbnail = async (req, res) => {
    try {
        const { type, title, url, thumbnailImage, image, background, feature } = req.body;



        // Validate required fields
        if (!type || !title || !url) {
            return res.status(400).json({ 
                error: 'Title, URL, and Thumbnail Type are required.' 
            });
        }

        const thumbnail = new Thumbnail({
            user: req.user.id,
            type,
            title,
            url,
            thumbnailImage: thumbnailImage || null,
            image: image || null,
            background: background || '#7ecfa7', // Default background color
            feature: feature || false // Default to false for user-created thumbnails
        });

        await thumbnail.save();
        res.status(201).json(thumbnail);
    } catch (error) {
        console.error('Error creating thumbnail:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get thumbnails with visibility rules
exports.getThumbnails = async (req, res) => {
    
    try {
        const userId = req.user.id;
        const targetUserId = req.params.userId;

        let thumbnails;
        if (userId === targetUserId) {
            // Owner sees all thumbnails
            thumbnails = await Thumbnail.find({ user: targetUserId });
        } else {
            // Others see only non-featured thumbnails
            thumbnails = await Thumbnail.find({
                user: targetUserId,
                feature: false
            });
        }

        res.status(200).json(thumbnails);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Get current user's thumbnails
exports.getMyThumbnails = async (req, res) => {
    try {
        const thumbnails = await Thumbnail.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(thumbnails);
    } catch (error) {
        console.error('Error fetching thumbnails:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update thumbnail
exports.updateThumbnail = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const thumbnail = await Thumbnail.findOneAndUpdate(
            { _id: id, user: req.user.id },
            updates,
            { new: true, runValidators: true }
        );

        if (!thumbnail) {
            return res.status(404).json({ error: 'Thumbnail not found' });
        }

        res.status(200).json(thumbnail);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Delete thumbnail
exports.deleteThumbnail = async (req, res) => {
    try {
        const thumbnail = await Thumbnail.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!thumbnail) {
            return res.status(404).json({ error: 'Thumbnail not found' });
        }

        // Delete associated images
        const deleteImage = (imagePath) => {
            if (imagePath) {
                const fullPath = path.join(__dirname, '..', imagePath);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            }
        };

        if (thumbnail.type === 'small') {
            deleteImage(thumbnail.thumbnailImage);
        } else {
            deleteImage(thumbnail.image);
            // Background might be color or image
            if (thumbnail.background.startsWith('/uploads')) {
                deleteImage(thumbnail.background);
            }
        }

        res.status(200).json({ message: 'Thumbnail deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Upload thumbnail image
exports.uploadImage = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const imagePath = `/uploads/thumbnails/${req.file.filename}`;
    res.status(200).json({ imagePath });
};