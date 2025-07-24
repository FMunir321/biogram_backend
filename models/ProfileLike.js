const mongoose = require('mongoose');

const profileLikeSchema = new mongoose.Schema({
    liker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    likedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent duplicate likes
profileLikeSchema.index({ liker: 1, likedUser: 1 }, { unique: true });

module.exports = mongoose.model('ProfileLike', profileLikeSchema);