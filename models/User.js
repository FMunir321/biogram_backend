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
        sparse: true  // Allows null values while maintaining uniqueness
    },
    phoneNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    dateOfBirth: { type: Date, required: true },
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
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