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


// Get all users (with optional filtering)
exports.getAllUsers = async (req, res) => {
    try {
        // Basic security - don't return passwords
        const users = await User.find().select('-password -trustedDevices');

        res.status(200).json({
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get single user by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -trustedDevices');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Get user error:', error);

        // Handle invalid ObjectId format
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        res.status(500).json({ error: 'Server error' });
    }
};

// Get all users (with optional filtering)
exports.getAllUsers = async (req, res) => {
    try {
        // Basic security - don't return passwords
        const users = await User.find().select('-password -trustedDevices');

        res.status(200).json({
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get single user by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -trustedDevices');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Get user error:', error);

        // Handle invalid ObjectId format
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        res.status(500).json({ error: 'Server error' });
    }
};