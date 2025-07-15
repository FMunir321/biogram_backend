const mongoose = require('mongoose');

const ShoutSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    isMedia: {
        type: Boolean,
        default: false,
    },
    imageUrl: {
        type: String,
    },
    videoUrl: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Shout', ShoutSchema);
