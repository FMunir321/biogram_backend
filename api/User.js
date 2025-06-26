const express = require('express');
const router = express.Router();

// mongoDB user model
const User = require('../models/User');

// mongoDB user verification model
const UserVerification = require('../models/UserVerification');


//email handling
const nodemailer = require('nodemailer');
//unique string generation
const { v4: uuidv4 } = require('uuid');
//environment variables
require('dotenv').config();

//password handling
const bcrypt = require('bcrypt');

// nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS
    }
});

// testing successful connection
transporter.verify((error, success) => {
    if (error) {
        console.error('Error connecting to email service:', error);
    } else {
        console.log('Email service is ready to send messages');
    }
});

//Signup
router.post('/signup', (req, res) => {
    console.log('Signup request received11');
    let { name, email, password } = req.body;
    name = name ? name.trim() : '';
    email = email ? email.trim() : '';
    password = password ? password.trim() : '';

    if (!name || !email || !password) {
        res.status(400).json({
            error: 'All fields are required'
        });
    } else if (!/^[a-zA-Z0-9]+$/.test(name)) {
        res.status(400).json({
            error: 'Name can only contain alphanumeric characters'
        });
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        res.status(400).json({
            error: 'Invalid email format'
        });
    } else if (password.length < 6) {
        res.status(400).json({
            error: 'Password must be at least 6 characters long'
        });
    } else {
        // Check if user already exists
        User.findOne({ email: email })
            .then(existingUser => {
                if (existingUser) {
                    return res.status(400).json({ error: 'User already exists' });
                } else {
                    // Create new user
                    const saltRounds = 10;
                    bcrypt.hash(password, saltRounds).then(hashedPassword => {
                        const newUser = new User({
                            name: name,
                            email: email,
                            password: hashedPassword,
                            verified: false
                        });

                        newUser.save()
                            .then(user => {
                                // handle account verification
                                sendVerificationEmail(user, res);

                                // res.status(201).json({
                                //     message: 'User created successfully',
                                //     user: {
                                //         id: user._id,
                                //         name: user.name,
                                //         email: user.email,
                                //         verified: false
                                //     }
                                // });
                                res.status(201).json({
                                    status: "pending",
                                    message: "verification email send"
                                });
                            })
                            .catch(err => {
                                console.error('Error saving user:', err);
                                res.status(500).json({ error: 'Internal server error' });
                            });
                    });
                }
            })
            .catch(err => {
                console.error('Error checking existing user:', err);
                res.status(500).json({ error: 'Internal server error' });
            });
    }


})

// send verification email
const sendVerificationEmail = ({ _id, email }) => {
    console.log('sendVerificationEmail called with:', email);
    const currentUrl = process.env.CURRENT_URL;
    const uniqueString = uuidv4() + _id;
    const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: 'Verify your email',
        html: `<p>Click the link below to verify your email:</p><p>This link <b> expires in 6 hours </b>.</p>
                   <a href="${currentUrl}/api/user/verify/${_id}/${uniqueString}">Verify Email</a>`
    };
    const saltRounds = 10;
    bcrypt.hash(uniqueString, saltRounds)
        .then(hashedUniqueString => {
            const newVerification = new UserVerification({
                userId: _id,
                uniqueString: hashedUniqueString,
                createdAt: Date.now(),
                expiresAt: Date.now() + 6 * 60 * 60 * 1000 // 6 hours from now
            });
            newVerification.save()
                .then(() => {
                    transporter.sendMail(mailOptions)
                        .then(() => {
                            console.log('Verification email sent successfully');
                        })
                        .catch(err => {
                            console.error('Error sending verification email:', err);
                        });
                })
                .catch(err => {
                    console.error('Error saving verification document:', err);
                });
        });
}

