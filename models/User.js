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
    deletionScheduled: { type: Boolean, default: false },
    deletionScheduledAt: Date,
}, {
    // Add this to handle either email or phone requirement
    validate: {
        validator: function () {
            return this.email || this.phoneNumber;
        },
        message: 'Either email or phone number is required'
    },
    // Add these options for virtual fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true
});

// Virtual for like count (number of likes received)
UserSchema.virtual('likeCount', {
    ref: 'ProfileLike',
    localField: '_id',
    foreignField: 'likedUser',
    count: true
});

// Virtual for likes received (full like objects)
UserSchema.virtual('likesReceived', {
    ref: 'ProfileLike',
    localField: '_id',
    foreignField: 'likedUser'
});

// Virtual for likes given (who this user has liked)
UserSchema.virtual('likesGiven', {
    ref: 'ProfileLike',
    localField: '_id',
    foreignField: 'liker'
});

// Method to check if current user has liked another user
UserSchema.methods.hasLiked = async function (userId) {
    const like = await mongoose.model('ProfileLike').findOne({
        liker: this._id,
        likedUser: userId
    });
    return !!like;
};

// Method to get like count (alternative to virtual)
UserSchema.methods.getLikeCount = async function () {
    return await mongoose.model('ProfileLike').countDocuments({
        likedUser: this._id
    });
};

// Index for better performance on queries
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 }, { sparse: true });
UserSchema.index({ phoneNumber: 1 }, { sparse: true });

module.exports = mongoose.model('User', UserSchema);