const express = require('express');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Accepted friends list (either direction)
router.get('/', async (req, res) => {
    const accepted = await FriendRequest.find({
        status: 'accepted',
        $or: [{ from: req.userId }, { to: req.userId }],
    }).populate('from to', 'username');

    const friends = accepted.map((r) => {
        const other = r.from._id.toString() === req.userId ? r.to : r.from;
        return { userId: other._id, username: other.username };
    });

    res.json({ friends });
});

// Pending requests involving me
router.get('/requests', async (req, res) => {
    const incoming = await FriendRequest.find({ to: req.userId, status: 'pending' }).populate('from', 'username');
    const outgoing = await FriendRequest.find({ from: req.userId, status: 'pending' }).populate('to', 'username');

    res.json({
        incoming: incoming.map((r) => ({ requestId: r._id, userId: r.from._id, username: r.from.username })),
        outgoing: outgoing.map((r) => ({ requestId: r._id, userId: r.to._id, username: r.to.username })),
    });
});

// Send a friend request by username
router.post('/request', async (req, res) => {
    const { username } = req.body || {};
    if (typeof username !== 'string' || !username.trim()) {
        return res.status(400).json({ error: 'Username is required' });
    }

    const target = await User.findOne({ username: username.trim() });
    if (!target) {
        return res.status(404).json({ error: 'User not found' });
    }
    if (target._id.toString() === req.userId) {
        return res.status(400).json({ error: "You can't add yourself" });
    }

    const existing = await FriendRequest.findOne({
        $or: [
            { from: req.userId, to: target._id },
            { from: target._id, to: req.userId },
        ],
    });
    if (existing) {
        if (existing.status === 'accepted') {
            return res.status(409).json({ error: 'Already friends' });
        }
        if (existing.status === 'pending') {
            return res.status(409).json({ error: 'A request is already pending' });
        }
        // previously declined: revive as a fresh pending request from the current requester
        existing.from = req.userId;
        existing.to = target._id;
        existing.status = 'pending';
        await existing.save();
        return res.status(201).json({ requestId: existing._id });
    }

    const request = await FriendRequest.create({ from: req.userId, to: target._id });
    res.status(201).json({ requestId: request._id });
});

router.post('/:id/accept', async (req, res) => {
    const request = await FriendRequest.findOne({ _id: req.params.id, to: req.userId, status: 'pending' });
    if (!request) {
        return res.status(404).json({ error: 'Request not found' });
    }
    request.status = 'accepted';
    await request.save();
    res.json({ ok: true });
});

router.post('/:id/decline', async (req, res) => {
    const request = await FriendRequest.findOne({ _id: req.params.id, to: req.userId, status: 'pending' });
    if (!request) {
        return res.status(404).json({ error: 'Request not found' });
    }
    request.status = 'declined';
    await request.save();
    res.json({ ok: true });
});

module.exports = router;
