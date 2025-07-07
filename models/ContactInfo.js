const mongoose = require('mongoose');

const ContactInfoSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    phoneNumber: {
        type: String,
        unique: true,
        sparse: true,
        validate: {
            validator: function (v) {
                return /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    websiteUrl: {
        type: String,
        validate: {
            validator: function (v) {
                return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/.test(v);
            },
            message: props => `${props.value} is not a valid URL!`
        }
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        validate: {
            validator: function (v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: props => `${props.value} is not a valid email!`
        }
    },
    visibility: {
        phoneNumber: { type: Boolean, default: true },
        websiteUrl: { type: Boolean, default: true },
        email: { type: Boolean, default: true }
    }
}, { timestamps: true });

module.exports = mongoose.model('ContactInfo', ContactInfoSchema);