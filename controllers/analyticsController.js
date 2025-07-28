const User = require('../models/User');

exports.recordProfileView = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.analytics.profileViews += 1;
        user.analytics.visitors.push({
            ipAddress: req.ip || req.connection.remoteAddress
        });
        await user.save();
        res.status(200).json({ message: 'Profile view recorded' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.recordLinkClick = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.analytics.linkClicks += 1;
        await user.save();
        res.status(200).json({ message: 'Link click recorded' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAnalytics = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const lastMonthVisitors = user.analytics.visitors.filter(
            visitor => visitor.timestamp >= oneMonthAgo
        ).length;

        res.json({
            profileViews: user.analytics.profileViews,
            linkClicks: user.analytics.linkClicks,
            lastMonthVisitors: lastMonthVisitors,
            totalVisitors: user.analytics.visitors.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};