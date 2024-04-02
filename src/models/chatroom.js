const mongoose = require('mongoose');

const chatroomSchema = new mongoose.Schema({
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  type: {
    type: String,
    enum: ['1v1', 'group'],
    required: true
  }
});

module.exports = mongoose.model('Chatroom', chatroomSchema);