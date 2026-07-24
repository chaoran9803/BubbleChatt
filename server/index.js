const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);

const {Server} = require('socket.io');

app.get('/', (req,res) => {
    res.send("bubbleChatt server is running");
})

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>{
    console.log(`Server listenting on port ${PORT}`);
})


// socket
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
    },
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // receiving message
    socket.on('chat message', (msg) => {
      io.emit('chat message', {
        id: Date.now(),
        text: msg.text,
        username: msg.username,
        timestamp: new Date().toISOString(),
      });
    });

    // username and join leave notices
    socket.on('join', (username) => {
        socket.data.username = username;   // stash data on the socket itself
        socket.broadcast.emit('system message', `${username} joined the chat`);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        if (socket.data.username) {
            socket.broadcast.emit('system message', `${socket.data.username} left`);
        }
    });
});
