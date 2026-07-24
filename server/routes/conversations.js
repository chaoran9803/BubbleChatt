const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

async function areAllFriendsOf(userId, otherIds) {
    if (otherIds.length === 0) return true;
    const accepted = await FriendRequest.find({
        status: 'accepted',
        $or: [{ from: userId }, { to: userId }],
    });
    const friendIds = new Set(
        accepted.map((r) => (r.from.toString() === userId ? r.to.toString() : r.from.toString())),
    );
    return otherIds.every((id) => friendIds.has(id));
}

// List my conversations, newest activity first
router.get('/', async (req, res) => {
    const conversations = await Conversation.find({ members: req.userId })
        .populate('members', 'username')
        .sort({ updatedAt: -1 });

    res.json({
        conversations: conversations.map((c) => ({
            id: c._id,
            isGroup: c.isGroup,
            name: c.name,
            members: c.members.map((m) => ({ userId: m._id, username: m.username })),
            lastMessage: c.lastMessage,
        })),
    });
});

// Create a 1:1 or group conversation with friends only
router.post('/', async (req, res) => {
    const { memberIds, name } = req.body || {};
    if (!Array.isArray(memberIds) || memberIds.length === 0) {
        return res.status(400).json({ error: 'memberIds must be a non-empty array' });
    }
    const uniqueIds = [...new Set(memberIds.map(String))].filter((id) => id !== req.userId);
    if (uniqueIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
        return res.status(400).json({ error: 'Invalid member id' });
    }

    const friendCheck = await areAllFriendsOf(req.userId, uniqueIds);
    if (!friendCheck) {
        return res.status(403).json({ error: 'You can only start a chat with friends' });
    }

    const isGroup = uniqueIds.length > 1;
    if (isGroup && (typeof name !== 'string' || !name.trim())) {
        return res.status(400).json({ error: 'Group chats require a name' });
    }

    const members = [req.userId, ...uniqueIds];

    if (!isGroup) {
        const existing = await Conversation.findOne({
            isGroup: false,
            members: { $all: members, $size: 2 },
        }).populate('members', 'username');
        if (existing) {
            return res.status(200).json({
                id: existing._id,
                isGroup: existing.isGroup,
                name: existing.name,
                members: existing.members.map((m) => ({ userId: m._id, username: m.username })),
            });
        }
    }

    const conversation = await Conversation.create({
        isGroup,
        name: isGroup ? name.trim() : undefined,
        members,
    });
    await conversation.populate('members', 'username');

    res.status(201).json({
        id: conversation._id,
        isGroup: conversation.isGroup,
        name: conversation.name,
        members: conversation.members.map((m) => ({ userId: m._id, username: m.username })),
    });
});

// Message history for one conversation
router.get('/:id/messages', async (req, res) => {
    const conversation = await Conversation.findOne({ _id: req.params.id, members: req.userId });
    if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await Message.find({ conversation: conversation._id })
        .sort({ createdAt: 1 })
        .populate('sender', 'username');

    res.json({
        messages: messages.map((m) => ({
            id: m._id,
            text: m.text,
            username: m.sender.username,
            userId: m.sender._id,
            createdAt: m.createdAt,
        })),
    });
});

module.exports = router;
