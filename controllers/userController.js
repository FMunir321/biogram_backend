const User = require('../models/User');
const fs = require('fs');
const path = require('path');

exports.uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete old image if exists
        if (user.profileImage) {
            const oldImagePath = path.join(__dirname, '..', user.profileImage);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        // Update user with new image path
        user.profileImage = `/uploads/profile-images/${req.file.filename}`;
        await user.save();

        res.status(200).json({
            message: 'Profile image uploaded successfully',
            profileImage: user.profileImage
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update individual visibility setting
exports.updateVisibilitySetting = async (req, res) => {
    try {
        const userId = req.user.id;
        const { section, value } = req.body;

        // Validate input
        const validSections = [
            'bio', 'featuredLinks', 'merch',
            'gallery', 'contactInfo', 'shouts'
        ];

        if (!validSections.includes(section)) {
            return res.status(400).json({ error: 'Invalid section specified' });
        }

        const update = {};
        update[`visibilitySettings.${section}`] = value;

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { [`visibilitySettings.${section}`]: value } },
            { new: true }
        ).select('visibilitySettings');

        res.status(200).json(updatedUser.visibilitySettings);
    } catch (error) {
        console.error('Update visibility error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get all users (returning minimal public data)
exports.getAllUsers = async (req, res) => {
    try {
        // Return only public data: id, username, fullName, profileImage
        const users = await User.find().select('_id username fullName profileImage');

        res.status(200).json({
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get single user by ID (with visibility settings applied for non-owners)
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -trustedDevices -__v');

        if (!user) return res.status(404).json({ error: 'User not found' });

        // Check if requester is the profile owner
        const isOwner = req.user && req.user.id === req.params.id;
        const publicUser = { ...user.toObject() };

        // Apply visibility settings for non-owners
        if (!isOwner && user.visibilitySettings) {
            // Hide contact info
            if (!user.visibilitySettings.contactInfo) {
                publicUser.email = undefined;
                publicUser.phoneNumber = undefined;
            }

            // Hide bio if disabled
            if (!user.visibilitySettings.bio) {
                publicUser.bio = undefined;
            }

            // Hide featuredLinks if disabled (will be handled in its controller)
            if (!user.visibilitySettings.featuredLinks) {
                publicUser.featuredLinks = undefined;
            }

            // Hide merch if disabled (will be handled in its controller)
            if (!user.visibilitySettings.merch) {
                publicUser.merch = undefined;
            }

            // Hide gallery if disabled (will be handled in its controller)
            if (!user.visibilitySettings.gallery) {
                publicUser.gallery = undefined;
            }

            // Hide shouts if disabled (will be handled in its controller)
            if (!user.visibilitySettings.shouts) {
                publicUser.shouts = undefined;
            }
        }

        res.status(200).json(publicUser);
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        res.status(500).json({ error: 'Server error' });
    }
};