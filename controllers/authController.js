const express = require('express');
const router = express.Router();
const User = require('../models/User');
const UserVerification = require('../models/UserVerification');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS
    }
});

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send OTP to email/phone
const sendOTP = async (user, purpose, recipient) => {
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    // Save new OTP
    await UserVerification.deleteMany({ userId: user._id, purpose });
    const newVerification = new UserVerification({
        userId: user._id,
        otp: hashedOTP,
        type: purpose, // change 'purpose' to 'type'
        createdAt: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });



    await newVerification.save();

    // Send via email
    if (purpose === 'email' || (purpose === 'login' && user.email)) {
        const mailOptions = {
            from: process.env.AUTH_EMAIL,
            to: recipient,
            subject: 'Your Verification OTP',
            html: `<p>Your OTP is: <b>${otp}</b>. Expires in 10 minutes.</p>`
        };
        await transporter.sendMail(mailOptions);
    }
    // For phone: Integrate SMS gateway here
    else if (purpose === 'phone' || (purpose === 'login' && user.phoneNumber)) {
        // Implement SMS sending logic
        console.log(`SMS OTP to ${recipient}: ${otp}`);
        // Actual SMS integration would go here
    }

    return otp;
};

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { fullName, username, dateOfBirth, password, email, phoneNumber } = req.body;
        const parsedDateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
        // Update signup validation
        if (!fullName || !username || !dateOfBirth || !password || (!email && !phoneNumber)) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user exists
        const existingUser = await User.findOne({
            $or: [
                { email },
                { username },
                { phoneNumber }
            ]
        });

        if (existingUser) {
            if (existingUser.username === username)
                return res.status(400).json({ error: 'Username taken' });
            if (email && existingUser.email === email)
                return res.status(400).json({ error: 'Email already registered' });
            if (phoneNumber && existingUser.phoneNumber === phoneNumber)
                return res.status(400).json({ error: 'Phone number already registered' });
        }

        // Create user
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            fullName,
            username,
            dateOfBirth: parsedDateOfBirth,
            email,
            phoneNumber,
            password: hashedPassword
        });

        const user = await newUser.save();

        // Send OTP
        const recipient = email || phoneNumber;
        const type = email ? 'email' : 'phone';
        await sendOTP(user, type, recipient);

        res.status(201).json({
            status: 'pending',
            message: 'OTP sent',
            userId: user._id,
            verificationType: type
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Verify Signup OTP
router.post('/verify-signup', async (req, res) => {
    try {
        const { userId, otp } = req.body;
        const record = await UserVerification.findOne({ userId, type: 'email' });

        if (!record) return res.status(400).json({ error: 'Invalid OTP' });
        if (record.expiresAt < Date.now()) {
            await UserVerification.deleteOne({ _id: record._id });
            return res.status(400).json({ error: 'OTP expired' });
        }

        const isValid = await bcrypt.compare(otp, record.otp);
        if (!isValid) return res.status(400).json({ error: 'Invalid OTP' });

        // Update user verification status
        await User.updateOne({ _id: userId }, { verified: true });
        await UserVerification.deleteOne({ _id: record._id });

        res.status(200).json({ message: 'Account verified successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
// Updated login endpoint
router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ error: 'Identifier and password required' });
        }

        // Find user by either email or phone number
        const user = await User.findOne({
            $or: [
                { email: identifier },
                { phoneNumber: identifier }
            ]
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check if account is verified
        if (!user.verified) {
            return res.status(403).json({
                error: 'Account not verified',
                userId: user._id
            });
        }

        // Determine contact method
        const recipient = user.email || user.phoneNumber;
        const type = user.email ? 'email' : 'phone';

        // Send login OTP
        await sendOTP(user, 'login', recipient);

        res.status(200).json({
            status: 'otp_required',
            message: 'OTP sent for login verification',
            userId: user._id,
            contactMethod: type
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Verify Login OTP
router.post('/verify-login', async (req, res) => {
    try {
        const { userId, otp } = req.body;
        const record = await UserVerification.findOne({ userId, type: 'login' });

        if (!record) return res.status(400).json({ error: 'Invalid OTP' });
        if (record.expiresAt < Date.now()) {
            await UserVerification.deleteOne({ _id: record._id });
            return res.status(400).json({ error: 'OTP expired' });
        }

        const isValid = await bcrypt.compare(otp, record.otp);
        if (!isValid) return res.status(400).json({ error: 'Invalid OTP' });

        // Delete OTP record
        await UserVerification.deleteOne({ _id: record._id });

        // Get user data
        const user = await User.findById(userId);

        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                phoneNumber: user.phoneNumber
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Dashboard route
router.get('/dashboard', (req, res) => {
    // Implement your dashboard logic here
    res.status(200).json({ message: 'Welcome to your dashboard!' });
});

module.exports = router;