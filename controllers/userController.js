const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const ProfileLike = require('../models/ProfileLike');


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

// Update user bio
exports.updateBio = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bio } = req.body;

        // Validate input
        if (typeof bio !== 'string' || bio.length > 500) {
            return res.status(400).json({
                error: 'Bio must be a string and less than 500 characters'
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { bio },
            { new: true, runValidators: true }
        ).select('bio');

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Update bio error:', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }

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
            .select('-password -trustedDevices -__v')
            .populate({
                path: 'likeCount', // Populates the virtual field
                options: { virtuals: true }
            });
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
        let isLiked = false;
        if (req.user) {
            isLiked = await user.hasLiked(req.user.id); // Uses the schema method
        }
        publicUser.likeCount = user.likeCount || 0; // Fallback to 0 if undefined
        publicUser.isLiked = isLiked;

        res.status(200).json(publicUser);
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Both current and new password are required' });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ error: 'New password must be different from current password' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// exports.deleteAccount = async (req, res) => {
//     try {
//         const userId = req.user.id;
//         const user = await User.findById(userId);

//         if (!user) {
//             return res.status(404).json({ error: 'User not found' });
//         }

//         if (user.deletionScheduled) {
//             return res.status(400).json({ error: 'Deletion already scheduled' });
//         }

//         // Schedule deletion
//         user.deletionScheduled = true;
//         user.deletionScheduledAt = new Date();
//         await user.save();

//         res.status(200).json({
//             message: 'Account scheduled for deletion. You have 15 days to recover.',
//             deletionDate: user.deletionScheduledAt
//         });
//     } catch (error) {
//         res.status(500).json({ error: 'Server error' });
//     }
// };
exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Directly delete the user
        await User.findByIdAndDelete(userId);

        res.status(200).json({ message: 'Account permanently deleted.' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};


exports.recoverAccount = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user || !user.deletionScheduled) {
            return res.status(400).json({ error: 'No scheduled deletion found for this account.' });
        }

        // Optional: verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        const now = new Date();
        const deadline = new Date(user.deletionScheduledAt);
        deadline.setDate(deadline.getDate() + 15);

        if (now > deadline) {
            return res.status(400).json({ error: 'Account already permanently deleted.' });
        }

        // Recover account
        user.deletionScheduled = false;
        user.deletionScheduledAt = null;
        await user.save();

        res.status(200).json({ message: 'Account successfully recovered. You can now log in.' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};
// Add this to getUserProfile or searchUsers functions
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        // Get like count
        const likeCount = await ProfileLike.countDocuments({ likedUser: user._id });

        // Check if current user liked this profile
        let isLiked = false;
        if (req.user) {
            isLiked = !!(await ProfileLike.findOne({
                liker: req.user.id,
                likedUser: user._id
            }));
        }

        res.json({
            ...user.toObject(),
            likeCount,
            isLiked
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};