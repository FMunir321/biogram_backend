
require('./config/db');
const express = require('express');
const cron = require('node-cron');
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const socialLinkRoutes = require('./routes/socialLinkRoutes');
const thumbnailRoutes = require('./routes/thumbnailRoutes');
const merchRoutes = require('./routes/merchRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const contactInfoRoutes = require('./routes/contactInfoRoutes');
const shoutRoutes = require('./routes/shoutRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes')
const chatRoute = require('./routes/chatRoute')
const messageRoute = require('./routes/messageRoute');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/social-links', socialLinkRoutes);
app.use('/api/thumbnails', thumbnailRoutes);
app.use('/api/merch', merchRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/contact-info', contactInfoRoutes);
app.use('/api/shouts', shoutRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chats', chatRoute)
app.use('/api/messages', messageRoute);

// Serve static files from the "uploads" directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // cron.schedule('* * * * * *', async () => {
    //     try {
    //         const fifteenDaysAgo = new Date();
    //         // fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    //         const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    //         console.log('Checking deletion for users before:cccccccccccccccccccccccccccccccccccc', thirtySecondsAgo.toISOString());

    //         const result = await User.deleteMany({
    //             deletionScheduled: true,
    //             deletionScheduledAt: { $lte: thirtySecondsAgo }
    //         });

    //         console.log(`Permanently deleted ${result.deletedCount} accounts`);
    //     } catch (error) {
    //         console.error('Account cleanup error:', error);
    //     }
    // });
});
app.get('/api', (req, res) => {
    res.send('API is running');
});

// Schedule daily cleanup job (runs at 3 AM daily)
