const mongoose = require('mongoose');

const MerchSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        required: true,
        // enum: ['clothing', 'accessories', 'digital', 'other']
    },
    url: {
        type: String,
        required: true,
        match: [/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
            'Please use a valid URL with HTTP or HTTPS']
    },
    title: {
        type: String,
        required: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    image: {
        type: String,
        default: ''
    },
    productImage: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Merch', MerchSchema);