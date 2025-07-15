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
    console.log('Starting uploadShoutMedia middleware', req);
    const fieldsParser = multer().fields([{ name: 'isMedia' }]);

    fieldsParser(req, res, function (err) {
        if (err) return res.status(400).json({ error: err.message });

        const isMedia = req.body.isMedia === 'true';
        console.log('isMedia parsed:', isMedia);

        const upload = multer({
            storage: isMedia ? videoStorage : imageStorage,
            fileFilter: (req, file, cb) => {
                const ext = path.extname(file.originalname).toLowerCase();
                const valid = isMedia
                    ? ['.mp4', '.mov', '.avi'].includes(ext)
                    : ['.jpg', '.jpeg', '.png'].includes(ext);
                cb(valid ? null : new Error('Invalid file type'), valid);
            },
        }).single('file');

        upload(req, res, function (err) {
            if (err) {
                console.error('Upload error:', err.message);
                return res.status(400).json({ error: err.message });
            }

            console.log('Upload success:', req.file);
            next();
        });
    });
};

module.exports = uploadShoutMedia;
