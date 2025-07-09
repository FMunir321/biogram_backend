require('dotenv').config();
require('./config/db');

const express = require('express');
const app = express();
const cors = require('cors');
const session = require('express-session');
const path = require('path');

// CORS Configuration
const allowedOrigins = [
    'http://localhost',
    'https://your-frontend-domain.com', // Replace with real domain if deployed
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (e.g., curl, mobile apps)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Body parser
app.use(express.json());

// Session Setup
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use true if using HTTPS
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const socialLinkRoutes = require('./routes/socialLinkRoutes');
const thumbnailRoutes = require('./routes/thumbnailRoutes');
const merchRoutes = require('./routes/merchRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const contactInfoRoutes = require('./routes/contactInfoRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/social-links', socialLinkRoutes);
app.use('/api/thumbnails', thumbnailRoutes);
app.use('/api/merch', merchRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/contact-info', contactInfoRoutes);

// Static file hosting (e.g., images, uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test route
app.get('/api', (req, res) => {
    res.send('API is running 12✅');
});

// Start the server only if not in a serverless environment (like Vercel)
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
}

// Export for serverless compatibility
const serverless = require('serverless-http');
module.exports = serverless(app);



// require('./config/db');
// const express = require('express');
// const app = express();
// const cors = require('cors');
// const session = require('express-session');
// const path = require('path');
// require('dotenv').config();

// app.use(cors({
//     origin: (origin, callback) => {
//         // Allow requests with no origin (like mobile apps or curl)
//         if (!origin) return callback(null, true);
//         // Allow all localhost origins
//         if (origin.startsWith('http://localhost:')) return callback(null, true);
//         return callback(new Error('Not allowed by CORS'));
//     },
//     credentials: true
// }));
// app.use(express.json());
// app.use(session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: process.env.NODE_ENV === 'production' }
// }));

// // Routes
// const authRoutes = require('./routes/authRoutes');
// const userRoutes = require('./routes/userRoutes');
// const socialLinkRoutes = require('./routes/socialLinkRoutes');
// const thumbnailRoutes = require('./routes/thumbnailRoutes');
// const merchRoutes = require('./routes/merchRoutes');
// const galleryRoutes = require('./routes/galleryRoutes');
// const contactInfoRoutes = require('./routes/contactInfoRoutes');

// // Mount routes
// app.use('/api/auth', authRoutes);
// app.use('/api/user', userRoutes);
// app.use('/api/social-links', socialLinkRoutes);
// app.use('/api/thumbnails', thumbnailRoutes);
// app.use('/api/merch', merchRoutes);
// app.use('/api/gallery', galleryRoutes);
// app.use('/api/contact-info', contactInfoRoutes);

// // Serve static files from the "uploads" directory
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });
// app.get('/api', (req, res) => {
//     res.send('API is running');
// });