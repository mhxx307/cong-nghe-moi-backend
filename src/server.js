require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const initRouter = require('./configs/routerConfig');
const connectDatabase = require('./configs/connectDatabase');
const { Server } = require('socket.io');
const http = require('http');

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

io.on('connection', (socket) => {
    console.log('A user connected: ', socket.id);
    // Additional socket event listeners and handling can be added here

    socket.on('send-message', (data) => {
        console.log('Received message:', data);
        socket.broadcast.emit('receive-message', data);
    });

    socket.on('create-room', (data) => {
        console.log('Received create room event:', data);
        socket.broadcast.emit('created-room', data);
    });

    socket.on('send-friend-request', (data) => {
        console.log('Received friend request:', data);
        socket.broadcast.emit('received-friend-request', data);
    });

    socket.on('accept-friend-request', (data) => {
        console.log('Received accept friend request:', data);
        socket.broadcast.emit('accepted-friend-request', data);
    });

    socket.on('sort-room', (data) => {
        console.log('Received sort room event:', data);
        socket.broadcast.emit('sorted-room', data);
    });
});

initRouter(app);
connectDatabase();

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
