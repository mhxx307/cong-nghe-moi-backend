const Group = require('../models/group.js');
const Chat = require('../models/chat.js');
const User = require('../models/user.js');

const chatControllers = {
    createGroup: async (req, res) => {
        try {
            const { name, members } = req.body;

            // Check if the group name is unique
            const existingGroup = await Group.findOne({ name });
            if (existingGroup) {
                return res
                    .status(400)
                    .json({ error: 'Group name already exists' });
            }

            // Create a new group
            const newGroup = new Group({
                name,
                members,
            });

            // Save the group to the database
            await newGroup.save();

            return res.status(201).json(newGroup);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    },
    start1v1Chat: async (req, res) => {
        try {
            const { senderId, receiverId, message } = req.body;

            // Check if both sender and receiver exist
            const sender = await User.findById(senderId);
            const receiver = await User.findById(receiverId);

            if (!sender || !receiver) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Create a new 1v1 chat
            const newChat = new Chat({
                sender: senderId,
                receiver: receiverId,
                message,
            });

            // Save the chat to the database
            await newChat.save();

            return res.status(201).json(newChat);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    },
};

module.exports = chatControllers;
