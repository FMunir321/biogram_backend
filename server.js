
require('./config/db');
const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
require('dotenv').config();


app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        // Allow all localhost origins
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://3.111.146.115:') || origin.startsWith('https://biogram-y2p8.vercel.app')) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const socialLinkRoutes = require('./routes/socialLinkRoutes');
const thumbnailRoutes = require('./routes/thumbnailRoutes');
const merchRoutes = require('./routes/merchRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const contactInfoRoutes = require('./routes/contactInfoRoutes');
const shoutRoutes = require('./routes/shoutRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/social-links', socialLinkRoutes);
app.use('/api/thumbnails', thumbnailRoutes);
app.use('/api/merch', merchRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/contact-info', contactInfoRoutes);
app.use('/api/shouts', shoutRoutes);

// Serve static files from the "uploads" directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
app.get('/api', (req, res) => {
    res.send('API is running');
});