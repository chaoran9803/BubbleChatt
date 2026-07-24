const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', async (req, res) => {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string' ||
        username.trim().length < 3 || password.length < 6) {
        return res.status(400).json({ error: 'Username must be 3+ chars, password 6+ chars' });
    }

    const existing = await User.findOne({ username: username.trim() });
    if (existing) {
        return res.status(409).json({ error: 'Username already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username: username.trim(), passwordHash });

    res.status(201).json({ token: signToken(user), username: user.username, userId: user._id });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json({ token: signToken(user), username: user.username, userId: user._id });
});

module.exports = router;
