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
    websiteUrl: {
        type: String,
        default: '',
        match: [/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
            'Please use a valid URL']
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
        bio: { type: Boolean, default: true },
        featuredLinks: { type: Boolean, default: true },
        merch: { type: Boolean, default: true },
        gallery: { type: Boolean, default: true },
        contactInfo: { type: Boolean, default: true },
        shouts: {
            type: Boolean, default: true

        }
    },
    analytics: {
        profileViews: { type: Number, default: 0 },
        linkClicks: { type: Number, default: 0 },
        visitors: [{
            timestamp: { type: Date, default: Date.now },
            ipAddress: { type: String, required: true }
        }]
    },
    deletionScheduled: { type: Boolean, default: false },
    deletionScheduledAt: Date,
    profileTemplate: {
        type: String,
        enum: ['temp1', 'temp2', 'temp3', 'temp4', 'temp5', 'temp6'],
        default: 'temp1'
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