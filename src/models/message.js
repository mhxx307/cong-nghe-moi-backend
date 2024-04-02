const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // required: true,
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chatroom',
    },
    content: {
        type: String,
        required: true,
    },
    images: [
        {
            type: String, // You can store the URLs of the images
        },
    ],
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
