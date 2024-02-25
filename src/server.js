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

    socket.on('message', (data) => {
        console.log('Received message:', data);
        // socket.emit('newChat', data);
        socket.broadcast.emit('newChat', data);
    });
});

initRouter(app);
connectDatabase();

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
