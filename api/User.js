const express = require('express');
const router = express.Router();

// mongoDB user model
const User = require('../models/User');

//password handling
const bcrypt = require('bcrypt');

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
                            password: hashedPassword
                        });

                        newUser.save()
                            .then(user => {
                                res.status(201).json({
                                    message: 'User created successfully',
                                    user: {
                                        id: user._id,
                                        name: user.name,
                                        email: user.email
                                    }
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
            })
            .catch(err => {
                console.error('Error finding user:', err);
                res.status(500).json({ error: 'Internal server error' });
            });
    }
})

module.exports = router;