const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    username: {
        type: String,
        required: true,
        unique: true,
        match: [/^[a-zA-Z0-9_]+$/, 'Username must contain only letters, numbers and underscores']
    },
    email: {
        type: String,
        unique: true,
        sparse: true
    },
    phoneNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    profileImage: {
        type: String,
        default: ''
    },
    bio: { type: String, default: '' },
    dateOfBirth: { type: Date, required: true },
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    trustedDevices: [{
        token: String,
        expires: Date
    }],
    visibilitySettings: {
        bio: { type: Boolean, default: false },
        featuredLinks: { type: Boolean, default: false },
        merch: { type: Boolean, default: false },
        gallery: { type: Boolean, default: false },
        contactInfo: { type: Boolean, default: false },
        shouts: { type: Boolean, default: false }
    }
}, {
    // Add this to handle either email or phone requirement
    validate: {
        validator: function () {
            return this.email || this.phoneNumber;
        },
        message: 'Either email or phone number is required'
    }
});



module.exports = mongoose.model('User', UserSchema);