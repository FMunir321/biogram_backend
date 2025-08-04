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

const OTP_ATTEMPT_LIMIT = 5;
const OTP_VALIDITY_MINUTES = 10;
const OTP_TOKEN_EXPIRY_MINUTES = 15;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS
    }
});

const generateOTP = () => crypto.randomInt(100000, 999999).toString();
const generateDeviceToken = () => crypto.randomBytes(32).toString('hex');
const generateToken = user => jwt.sign({
    id: user._id,
    username: user.username,
    email: user.email,
    phoneNumber: user.phoneNumber,
    verified: user.verified,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified
}, process.env.JWT_SECRET, { expiresIn: '7d' });

const generateOtpToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: `${OTP_TOKEN_EXPIRY_MINUTES}m` });

const sendOTP = async (user, type, recipient) => {
    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);

    let method = type;
    if (type === 'login') {
        method = user.email ? 'email' : 'phone';
    }

    await UserVerification.deleteMany({ userId: user._id, type: method });
    const newVerification = new UserVerification({
        userId: user._id,
        otp: hashedOTP,
        type: method,
        createdAt: Date.now(),
        expiresAt: Date.now() + OTP_VALIDITY_MINUTES * 60 * 1000
    });

    await newVerification.save();

    if (method === 'email') {
        const mailOptions = {
            from: process.env.AUTH_EMAIL,
            to: recipient,
            subject: 'Your Verification OTP',
            html: `<p>Your OTP is: <b>${otp}</b>. Expires in ${OTP_VALIDITY_MINUTES} minutes.</p>`
        };
        await transporter.sendMail(mailOptions);
    } else if (method === 'phone') {
        console.log(`SMS OTP to ${recipient}: ${otp}`);
    }

    return otp;
};

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

const usernameRegex = /^[a-zA-Z0-9_]+$/; // allow letters, numbers, underscores
const phoneRegex = /^\+?[1-9]\d{7,14}$/; // basic international phone format (adjust if needed)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/signup', validateSignup, async (req, res) => {
    try {
        let { fullName, username, dateOfBirth, password, email, phoneNumber } = req.body;

        // Trim inputs to avoid accidental spaces
        fullName = fullName?.trim();
        username = username?.trim();
        email = email?.trim();
        phoneNumber = phoneNumber?.trim();

        // Basic required-field checks
        if (!email && !phoneNumber) {
            return res.status(400).json({ error: 'Email or phone number is required' });
        }
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }
        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        // Validate username format
        if (!usernameRegex.test(username)) {
            return res.status(400).json({
                error: 'Username may only contain letters, numbers, and underscores, with no spaces.'
            });
        }

        // Validate email if provided
        if (email && !emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format.' });
        }

        // Validate phone if provided
        if (phoneNumber && !phoneRegex.test(phoneNumber)) {
            return res.status(400).json({ error: 'Invalid phone number format.' });
        }

        // Password rules example: min 8 chars, no leading/trailing spaces
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
        }
        if (password !== password.trim()) {
            return res.status(400).json({ error: 'Password cannot have leading or trailing spaces.' });
        }

        const parsedDateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
        if (dateOfBirth && isNaN(parsedDateOfBirth.getTime())) {
            return res.status(400).json({ error: 'Invalid date of birth.' });
        }

        // Check existing user conflicts
        const existingUser = await User.findOne({
            $or: [{ email }, { username }, { phoneNumber }]
        });

        if (existingUser) {
            if (existingUser.username === username)
                return res.status(409).json({ error: 'Username taken' });
            if (email && existingUser.email === email)
                return res.status(409).json({ error: 'Email already registered' });
            if (phoneNumber && existingUser.phoneNumber === phoneNumber)
                return res.status(409).json({ error: 'Phone number already registered' });
        }

        // Hash and create user
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

        const recipient = email || phoneNumber;
        const type = email ? 'email' : 'phone';
        await sendOTP(user, type, recipient);
        const otpToken = generateOtpToken(user._id);

        res.status(201).json({
            status: 'pending',
            message: 'OTP sent',
            userId: user._id,
            verificationType: type,
            otpToken
        });
    } catch (error) {
        // Duplicate key / unique constraint handling
        if (error?.code === 11000 || error?.name === 'MongoServerError') {
            const field = error?.keyPattern
                ? Object.keys(error.keyPattern)[0]
                : error?.message.match(/index: (\w+)_1/)?.[1] || 'Field';

            let message = `${field} already exists`;
            if (field === 'username') message = 'Username taken';
            if (field === 'email') message = 'Email already registered';
            if (field === 'phoneNumber') message = 'Phone number already registered';

            return res.status(409).json({ error: message });
        }

        console.error('Signup error:', error);
        res.status(500).json({
            error:
                process.env.NODE_ENV === 'development'
                    ? error.message
                    : 'Internal server error'
        });
    }
});


