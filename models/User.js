const e = require('express');
const mongoose = require('mongoose');
const schema = mongoose.Schema;

const UserSchema = new schema({
    name: String,
    email: String,
    password: String,
    verified: { type: Boolean, default: false }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;