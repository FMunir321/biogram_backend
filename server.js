require('dotenv').config();
// require('./config/db');
const express = require('express');
const app = express();
const cors = require('cors');
// const session = require('express-session');
const path = require('path');

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (origin.startsWith('http://localhost:')) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());
// app.use(session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: process.env.NODE_ENV === 'production' }
// }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/social-links', require('./routes/socialLinkRoutes'));
app.use('/api/thumbnails', require('./routes/thumbnailRoutes'));
app.use('/api/merch', require('./routes/merchRoutes'));
app.use('/api/gallery', require('./routes/galleryRoutes'));
app.use('/api/contact-info', require('./routes/contactInfoRoutes'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test route
app.get('/api', (req, res) => {
    res.send('API is running');
});
app.get('/', (req, res) => {
    res.send('Backend is deployed and working');
});
// Must be at the end
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