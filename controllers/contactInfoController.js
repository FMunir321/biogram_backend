const ContactInfo = require('../models/ContactInfo');
const User = require('../models/User');
// POST - Create new contact info
exports.createContactInfo = async (req, res) => {
    try {
        const userId = req.user.id;
        const { email, phoneNumber, websiteUrl } = req.body;

        // Validate required fields
        if (!email && !phoneNumber && !websiteUrl) {
            return res.status(400).json({
                error: 'At least one contact field is required'
            });
        }

        // Check if contact info already exists
        const existingContact = await ContactInfo.findOne({ user: userId });
        if (existingContact) {
            return res.status(400).json({
                error: 'Contact info already exists. Use PUT to update instead.'
            });
        }

        // Create new contact info
        const newContactInfo = new ContactInfo({
            user: userId,
            email,
            phoneNumber,
            websiteUrl
        });

        await newContactInfo.save();

        res.status(201).json({
            message: 'Contact information created successfully',
            contactInfo: {
                email: newContactInfo.email,
                phoneNumber: newContactInfo.phoneNumber,
                websiteUrl: newContactInfo.websiteUrl
            }
        });
    } catch (error) {
        console.error('Create contact info error:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }

        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({
                error: `${field} already exists in another contact profile`
            });
        }

        res.status(500).json({ error: 'Server error' });
    }
};

// GET - Get contact info
exports.getContactInfo = async (req, res) => {
    try {
        const requestedUserId = req.params.id;
        const requestingUserId = req.user?.id; // From JWT token

        // Find the requested user's visibility settings
        const user = await User.findById(requestedUserId).select('visibilitySettings');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if requesting user is the owner
        const isOwner = requestingUserId && requestingUserId.toString() === requestedUserId.toString();

        // If not owner and contact info is not visible
        if (!isOwner && user.visibilitySettings?.contactInfo === false) {
            return res.status(403).json({
                error: 'Contact information is private'
            });
        }

        // Find contact info
        const contactInfo = await ContactInfo.findOne({ user: requestedUserId });

        if (!contactInfo) {
            return res.status(404).json({ error: 'Contact information not found' });
        }

        // Return the contact info
        res.status(200).json({
            email: contactInfo.email,
            phoneNumber: contactInfo.phoneNumber,
            websiteUrl: contactInfo.websiteUrl
        });

    } catch (error) {
        console.error('Get contact info error:', error);

        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        res.status(500).json({ error: 'Server error' });
    }
};

// PUT - Update contact info
exports.updateContactInfo = async (req, res) => {
    try {
        const userId = req.user.id;
        const { email, phoneNumber, websiteUrl } = req.body;

        // Validate at least one field is provided
        if (!email && !phoneNumber && !websiteUrl) {
            return res.status(400).json({ error: 'At least one field is required' });
        }

        const updateData = {};
        if (email !== undefined) updateData.email = email;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl;

        const options = {
            new: true,
            runValidators: true
        };

        const updatedInfo = await ContactInfo.findOneAndUpdate(
            { user: userId },
            updateData,
            options
        );

        if (!updatedInfo) {
            return res.status(404).json({ error: 'Contact information not found' });
        }

        res.status(200).json({
            message: 'Contact information updated successfully',
            contactInfo: {
                email: updatedInfo.email,
                phoneNumber: updatedInfo.phoneNumber,
                websiteUrl: updatedInfo.websiteUrl
            }
        });
    } catch (error) {
        console.error('Update contact info error:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }

        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({
                error: `${field} already exists in another contact profile`
            });
        }

        res.status(500).json({ error: 'Server error' });
    }
};


// DELETE - Delete ALL contact info
exports.deleteContactInfo = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await ContactInfo.deleteOne({ user: userId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Contact information not found' });
        }

        res.status(200).json({
            message: 'Contact information deleted successfully'
        });
    } catch (error) {
        console.error('Delete contact info error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};