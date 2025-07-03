const mongoose = require('mongoose');

const ThumbnailSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['small', 'large'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    thumbnailImage: String, 
    image: String,            
    background: String,       
    feature: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Visibility virtual property
ThumbnailSchema.virtual('isVisible').get(function () {
    return !this.feature;
});

module.exports = mongoose.model('Thumbnail', ThumbnailSchema);