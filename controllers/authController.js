const express = require('express');
const router = express.Router();
const User = require('../models/User');
const UserVerification = require('../models/UserVerification');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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
        type: purpose,
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
            password: hashedPassword,
            verified: false
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

// Unified OTP Verification
router.post('/verify-otp', async (req, res) => {
    try {
        const { userId, otp } = req.body;

        // Find all active OTP records for the user
        const records = await UserVerification.find({
            userId,
            expiresAt: { $gt: Date.now() } // Only non-expired records
        });

        if (!records || records.length === 0) {
            return res.status(400).json({ error: 'OTP expired or not found' });
        }

        let isValid = false;
        let matchedRecord = null;

        // Check all active OTPs
        for (const record of records) {
            const isMatch = await bcrypt.compare(otp, record.otp);
            if (isMatch) {
                isValid = true;
                matchedRecord = record;
                break;
            }
        }

        if (!isValid) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // Delete all OTP records for this user
        await UserVerification.deleteMany({ userId });

        // Get user and update verification status if needed
        const user = await User.findById(userId);
        if (!user.verified) {
            user.verified = true;
            await user.save();
        }

        const token = generateToken(user);

        res.status(200).json({
            message: 'Verification successful',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                phoneNumber: user.phoneNumber,
                verified: user.verified
            }
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
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

        // Determine contact method
        const recipient = user.email || user.phoneNumber;
        const type = user.email ? 'email' : 'phone';

        // Always send login OTP regardless of verification status
        await sendOTP(user, 'login', recipient);

        res.status(200).json({
            status: 'otp_required',
            message: 'OTP sent for verification',
            userId: user._id,
            contactMethod: type,
            isVerified: user.verified
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Generate JWT token
function generateToken(user) {
    return jwt.sign(
        {
            id: user._id,
            username: user.username,
            email: user.email,
            phoneNumber: user.phoneNumber
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// Dashboard route
router.get('/dashboard', (req, res) => {
    res.status(200).json({ message: 'Welcome to your dashboard!' });
});

module.exports = router;