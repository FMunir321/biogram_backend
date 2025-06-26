const express = require('express');
const router = express.Router();
const User = require('../models/User');
const UserVerification = require('../models/UserVerification');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Email transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS
    }
});

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email with OTP
const sendVerificationEmail = (user) => {
    const otp = generateOTP();
    const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: user.email,
        subject: 'Verify your email with OTP',
        html: `<p>Your email verification OTP is:</p>
               <h2>${otp}</h2>
               <p>This OTP <b>expires in 10 minutes</b>.</p>`
    };

    // Hash OTP before saving
    bcrypt.hash(otp, 10)
        .then(hashedOTP => {
            // Delete any existing OTP for this user
            UserVerification.deleteMany({ userId: user._id })
                .then(() => {
                    const newVerification = new UserVerification({
                        userId: user._id,
                        otp: hashedOTP,
                        createdAt: Date.now(),
                        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
                    });

                    return newVerification.save();
                })
                .then(() => {
                    transporter.sendMail(mailOptions)
                        .then(() => console.log(`OTP sent to ${user.email}`))
                        .catch(err => console.error('Error sending email:', err));
                })
                .catch(err => console.error('Error saving OTP:', err));
        });
};

// Signup
router.post('/signup', (req, res) => {
    let { name, email, password } = req.body;
    name = name?.trim() || '';
    email = email?.trim() || '';
    password = password?.trim() || '';

    // Validation
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    if (!/^[a-zA-Z0-9]+$/.test(name)) {
        return res.status(400).json({ error: 'Name must be alphanumeric' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    User.findOne({ email })
        .then(existingUser => {
            if (existingUser) {
                return res.status(400).json({ error: 'User already exists' });
            }

            bcrypt.hash(password, 10)
                .then(hashedPassword => {
                    const newUser = new User({
                        name,
                        email,
                        password: hashedPassword,
                        verified: false
                    });

                    newUser.save()
                        .then(user => {
                            sendVerificationEmail(user);
                            res.status(201).json({
                                status: "pending",
                                message: "OTP sent to email",
                                userId: user._id
                            });
                        })
                        .catch(err => res.status(500).json({ error: 'Error saving user' }));
                });
        })
        .catch(err => res.status(500).json({ error: 'Server error' }));
});

// Verify OTP
router.post('/verify-otp', (req, res) => {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
        return res.status(400).json({ error: 'User ID and OTP are required' });
    }

    UserVerification.findOne({ userId })
        .then(record => {
            if (!record) {
                return res.status(400).json({ error: 'OTP not found or expired' });
            }

            // Check expiration
            if (record.expiresAt < Date.now()) {
                UserVerification.deleteOne({ _id: record._id });
                return res.status(400).json({ error: 'OTP expired' });
            }

            // Verify OTP
            bcrypt.compare(otp, record.otp)
                .then(isMatch => {
                    if (!isMatch) {
                        return res.status(400).json({ error: 'Invalid OTP' });
                    }

                    // Update user verification status
                    User.updateOne({ _id: userId }, { verified: true })
                        .then(() => {
                            // Delete verification record
                            UserVerification.deleteOne({ _id: record._id });
                            res.status(200).json({ message: 'Email verified successfully' });
                        })
                        .catch(err => res.status(500).json({ error: 'Error verifying user' }));
                });
        })
        .catch(err => res.status(500).json({ error: 'Server error' }));
});

// Resend OTP
router.post('/resend-otp', (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    User.findById(userId)
        .then(user => {
            if (!user) {
                return res.status(400).json({ error: 'User not found' });
            }
            if (user.verified) {
                return res.status(400).json({ error: 'Email already verified' });
            }

            sendVerificationEmail(user);
            res.status(200).json({ message: 'New OTP sent' });
        })
        .catch(err => res.status(500).json({ error: 'Server error' }));
});

// Signin
router.post('/signin', (req, res) => {
    let { email, password } = req.body;
    email = email?.trim() || '';
    password = password?.trim() || '';

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    User.findOne({ email })
        .then(user => {
            if (!user) return res.status(400).json({ error: 'Invalid credentials' });

            // Check verification status
            if (!user.verified) {
                return res.status(403).json({
                    error: 'Email not verified',
                    userId: user._id
                });
            }

            // Verify password
            bcrypt.compare(password, user.password)
                .then(isMatch => {
                    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

                    res.status(200).json({
                        message: 'Signin successful',
                        user: {
                            id: user._id,
                            name: user.name,
                            email: user.email
                        }
                    });
                });
        })
        .catch(err => res.status(500).json({ error: 'Server error' }));
});

module.exports = router;