// Verify email
router.get('/verify/:userId/:uniqueString', (req, res) => {
    let { userId, uniqueString } = req.params;
    UserVerification.findOne({ userId: userId })
        .then(result => {
            if (!result) {
                // user verification record not found
                return res.status(400).json({ error: 'Invalid verification link' });
            }

            const { expiresAt, uniqueString: hashedUniqueString } = result;
            if (expiresAt < Date.now()) {
                // Verification expired
                UserVerification.deleteOne({ userId: userId })
                    .then(() => {
                        User.deleteOne({ _id: userId })
                            .then(() => {
                                console.log('Verification expired. Please sign up again.');
                                res.redirect('/api/verified/error=true&message=Verification%20expired');
                            })
                            .catch(err => {
                                console.error('Error deleting user:', err);
                                res.status(500).json({ error: 'Internal server error' });
                            });
                    })
                    .catch(err => {
                        console.error('Error deleting verification record:', err);
                        res.status(500).json({ error: 'Internal server error' });
                    });
            } else {
                // valid record found so we validate the unique string
                bcrypt.compare(uniqueString, hashedUniqueString)
                    .then(isMatch => {
                        if (isMatch) {
                            // unique string matches, so we update the user record
                            User.updateOne({ _id: userId }, { verified: true })
                                .then(() => {
                                    // delete the verification record
                                    UserVerification.deleteOne({ userId: userId })
                                        .then(() => {
                                            console.log('User verified successfully');
                                            res.redirect('/api/verified');
                                        })
                                        .catch(err => {
                                            console.error('Error deleting verification record:', err);
                                            res.status(500).json({ error: 'Internal server error' });
                                        });
                                })
                                .catch(err => {
                                    console.error('Error updating user record:', err);
                                    res.status(500).json({ error: 'Internal server error' });
                                });
                        } else {
                            // unique string does not match
                            res.status(400).json({ error: 'Invalid verification link' });
                        }
                    })
                    .catch(err => {
                        console.error('Error comparing unique strings:', err);
                        res.status(500).json({ error: 'Internal server error' });
                    });
            }
        })
        .catch(err => {
            console.error('Error finding verification record:', err);
            res.status(500).json({ error: 'Internal server error' });
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
            if (!user) {
                return res.status(400).json({ error: 'User does not exist' });
            }
            if (user.verified) {
                return res.status(400).json({ error: 'Email is already verified' });
            }
            // Resend verification email
            sendVerificationEmail(user);
            res.status(200).json({ message: 'Verification email resent' });
        })
        .catch(err => {
            console.error('Error resending verification email:', err);
            res.status(500).json({ error: 'Internal server error' });
        });
});

//verified page route
router.get('/verified', (req, res) => {
    res.status(200).json({
        message: 'Email verified successfully! You can now login.'
    });
});

//Signin
router.post('/signin', (req, res) => {
    let { email, password } = req.body;
    email = email ? email.trim() : '';
    password = password ? password.trim() : '';
    if (!email || !password) {
        res.status(400).json({
            error: 'All fields are required'
        });
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        res.status(400).json({
            error: 'Invalid email format'
        });
    } else {
        // Check if user exists
        User.findOne({ email: email })
            .then(user => {
                if (!user) {
                    return res.status(400).json({ error: 'User does not exist' });
                } else {
                    if (!user.verified) {
                        return res.status(400).json({ error: 'Email not verified' });
                    } else {
                        // Compare passwords
                        bcrypt.compare(password, user.password)
                            .then(isMatch => {
                                if (isMatch) {
                                    res.status(200).json({
                                        message: 'Signin successful',
                                        user: {
                                            id: user._id,
                                            name: user.name,
                                            email: user.email
                                        }
                                    });
                                } else {
                                    res.status(400).json({ error: 'Invalid password' });
                                }
                            })
                            .catch(err => {
                                console.error('Error comparing passwords:', err);
                                res.status(500).json({ error: 'Internal server error' });
                            });

                    }

                }
            })
            .catch(err => {
                console.error('Error finding user:', err);
                res.status(500).json({ error: 'Internal server error' });
            });
    }
})

module.exports = router;