const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const Shout = require('../models/Shout');
const Gallery = require('../models/Gallery');
const ContactInfo = require('../models/ContactInfo');
const Merch = require('../models/Merch');
const SocialLink = require('../models/SocialLink');
const Thumbnail = require('../models/Thumbnail');



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

// Get single user by ID (with profile template applied)
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -trustedDevices -__v');

        if (!user) return res.status(404).json({ error: 'User not found' });

        const isOwner = req.user && req.user.id.toString() === req.params.id;
        const publicUser = { ...user.toObject() };

        // 🔗 Social Links: Always return regardless of user type or visibility settings
        publicUser.socialLinks = await SocialLink.find({ userId: user._id });

        if (isOwner) {
            // 🔓 Owner: include all private data unconditionally
            publicUser.shouts = await Shout.find({ userId: user._id });
            publicUser.gallery = await Gallery.find({ user: user._id });
            publicUser.contactInfo = await ContactInfo.findOne({ user: user._id });
            publicUser.merch = await Merch.find({ user: user._id });
            publicUser.featuredLinks = await Thumbnail.find({ user: user._id });
        } else {
            // 🔒 Not owner: only include if allowed by visibilitySettings

            // Shouts
            if (user.visibilitySettings?.shouts) {
                publicUser.shouts = await Shout.find({ userId: user._id });
            } else {
                publicUser.shouts = { message: "Shouts are not publicly visible" };
            }

            // Gallery
            if (user.visibilitySettings?.gallery) {
                publicUser.gallery = await Gallery.find({ user: user._id });
            } else {
                publicUser.gallery = { message: "Gallery is not publicly visible" };
            }

            // Contact Info
            if (user.visibilitySettings?.contactInfo) {
                publicUser.contactInfo = await ContactInfo.findOne({ user: user._id });
            } else {
                publicUser.contactInfo = { message: "Contact information is not publicly visible" };
                publicUser.email = undefined;
                publicUser.phoneNumber = undefined;
            }

            // Merch
            if (user.visibilitySettings?.merch) {
                publicUser.merch = await Merch.find({ user: user._id });
            } else {
                publicUser.merch = { message: "Merchandise is not publicly visible" };
            }

            // Featured Links (Thumbnails)
            if (user.visibilitySettings?.featuredLinks) {
                publicUser.featuredLinks = await Thumbnail.find({ user: user._id });
            } else {
                publicUser.featuredLinks = { message: "Featured links are not publicly visible" };
            }

            // Bio
            if (!user.visibilitySettings?.bio) {
                publicUser.bio = { message: "Bio is not publicly visible" };
            }
        }

        res.status(200).json(publicUser);
    } catch (error) {
        console.error('Get user by ID error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

// Update user's profile template
exports.updateProfileTemplate = async (req, res) => {
    try {
        const { profileTemplate } = req.body;

        // Validate template value
        const validTemplates = ['temp1', 'temp2', 'temp3', 'temp4', 'temp5', 'temp6'];
        if (!validTemplates.includes(profileTemplate)) {
            return res.status(400).json({ 
                error: 'Invalid template. Valid options: ' + validTemplates.join(', ') 
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { profileTemplate },
            { new: true, runValidators: true }
        ).select('profileTemplate');

        res.status(200).json({
            message: 'Profile template updated successfully',
            profileTemplate: updatedUser.profileTemplate
        });
    } catch (error) {
        console.error('Update profile template error:', error);
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