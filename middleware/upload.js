const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Create directories if they don't exist
const createDirectory = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// Configure storage for profile images
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/profile-images/';
        createDirectory(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const randomName = crypto.randomBytes(16).toString('hex');
        cb(null, `${randomName}${ext}`);
    }
});

// Configure storage for merch images
const merchStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/merch/';
        createDirectory(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const randomName = crypto.randomBytes(16).toString('hex');
        cb(null, `${randomName}${ext}`);
    }
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Create upload instances
const uploadProfileImage = multer({
    storage: profileStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single('profileImage');

const uploadMerchImages = multer({
    storage: merchStorage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 2 // Maximum of 2 files (image + productImage)
    }
}).fields([
    { name: 'image', maxCount: 1 },
    { name: 'productImage', maxCount: 1 }
]);
const galleryStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/gallery/';
        createDirectory(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const randomName = crypto.randomBytes(16).toString('hex');
        cb(null, `${randomName}${ext}`);
    }
});

// Create upload instance for gallery images
const uploadGalleryImage = multer({
    storage: galleryStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
}).single('galleryImage');

// Update exports
module.exports = {
    uploadProfileImage,
    uploadMerchImages,
    uploadGalleryImage  // Add this
};