const mongoose = require('mongoose');

const chatroomSchema = new mongoose.Schema({
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    ],
    type: {
        type: String,
        enum: ['1v1', 'group'],
        required: true,
    },
    name: {
        type: String,
    },
    image: {
        type: String,
    },
    createAt: {
        type: Date,
        default: Date.now,
    },
    latestMessageAt: {
        type: Date,
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message', // Reference to the parent message
    },
});

module.exports = mongoose.model('Chatroom', chatroomSchema);
