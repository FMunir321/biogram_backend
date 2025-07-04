const Gallery = require('../models/Gallery');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// Add new gallery image
exports.addGalleryImage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { caption } = req.body;

        // Validate image exists
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        // Create new gallery item
        const newGalleryItem = new Gallery({
            user: userId,
            imageUrl: req.file.path,
            caption: caption || ''
        });

        await newGalleryItem.save();

        res.status(201).json({
            message: 'Gallery image added successfully',
            galleryItem: newGalleryItem
        });
    } catch (error) {
        console.error('Add gallery image error:', error);

        // Clean up uploaded file if error occurred
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ error: 'Server error' });
    }
};

// Delete gallery image
exports.deleteGalleryImage = async (req, res) => {
    try {
        const galleryId = req.params.id;
        const userId = req.user.id;

        // Find and validate ownership
        const galleryItem = await Gallery.findOneAndDelete({
            _id: galleryId,
            user: userId
        });

        if (!galleryItem) {
            return res.status(404).json({
                error: 'Gallery image not found or access denied'
            });
        }

        // Delete associated image file
        if (galleryItem.imageUrl && fs.existsSync(galleryItem.imageUrl)) {
            fs.unlinkSync(galleryItem.imageUrl);
        }

        res.status(200).json({
            message: 'Gallery image deleted successfully'
        });
    } catch (error) {
        console.error('Delete gallery image error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getGallery = async (req, res) => {
    try {
        const requestedUserId = req.params.userId;
        const requestingUserId = req.user?.id; // Optional chaining for unauthenticated requests

        // Find the requested user
        const requestedUser = await User.findById(requestedUserId)
            .select('visibilitySettings');

        if (!requestedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if requesting user is the owner
        const isOwner = requestingUserId && requestingUserId === requestedUserId;

        // If not owner and gallery is not visible
        if (!isOwner && requestedUser.visibilitySettings?.gallery !== false) {
            return res.status(200).json({
                message: 'Gallery is not publicly visible',
                gallery: []
            });
        }

        // Get gallery items with appropriate filtering
        const galleryQuery = { user: requestedUserId };

        // If not owner, you could add additional filters here
        // For example: .find({ ...galleryQuery, isPublic: true })

        const galleryItems = await Gallery.find(galleryQuery)
            .sort({ createdAt: -1 })
            .select('imageUrl caption createdAt')
            .lean(); // Convert to plain JS objects

        // Normalize image paths
        const normalizedItems = galleryItems.map(item => ({
            ...item,
            imageUrl: item.imageUrl.replace(/\\/g, '/')
        }));

        res.status(200).json({
            isOwner,
            count: normalizedItems.length,
            gallery: normalizedItems
        });

    } catch (error) {
        console.error('Get gallery error:', error);
        res.status(500).json({
            error: 'Server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};