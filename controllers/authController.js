const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const UserVerification = require('../models/UserVerification');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

// Security constants
const OTP_ATTEMPT_LIMIT = 5;
const OTP_VALIDITY_MINUTES = 10;
const SESSION_VALIDITY_MINUTES = 15;

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS
    }
});

// Secure OTP generation
const generateOTP = () => crypto.randomInt(100000, 999999).toString();

// Secure device token generation
const generateDeviceToken = () => crypto.randomBytes(32).toString('hex');

// Send OTP to email/phone
const sendOTP = async (user, purpose, recipient) => {
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    // Determine verification method
    let method = purpose;
    if (purpose === 'login') {
        method = user.email ? 'email' : 'phone';
    }

    // Save new OTP
    await UserVerification.deleteMany({ userId: user._id, type: method });
    const newVerification = new UserVerification({
        userId: user._id,
        otp: hashedOTP,
        type: method,
        createdAt: Date.now(),
        expiresAt: Date.now() + OTP_VALIDITY_MINUTES * 60 * 1000
    });

    await newVerification.save();

    // Send via email
    if (method === 'email') {
        const mailOptions = {
            from: process.env.AUTH_EMAIL,
            to: recipient,
            subject: 'Your Verification OTP',
            html: `<p>Your OTP is: <b>${otp}</b>. Expires in ${OTP_VALIDITY_MINUTES} minutes.</p>`
        };
        await transporter.sendMail(mailOptions);
    }
    // For phone: Integrate SMS gateway here
    else if (method === 'phone') {
        // Implement actual SMS sending logic
        console.log(`SMS OTP to ${recipient}: ${otp}`);
        // Actual SMS integration would go here
    }

    return otp;
};

