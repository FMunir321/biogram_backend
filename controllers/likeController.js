const ProfileLike = require('../models/ProfileLike');

// Like/unlike a profile
exports.toggleProfileLike = async (req, res) => {
    try {
        const { userId } = req.params;
        const likerId = req.user.id;

        // Check if like exists
        const existingLike = await ProfileLike.findOne({
            liker: likerId,
            likedUser: userId
        });

        if (existingLike) {
            // Unlike
            await ProfileLike.findByIdAndDelete(existingLike._id);
            return res.status(200).json({ liked: false });
        } else {
            // Like
            await ProfileLike.create({ liker: likerId, likedUser: userId });
            return res.status(201).json({ liked: true });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get like count for a user
exports.getProfileLikes = async (req, res) => {
    try {
        const { userId } = req.params;
        const likeCount = await ProfileLike.countDocuments({ likedUser: userId });
        res.status(200).json({ likeCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};