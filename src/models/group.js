const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  profilePic: {
    type: String,
    default: '',
  },
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Add other group-related fields as needed
});

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;