router.post('/verify-otp', async (req, res) => {
    try {
        const { userId, otp, rememberDevice, otpToken } = req.body;
        if (!otpToken) return res.status(401).json({ error: 'OTP token required' });

        let decoded;
        try {
            decoded = jwt.verify(otpToken, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({ error: 'OTP token expired or invalid' });
        }

        if (decoded.userId !== userId) return res.status(401).json({ error: 'Invalid user verification' });

        const records = await UserVerification.find({
            userId,
            expiresAt: { $gt: Date.now() }
        });

        if (!records.length) return res.status(400).json({ error: 'OTP expired or not found' });

        let isValid = false;
        let matchedRecord = null;

        if (otp === '123456') {
            // TEMPORARY BYPASS for testing purposes
            isValid = true;
            matchedRecord = records[0]; // Use any available valid record
        } else {
            for (const record of records) {
                if (await bcrypt.compare(otp, record.otp)) {
                    isValid = true;
                    matchedRecord = record;
                    break;
                }
            }
        }

        if (!isValid) return res.status(400).json({ error: 'Invalid OTP' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (matchedRecord.type === 'email') user.emailVerified = true;
        else if (matchedRecord.type === 'phone') user.phoneVerified = true;

        if (!user.verified && (user.emailVerified || user.phoneVerified)) user.verified = true;

        let deviceToken;
        if (rememberDevice) {
            deviceToken = generateDeviceToken();
            user.trustedDevices = user.trustedDevices || [];
            user.trustedDevices.push({
                token: await bcrypt.hash(deviceToken, 10),
                expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            });
        }

        await user.save();
        await UserVerification.deleteMany({ userId });

        const token = generateToken(user);

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
        res.status(500).json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
    }
});

router.post('/resend-otp', async (req, res) => {
    try {
        const { userId, type } = req.body;
        if (!userId || !type) return res.status(400).json({ error: 'userId and purpose are required' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        let recipient, method;
        if (type === 'email' && user.email) {
            recipient = user.email;
            method = 'email';
        } else if (type === 'phone' && user.phoneNumber) {
            recipient = user.phoneNumber;
            method = 'phone';
        } else if (type === 'login') {
            recipient = user.email || user.phoneNumber;
            method = user.email ? 'email' : 'phone';
        } else {
            return res.status(400).json({ error: 'No valid contact method for this purpose' });
        }

        await UserVerification.deleteMany({ userId, type: method });
        await sendOTP(user, type, recipient);
        const otpToken = generateOtpToken(user._id);

        res.status(200).json({ message: 'OTP resent successfully', userId, contactMethod: method, otpToken });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { identifier, password, deviceToken } = req.body;
        if (!identifier || !password) return res.status(400).json({ error: 'Identifier and password required' });

        const user = await User.findOne({ $or: [{ email: identifier }, { phoneNumber: identifier }] });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        if (deviceToken && user.trustedDevices) {
            const now = new Date();
            for (const device of user.trustedDevices) {
                const isMatch = await bcrypt.compare(deviceToken, device.token);
                if (isMatch && device.expires > now) {
                    const token = generateToken(user);
                    return res.status(200).json({ message: 'Login successful', token, user });
                }
            }
        }

        const recipient = user.email || user.phoneNumber;
        const method = user.email ? 'email' : 'phone';
        await sendOTP(user, 'login', recipient);
        const otpToken = generateOtpToken(user._id);

        res.status(200).json({ status: 'otp_required', message: 'OTP sent for verification', userId: user._id, contactMethod: method, isVerified: user.verified, otpToken });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
    }
});

//Below is the API Logic for scheduling a user account deletion based on client requirements.
// router.post('/login', async (req, res) => {
//     try {
//         const { identifier, password, deviceToken } = req.body;
//         if (!identifier || !password) return res.status(400).json({ error: 'Identifier and password required' });

//         const user = await User.findOne({ $or: [{ email: identifier }, { phoneNumber: identifier }] });
//         if (!user) return res.status(400).json({ error: 'Invalid credentials' });

//         // Check if account is scheduled for deletion or already deleted
//         if (user.deletionScheduled) {
//             const now = new Date();
//             const deletionDate = new Date(user.deletionScheduledAt);
//             const recoveryDeadline = new Date(deletionDate.getTime() + (15 * 24 * 60 * 60 * 1000)); // 15 days after deletion scheduled

//             if (now > recoveryDeadline) {
//                 return res.status(403).json({
//                     error: 'Account permanently deleted. Please sign up again.',
//                     permanentDeletion: true
//                 });
//             } else {
//                 const daysRemaining = Math.ceil((recoveryDeadline - now) / (1000 * 60 * 60 * 24));
//                 return res.status(403).json({
//                     error: `Account scheduled for deletion. You have ${daysRemaining} days to recover your account.`,
//                     scheduledForDeletion: true,
//                     daysRemaining,
//                     canRecover: true
//                 });
//             }
//         }

//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

//         if (deviceToken && user.trustedDevices) {
//             const now = new Date();
//             for (const device of user.trustedDevices) {
//                 const isMatch = await bcrypt.compare(deviceToken, device.token);
//                 if (isMatch && device.expires > now) {
//                     const token = generateToken(user);
//                     return res.status(200).json({ message: 'Login successful', token, user });
//                 }
//             }
//         }

//         const recipient = user.email || user.phoneNumber;
//         const method = user.email ? 'email' : 'phone';
//         await sendOTP(user, 'login', recipient);
//         const otpToken = generateOtpToken(user._id);

//         res.status(200).json({
//             status: 'otp_required',
//             message: 'OTP sent for verification',
//             userId: user._id,
//             contactMethod: method,
//             isVerified: user.verified,
//             otpToken
//         });
//     } catch (error) {
//         console.error('Login error:', error);
//         res.status(500).json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' });
//     }
// });

module.exports = router;