// Input validation middleware
const validateSignup = [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('username').trim().notEmpty().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('dateOfBirth').isISO8601().toDate().withMessage('Valid date of birth is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('email').optional().isEmail().normalizeEmail({ gmail_remove_dots: false }).withMessage('Valid email is required'),
    body('phoneNumber').optional().isMobilePhone().withMessage('Valid phone number is required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

// Signup
router.post('/signup', validateSignup, async (req, res) => {
    try {
        const { fullName, username, dateOfBirth, password, email, phoneNumber } = req.body;
        console.log('Signup request:', req.body);
        const parsedDateOfBirth = new Date(dateOfBirth);

        // Check contact method exists
        if (!email && !phoneNumber) {
            return res.status(400).json({ error: 'Email or phone number is required' });
        }

        // Check for existing user
        const existingUser = await User.findOne({
            $or: [
                { email },
                { username },
                { phoneNumber }
            ]
        });

        if (existingUser) {
            if (existingUser.username === username) {
                return res.status(409).json({ error: 'Username taken' });
            }
            if (email && existingUser.email === email) {
                return res.status(409).json({ error: 'Email already registered' });
            }
            if (phoneNumber && existingUser.phoneNumber === phoneNumber) {
                return res.status(409).json({ error: 'Phone number already registered' });
            }
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
            verified: false,
            emailVerified: false,
            phoneVerified: false
        });

        const user = await newUser.save();

        // Send OTP
        const recipient = email || phoneNumber;
        const type = email ? 'email' : 'phone';
        await sendOTP(user, type, recipient);

        // Initialize OTP session
        req.session.otpSessionStart = Date.now();
        req.session.otpAttempts = 0;

        res.status(201).json({
            status: 'pending',
            message: 'OTP sent',
            userId: user._id,
            verificationType: type
        });
    } catch (error) {
        console.error('Signup error:', error);

        // Handle duplicate key errors
        if (error.name === 'MongoError' && error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({ error: `${field} already exists` });
        }

        res.status(500).json({
            error: process.env.NODE_ENV === 'development'
                ? error.message
                : 'Internal server error'
        });
    }
});

// Unified OTP Verification
router.post('/verify-otp', async (req, res) => {
    try {
        const { userId, otp, rememberDevice } = req.body;
        const session = req.session;

        // Validate session
        if (!session.otpSessionStart ||
            Date.now() - session.otpSessionStart > SESSION_VALIDITY_MINUTES * 60 * 1000) {
            return res.status(401).json({ error: 'OTP session expired' });
        }

        // Track attempts
        session.otpAttempts = (session.otpAttempts || 0) + 1;
        if (session.otpAttempts > OTP_ATTEMPT_LIMIT) {
            return res.status(429).json({ error: 'Too many attempts. Please request a new OTP' });
        }

        // Find active OTP records
        const records = await UserVerification.find({
            userId,
            expiresAt: { $gt: Date.now() }
        });

        if (!records.length) {
            return res.status(400).json({ error: 'OTP expired or not found' });
        }

        // Verify OTP
        let isValid = false;
        let matchedRecord = null;
        for (const record of records) {
            if (await bcrypt.compare(otp, record.otp)) {
                isValid = true;
                matchedRecord = record;
                break;
            }
        }

        if (!isValid) {
            return res.status(400).json({
                error: 'Invalid OTP',
                attempts: session.otpAttempts,
                remaining: OTP_ATTEMPT_LIMIT - session.otpAttempts
            });
        }

        // Update user verification status
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (matchedRecord.type === 'email') {
            user.emailVerified = true;
        } else if (matchedRecord.type === 'phone') {
            user.phoneVerified = true;
        }

        // Mark as verified if any method is verified
        if (!user.verified && (user.emailVerified || user.phoneVerified)) {
            user.verified = true;
        }

        // Handle device remembering
        let deviceToken;
        if (rememberDevice) {
            deviceToken = generateDeviceToken();
            user.trustedDevices = user.trustedDevices || [];
            user.trustedDevices.push({
                token: await bcrypt.hash(deviceToken, 10),
                expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            });
        }

        await user.save();

        // Generate JWT
        const token = generateToken(user);

        // Clear session and OTP records
        await UserVerification.deleteMany({ userId });
        session.otpSessionStart = null;
        session.otpAttempts = null;

        // Send response
        res.status(200).json({
            message: 'Verification successful',
            token,
            deviceToken,
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                phoneNumber: user.phoneNumber,
                verified: user.verified,
                emailVerified: user.emailVerified,
                phoneVerified: user.phoneVerified
            }
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({
            error: process.env.NODE_ENV === 'development'
                ? error.message
                : 'Internal server error'
        });
    }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
    try {
        const { userId, purpose } = req.body;
        if (!userId || !purpose) {
            return res.status(400).json({ error: 'userId and purpose are required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Determine recipient based on purpose
        let recipient, method;
        if (purpose === 'email' && user.email) {
            recipient = user.email;
            method = 'email';
        } else if (purpose === 'phone' && user.phoneNumber) {
            recipient = user.phoneNumber;
            method = 'phone';
        } else if (purpose === 'login') {
            recipient = user.email || user.phoneNumber;
            method = user.email ? 'email' : 'phone';
        } else {
            return res.status(400).json({ error: 'No valid contact method for this purpose' });
        }

        // Delete previous OTPs for this method
        await UserVerification.deleteMany({ userId, type: method });

        // Send new OTP
        await sendOTP(user, purpose, recipient);

        res.status(200).json({
            message: 'OTP resent successfully',
            userId,
            contactMethod: method
        });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            error: process.env.NODE_ENV === 'development'
                ? error.message
                : 'Internal server error'
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { identifier, password, deviceToken } = req.body;

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

        // Check trusted device
        if (deviceToken && user.trustedDevices) {
            const now = new Date();
            for (const device of user.trustedDevices) {
                const isMatch = await bcrypt.compare(deviceToken, device.token);
                if (isMatch && device.expires > now) {
                    // Device is trusted - skip OTP
                    const token = generateToken(user);
                    return res.status(200).json({
                        message: 'Login successful',
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
                }
            }
        }

        // Determine contact method
        const recipient = user.email || user.phoneNumber;
        const method = user.email ? 'email' : 'phone';

        // Send login OTP
        await sendOTP(user, 'login', recipient);

        // Initialize OTP session
        req.session.otpSessionStart = Date.now();
        req.session.otpAttempts = 0;

        res.status(200).json({
            status: 'otp_required',
            message: 'OTP sent for verification',
            userId: user._id,
            contactMethod: method,
            isVerified: user.verified
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: process.env.NODE_ENV === 'development'
                ? error.message
                : 'Internal server error'
        });
    }
});

// Generate JWT token
function generateToken(user) {
    return jwt.sign(
        {
            id: user._id,
            username: user.username,
            email: user.email,
            phoneNumber: user.phoneNumber,
            verified: user.verified,
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

module.exports = router;