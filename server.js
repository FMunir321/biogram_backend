
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
            console.log('Socket.IO CORS check for origin:', origin);
            // Allow requests with no origin (like mobile apps or curl)
            if (!origin) return callback(null, true);
            // Allow all localhost origins
            if (origin.startsWith('http://localhost:') || origin.startsWith('http://3.111.146.115:') || origin.startsWith('https://biogram-y2p8.vercel.app')) {
                console.log('✅ CORS allowed for origin:', origin);
                return callback(null, true);
            }
            console.log('❌ CORS rejected for origin:', origin);
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
    console.log(`✅ Socket connected: ${socket.id}`);
    console.log('Transport:', socket.conn.transport.name);
    console.log('Client IP:', socket.handshake.address);
    console.log('User agent:', socket.handshake.headers['user-agent']);

    // Handle transport upgrade
    socket.conn.on('upgrade', () => {
        console.log(`🔄 Socket ${socket.id} upgraded to:`, socket.conn.transport.name);
    });

    // Handle user going online
    socket.on('addNewUser', (userId) => {
        console.log(`👤 User ${userId} connected with socket ${socket.id}`);
        
        // Remove any existing connections for this user (prevent duplicates)
        for (const [socketId, existingUserId] of onlineUsers.entries()) {
            if (existingUserId === userId && socketId !== socket.id) {
                console.log(`🔄 Removing duplicate connection for user ${userId}: ${socketId}`);
                onlineUsers.delete(socketId);
            }
        }
        
        onlineUsers.set(socket.id, userId);
        
        // Broadcast updated online users list
        const onlineUsersList = Array.from(onlineUsers.values());
        console.log('📊 Online users:', onlineUsersList);
        io.emit('getOnlineUsers', onlineUsersList);
    });

    // Handle joining a chat room
    socket.on('joinRoom', (chatId) => {
        console.log(`Socket ${socket.id} joined room: ${chatId}`);
        socket.join(chatId);
    });

    // Handle leaving a chat room
    socket.on('leaveRoom', (chatId) => {
        console.log(`Socket ${socket.id} left room: ${chatId}`);
        socket.leave(chatId);
    });

    // Handle sending messages
    socket.on('sendMessage', (messageData) => {
        console.log('Message received:', messageData);
        
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
        console.log(`❌ Socket disconnected: ${socket.id}, Reason: ${reason}`);
        const userId = onlineUsers.get(socket.id);
        if (userId) {
            console.log(`👤 User ${userId} went offline`);
        }
        onlineUsers.delete(socket.id);
        
        // Broadcast updated online users list
        const onlineUsersList = Array.from(onlineUsers.values());
        console.log('📊 Online users after disconnect:', onlineUsersList);
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
    console.log(`Server running on port ${PORT}`);
    console.log('Socket.IO server initialized');
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
