require('dotenv').config();
require('./config/db');

const express = require('express');
const app = express();
const cors = require('cors');
const session = require('express-session');
const path = require('path');

// CORS Setup
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || origin.startsWith('http://localhost') || origin.includes('your-live-frontend.com')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        sameSite: 'lax'
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

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/social-links', socialLinkRoutes);
app.use('/api/thumbnails', thumbnailRoutes);
app.use('/api/merch', merchRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/contact-info', contactInfoRoutes);

// Static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test route
app.get('/api', (req, res) => {
    res.send('API is running ✅');
});

// ✅ Always start the server on EC2
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});


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