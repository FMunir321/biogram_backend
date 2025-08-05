const Merch = require('../models/Merch');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// Create new merch item
exports.createMerchItem = async (req, res) => {
    try {
        const { category, url, title, price } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!category || !url || !title) {
            return res.status(400).json({ error: 'Category, URL, and title are required' });
        }

        // Validate price if provided (allow ranges like "500-1000" or single values)
        if (price && typeof price !== 'string' && typeof price !== 'number') {
            return res.status(400).json({ error: 'Price must be a string or number' });
        }

        // Create new merch item
        const newMerch = new Merch({
            user: userId,
            category,
            url,
            title,
            price: price || null,
            image: req.files['image'] ? req.files['image'][0].path : '',
            productImage: req.files['productImage'] ? req.files['productImage'][0].path : ''
        });

        await newMerch.save();

        res.status(201).json({
            message: 'Merch item created successfully',
            merch: newMerch
        });
    } catch (error) {
        console.error('Create merch error:', error);

        // Clean up uploaded files if error occurred
        if (req.files) {
            Object.values(req.files).forEach(fileArray => {
                fileArray.forEach(file => {
                    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                });
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: 'Server error' });
    }
};

// Get all merch items for a user
exports.getUserMerch = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Check user visibility settings
        const user = await User.findById(userId).select('visibilitySettings');
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Apply visibility for non-owners
        const isOwner = req.user && req.user.id === userId;
        if (!isOwner && user.visibilitySettings && !user.visibilitySettings.merch) {
            return res.status(200).json({ merch: [] });
        }

        // Fetch merch items
        const merchItems = await Merch.find({ user: userId }).sort({ createdAt: -1 });

        res.status(200).json({
            count: merchItems.length,
            merch: merchItems
        });
    } catch (error) {
        console.error('Get merch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get single merch item by ID
exports.getMerchItem = async (req, res) => {
    try {
        const merchId = req.params.id;
        const merchItem = await Merch.findById(merchId);

        if (!merchItem) {
            return res.status(404).json({ error: 'Merch item not found' });
        }

        const ownerId = merchItem.user;
        const isOwner = req.user && String(ownerId) === String(req.user.id);

        if (!isOwner) {
            const owner = await User.findById(ownerId).select('visibilitySettings');
            if (!owner) {
                return res.status(404).json({ error: 'Owner not found' });
            }
            // Restrict only for non-owners
            if (owner.visibilitySettings && !owner.visibilitySettings.merch) {
                return res.status(403).json({ error: 'Access denied. Merch is private.' });
            }
        }

        // Owner or allowed viewer
        res.status(200).json(merchItem);
    } catch (error) {
        console.error('Get single merch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateMerchItem = async (req, res) => {
    try {
        const merchId = req.params.id;
        const userId = req.user.id;
        const { category, url, title, price } = req.body;

        // Find and validate ownership
        const merchItem = await Merch.findOne({ _id: merchId, user: userId });
        if (!merchItem) {
            return res.status(404).json({ error: 'Merch item not found or access denied' });
        }

        // Validate price if provided (allow ranges like "500-1000" or single values)
        if (price !== undefined && typeof price !== 'string' && typeof price !== 'number') {
            return res.status(400).json({ error: 'Price must be a string or number' });
        }

        // Update fields
        if (category) merchItem.category = category;
        if (url) merchItem.url = url;
        if (title) merchItem.title = title;
        if (price !== undefined) merchItem.price = price || null;

        // Handle image updates
        if (req.files['image']) {
            // Delete old image
            if (merchItem.image && fs.existsSync(merchItem.image)) {
                fs.unlinkSync(merchItem.image);
            }
            merchItem.image = req.files['image'][0].path;
        }

        if (req.files['productImage']) {
            // Delete old product image
            if (merchItem.productImage && fs.existsSync(merchItem.productImage)) {
                fs.unlinkSync(merchItem.productImage);
            }
            merchItem.productImage = req.files['productImage'][0].path;
        }

        await merchItem.save();

        res.status(200).json({
            message: 'Merch item updated successfully',
            merch: merchItem
        });
    } catch (error) {
        console.error('Update merch error:', error);

        // Clean up new files if error occurred
        if (req.files) {
            Object.values(req.files).forEach(fileArray => {
                fileArray.forEach(file => {
                    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                });
            });
        }

        res.status(500).json({ error: 'Server error' });
    }
};

// Delete merch item
exports.deleteMerchItem = async (req, res) => {
    try {
        const merchId = req.params.id;
        const userId = req.user.id;

        const merchItem = await Merch.findOneAndDelete({ _id: merchId, user: userId });
        if (!merchItem) {
            return res.status(404).json({ error: 'Merch item not found or access denied' });
        }

        // Delete associated images
        if (merchItem.image && fs.existsSync(merchItem.image)) {
            fs.unlinkSync(merchItem.image);
        }

        if (merchItem.productImage && fs.existsSync(merchItem.productImage)) {
            fs.unlinkSync(merchItem.productImage);
        }

        res.status(200).json({
            message: 'Merch item deleted successfully'
        });
    } catch (error) {
        console.error('Delete merch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};