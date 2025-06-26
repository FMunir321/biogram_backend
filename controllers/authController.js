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

// Send verification email
const sendVerificationEmail = ({ _id, email }) => {
    const currentUrl = process.env.CURRENT_URL;
    const uniqueString = uuidv4() + _id;

    const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: 'Verify your email',
        html: `<p>Click the link below to verify your email:</p>
               <p>This link <b>expires in 6 hours</b>.</p>
               <a href="${currentUrl}/api/auth/verify/${_id}/${uniqueString}">Verify Email</a>`
    };

    bcrypt.hash(uniqueString, 10)
        .then(hashedUniqueString => {
            const newVerification = new UserVerification({
                userId: _id,
                uniqueString: hashedUniqueString,
                createdAt: Date.now(),
                expiresAt: Date.now() + 21600000 // 6 hours
            });

            newVerification.save()
                .then(() => transporter.sendMail(mailOptions))
                .catch(console.error);
        });
};

// Signup
router.post('/signup', (req, res) => {
    let { name, email, password } = req.body;
    name = name?.trim() || '';
    email = email?.trim() || '';
    password = password?.trim() || '';

    // Validation checks
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    if (!/^[a-zA-Z0-9]+$/.test(name)) {
        return res.status(400).json({ error: 'Name can only contain alphanumeric characters' });
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
                                message: "Verification email sent"
                            });
                        })
                        .catch(err => {
                            console.error('Error saving user:', err);
                            res.status(500).json({ error: 'Internal server error' });
                        });
                });
        })
        .catch(err => {
            console.error('Error checking existing user:', err);
            res.status(500).json({ error: 'Internal server error' });
        });
});

// Email verification
router.get('/verify/:userId/:uniqueString', (req, res) => {
    const { userId, uniqueString } = req.params;

    UserVerification.findOne({ userId })
        .then(record => {
            if (!record) {
                return res.status(400).json({ error: 'Invalid verification link' });
            }

            if (record.expiresAt < Date.now()) {
                // Delete expired records
                UserVerification.deleteOne({ userId })
                    .then(() => User.deleteOne({ _id: userId }))
                    .then(() => {
                        res.redirect(
                            '/api/auth/verified?error=true&message=Verification%20expired'
                        );
                    })
                    .catch(console.error);
                return;
            }

            bcrypt.compare(uniqueString, record.uniqueString)
                .then(isMatch => {
                    if (!isMatch) {
                        return res.status(400).json({ error: 'Invalid verification link' });
                    }

                    User.updateOne({ _id: userId }, { verified: true })
                        .then(() => UserVerification.deleteOne({ userId }))
                        .then(() => res.redirect('/api/auth/verified'))
                        .catch(err => {
                            console.error('Error updating user:', err);
                            res.status(500).json({ error: 'Internal server error' });
                        });
                })
                .catch(err => {
                    console.error('Error comparing strings:', err);
                    res.status(500).json({ error: 'Internal server error' });
                });
        })
        .catch(err => {
            console.error('Error finding verification record:', err);
            res.status(500).json({ error: 'Internal server error' });
        });
});

// Verification status
router.get('/verified', (req, res) => {
    const { error, message } = req.query;

    if (error) {
        return res.status(400).json({ error: decodeURIComponent(message) });
    }

    res.status(200).json({
        message: 'Email verified successfully! You can now login.'
    });
});

// Resend verification email
router.post('/resend-verification', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    User.findOne({ email })
        .then(user => {
            if (!user) return res.status(400).json({ error: 'User not found' });
            if (user.verified) {
                return res.status(400).json({ error: 'Email already verified' });
            }

            sendVerificationEmail(user);
            res.status(200).json({ message: 'Verification email resent' });
        })
        .catch(err => {
            console.error('Error resending email:', err);
            res.status(500).json({ error: 'Internal server error' });
        });
});

// Signin
router.post('/signin', (req, res) => {
    let { email, password } = req.body;
    email = email?.trim() || '';
    password = password?.trim() || '';

    if (!email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    User.findOne({ email })
        .then(user => {
            if (!user) return res.status(400).json({ error: 'Invalid credentials' });
            if (!user.verified) {
                return res.status(400).json({ error: 'Email not verified' });
            }

            bcrypt.compare(password, user.password)
                .then(isMatch => {
                    if (!isMatch) {
                        return res.status(400).json({ error: 'Invalid credentials' });
                    }

                    res.status(200).json({
                        message: 'Signin successful',
                        user: {
                            id: user._id,
                            name: user.name,
                            email: user.email
                        }
                    });
                })
                .catch(err => {
                    console.error('Password comparison error:', err);
                    res.status(500).json({ error: 'Internal server error' });
                });
        })
        .catch(err => {
            console.error('Error finding user:', err);
            res.status(500).json({ error: 'Internal server error' });
        });
});

module.exports = router;