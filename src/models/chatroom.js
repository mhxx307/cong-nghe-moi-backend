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
});

module.exports = mongoose.model('Chatroom', chatroomSchema);
