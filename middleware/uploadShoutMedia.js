const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure directories exist
const ensureUploadDirs = () => {
    const dirs = ['uploads/shouts/images', 'uploads/shouts/videos'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
};
ensureUploadDirs();

// Storage engines
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Use the isMedia value from the request body
        const isMedia = req.body.isMedia === 'true';
        cb(null, `uploads/shouts/${isMedia ? 'videos' : 'images'}`);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    const isMedia = req.body.isMedia === 'true';
    const ext = path.extname(file.originalname).toLowerCase();
    const validExts = isMedia
        ? ['.mp4', '.mov', '.avi']
        : ['.jpg', '.jpeg', '.png', '.gif'];

    if (validExts.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type for ${isMedia ? 'video' : 'image'}`), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
}).single('file');

const uploadShoutMedia = (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            console.error('Upload error:', err.message);
            return res.status(400).json({ error: err.message });
        }
        next();
    });
};

module.exports = uploadShoutMedia;