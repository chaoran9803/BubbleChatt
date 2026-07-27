require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

// models
const connectDB = require('./db');
const { verifyToken } = require('./middleware/auth');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

// routing
const authRoutes = require('./routes/auth');
const friendsRoutes = require('./routes/friends');
const conversationsRoutes = require('./routes/conversations');

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

// check if server is running
app.get('/', (req, res) => {
    res.send('Server is running do not worry!!!!');
});

app.use('/auth', authRoutes);
app.use('/friends', friendsRoutes);
app.use('/conversations', conversationsRoutes);

const io = new Server(server, {
    cors: { origin: CLIENT_ORIGIN },
});

// authenticate every socket connection via the JWT issued at login
io.use((socket, next) => {
    try {
        const payload = verifyToken(socket.handshake.auth?.token || '');
        socket.data.userId = payload.sub;
        socket.data.username = payload.username;
        next();
    } catch {
        next(new Error('Authentication failed'));
    }
});

io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.data.username} (${socket.id})`);

    // join a room per conversation this user belongs to, so events stay scoped
    const conversations = await Conversation.find({ members: socket.data.userId }).select('_id');
    conversations.forEach((c) => socket.join(c._id.toString()));

    socket.on('chat message', async ({ conversationId, text }, ack) => {
        if (typeof text !== 'string' || !text.trim() || typeof conversationId !== 'string') return;

        const conversation = await Conversation.findOne({ _id: conversationId, members: socket.data.userId });
        if (!conversation) return; // not a member of this conversation, ignore

        const message = await Message.create({
            conversation: conversation._id,
            sender: socket.data.userId,
            text: text.trim(),
        });
        conversation.lastMessage = {
            text: message.text,
            sender: socket.data.userId,
            createdAt: message.createdAt,
        };
        await conversation.save();

        io.to(conversationId).emit('chat message', {
            id: message._id,
            conversationId,
            text: message.text,
            username: socket.data.username,
            userId: socket.data.userId,
            createdAt: message.createdAt,
        });
        if (typeof ack === 'function') ack({ ok: true });
    });

    // let a client join a room for a conversation it just created/opened this session
    socket.on('join conversation', async (conversationId) => {
        const conversation = await Conversation.findOne({ _id: conversationId, members: socket.data.userId });
        if (conversation) socket.join(conversationId);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.data.username} (${socket.id})`);
    });
});

const PORT = process.env.PORT || 3000;

connectDB()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    });
