const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    isGroup: { type: Boolean, default: false },
    name: { type: String, trim: true, maxlength: 40 },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    lastMessage: {
        text: String,
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: Date,
    },
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
