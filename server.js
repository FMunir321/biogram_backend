require('dotenv').config();
require('./config/db');
const express = require('express');
const app = express();
const cors = require('cors');
const session = require('express-session');
const path = require('path');

// Step 1: CORS Setup
app.use(cors({
  origin: 'http://localhost:5173',  // your frontend origin
  credentials: true
}));

// Step 2: JSON parsing
app.use(express.json());

// Step 3: Session Setup
app.use(session({
  name: 'biogram.sid',
  secret: process.env.SESSION_SECRET || 'mydefaultsecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // ONLY true in HTTPS production
    sameSite: 'lax' // set to 'none' only if frontend uses HTTPS
  }
}));

// Step 4: Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/social-links', require('./routes/socialLinkRoutes'));
app.use('/api/thumbnails', require('./routes/thumbnailRoutes'));
app.use('/api/merch', require('./routes/merchRoutes'));
app.use('/api/gallery', require('./routes/galleryRoutes'));
app.use('/api/contact-info', require('./routes/contactInfoRoutes'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test
app.get('/api', (req, res) => {
  res.send('API running ✅');
});

// Step 5: Listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
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