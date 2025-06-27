const mongoose = require('mongoose');

const UserVerificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['email', 'phone', 'login'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true
    }
});

module.exports = mongoose.model('UserVerification', UserVerificationSchema);