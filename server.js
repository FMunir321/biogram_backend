
require('./config/db');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cron = require('node-cron');
const app = express();
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Create HTTP server
const server = http.createServer(app);



// Configure Socket.IO with CORS
const io = socketIo(server, {
    cors: {
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl)
            if (!origin) return callback(null, true);
            // Allow all localhost origins
            if (origin.startsWith('http://localhost:') || origin.startsWith('http://3.111.146.115:') || origin.startsWith('https://biogram-y2p8.vercel.app')) {
                return callback(null, true);
            }
            return callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"]
    },
    transports: ['polling', 'websocket'],
    upgradeTimeout: 30000,
    pingTimeout: 25000,
    pingInterval: 20000
});

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

// Socket.IO event handlers
let onlineUsers = new Map(); // Store online users: socketId -> userId

io.on('connection', (socket) => {

    // Handle transport upgrade
    socket.conn.on('upgrade', () => {
    });

    // Handle user going online
    socket.on('addNewUser', (userId) => {
        console.log(`👤 User ${userId} connected with socket ${socket.id}`);

        // Store userId on socket object for API access
        socket.userId = userId;

        // Remove any existing connections for this user (prevent duplicates)
        for (const [socketId, existingUserId] of onlineUsers.entries()) {
            if (existingUserId === userId && socketId !== socket.id) {
                onlineUsers.delete(socketId);
            }
        }

        onlineUsers.set(socket.id, userId);

        // Broadcast updated online users list
        const onlineUsersList = Array.from(onlineUsers.values());
        io.emit('getOnlineUsers', onlineUsersList);
    });

    // Handle joining a chat room
    socket.on('joinRoom', (chatId) => {
        socket.join(chatId);
    });

    // Handle leaving a chat room
    socket.on('leaveRoom', (chatId) => {
        socket.leave(chatId);
    });

    // Handle sending messages
    socket.on('sendMessage', (messageData) => {

        // Emit message to all users in the chat room
        socket.to(messageData.chatId).emit('getMessage', {
            _id: messageData._id,
            chatId: messageData.chatId,
            senderId: messageData.senderId,
            text: messageData.text,
            createdAt: messageData.createdAt
        });
    });

    // Handle user typing indicator
    socket.on('typing', (data) => {
        socket.to(data.chatId).emit('userTyping', {
            userId: data.userId,
            isTyping: data.isTyping
        });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
        const userId = onlineUsers.get(socket.id);
        if (userId) {
        }
        onlineUsers.delete(socket.id);

        // Broadcast updated online users list
        const onlineUsersList = Array.from(onlineUsers.values());

        io.emit('getOnlineUsers', onlineUsersList);
    });

    // Handle connection errors
    socket.on('error', (error) => {
        console.error(`❌ Socket error for ${socket.id}:`, error);
    });
});

// Make io available to other modules
app.set('io', io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
});
app.get('/api', (req, res) => {
    res.send('API is running');
});

// Schedule daily cleanup job (runs at 3 AM daily)
