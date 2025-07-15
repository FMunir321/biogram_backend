const Shout = require('../models/Shout');

exports.createShout = async (req, res) => {
    try {
        const { isMedia } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileUrl = `/uploads/shouts/${isMedia === 'true' ? 'videos' : 'images'}/${req.file.filename}`;

        const shout = new Shout({
            userId: req.user.id, // assuming user is authenticated
            isMedia: isMedia === 'true',
            imageUrl: isMedia === 'true' ? undefined : fileUrl,
            videoUrl: isMedia === 'true' ? fileUrl : undefined,
        });

        await shout.save();

        res.status(201).json({ message: 'Shout created successfully', shout });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
