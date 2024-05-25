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

let users = [];

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

    socket.on('delete-message', (data) => {
        console.log('Received delete message event:', data);
        socket.broadcast.emit('deleted-message', data);
    });

    socket.on('update-group', (data) => {
        console.log('Received update group event:', data);
        socket.broadcast.emit('updated-group', data);
    });

    socket.on('leave-group', (data) => {
        console.log('Received leave group event:', data);
        socket.broadcast.emit('left-group', data);
    });

    socket.on('unfriend', (data) => {
        console.log('Received unfriend event:', data);
        socket.broadcast.emit('unfriended', data);
    });

    // call video
    socket.on('join', ({ userId }) => {
        console.log('User joined:', userId);
        // check if user already exists in the users array
        const user = users.find((user) => user.userId === userId);
        if (user) {
            user.socketId = socket.id;
        } else {
            users.push({ userId, socketId: socket.id });
        }
    });

    socket.on('call-request', ({ caller, recipient }) => {
        console.log('Caller:', caller);
        console.log('Recipient:', recipient);
        // Find recipient's socket ID based on their user ID
        const recipientSocket = users.find(
            (user) => user.userId === recipient._id,
        );
        console.log('Recipient socket:', recipientSocket);
        if (recipientSocket) {
            // Emit call received event to the recipient
            io.to(recipientSocket.socketId).emit('call-received', { caller });
        }
    });

    socket.on('accept-call', ({ caller, recipient }) => {
        console.log('Accepted call from:', caller);
        console.log('Recipient:', recipient);
        // Find caller's socket ID based on their user ID
        const callerSocket = users.find((user) => user.userId === caller._id);
        console.log('Caller socket:', callerSocket);
        if (callerSocket) {
            // Emit call accepted event to the caller
            io.to(callerSocket.socketId).emit('call-accepted', {
                recipient,
                caller,
            });
        }
    });

    socket.on('reject-call', ({ caller, recipient }) => {
        console.log('Rejected call from:', caller);
        console.log('Recipient:', recipient);
        // Find caller's socket ID based on their user ID
        const callerSocket = users.find((user) => user.userId === caller._id);
        console.log('Caller socket:', callerSocket);
        if (callerSocket) {
            // Emit call rejected event to the caller
            io.to(callerSocket.socketId).emit('call-rejected');
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});

initRouter(app);
connectDatabase();

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
