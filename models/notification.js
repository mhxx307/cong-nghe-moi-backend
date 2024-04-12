// notification models
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: [
                'friendRequest',
                'friendRequestAccepted',
                'message',
                'friendRequestRejected',
            ],
        },
        message: {
            type: String,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
