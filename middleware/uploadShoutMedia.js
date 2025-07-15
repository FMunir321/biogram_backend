const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureUploadDirs = () => {
    const dirs = ['uploads/shouts/images', 'uploads/shouts/videos'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
};
ensureUploadDirs();

const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/shouts/images'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/shouts/videos'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const uploadShoutMedia = (req, res, next) => {
    console.log('Starting uploadShoutMedia middleware');
    
    // Use a single multer instance to handle both fields
    const upload = multer({
        storage: imageStorage, // Default to image storage, will be overridden
        fileFilter: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            const valid = ['.jpg', '.jpeg', '.png'].includes(ext);
            cb(valid ? null : new Error('Invalid file type'), valid);
        },
    }).fields([
        { name: 'isMedia', maxCount: 1 },
        { name: 'file', maxCount: 1 }
    ]);

    upload(req, res, function (err) {
        if (err) {
            console.error('Upload error:', err.message);
            return res.status(400).json({ error: err.message });
        }

        // Parse isMedia from the uploaded fields
        const isMedia = req.body.isMedia === 'true';
        console.log('isMedia parsed:', isMedia);

        // Validate file type based on isMedia
        if (req.files && req.files.file && req.files.file[0]) {
            const file = req.files.file[0];
            const ext = path.extname(file.originalname).toLowerCase();
            
            if (isMedia) {
                // For videos, check video file types
                if (!['.mp4', '.mov', '.avi'].includes(ext)) {
                    return res.status(400).json({ error: 'Invalid video file type' });
                }
                // Move file to video directory
                const videoPath = `uploads/shouts/videos/${file.filename}`;
                const fs = require('fs');
                fs.renameSync(file.path, videoPath);
                file.path = videoPath;
            } else {
                // For images, check image file types
                if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
                    return res.status(400).json({ error: 'Invalid image file type' });
                }
            }
        }

        console.log('Upload success:', req.files);
        next();
    });
};

module.exports = uploadShoutMedia;
