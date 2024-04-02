const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String,
            default: '',
        },
        profilePic: {
            type: String,
            default: '',
        },
        verify: {
            type: Boolean,
            default: false,
        },
        friends: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        friendRequests: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        friendRequestsReceived: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],   
    },
    { timestamps: true },
);

module.exports = mongoose.model('User', UserSchema);
