require('./config/db');
const express = require('express');
const app = express();
const cors = require('cors');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        // Allow all localhost origins
        if (origin.startsWith('http://localhost:')) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const socialLinkRoutes = require('./routes/socialLinkRoutes');
const thumbnailRoutes = require('./routes/thumbnailRoutes');
const merchRoutes = require('./routes/merchRoutes');
const galleryRoutes = require('./routes/galleryRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/social-links', socialLinkRoutes);
app.use('/api/thumbnails', thumbnailRoutes);
app.use('/api/merch', merchRoutes);
app.use('/api/gallery', galleryRoutes);

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