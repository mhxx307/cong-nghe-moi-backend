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
    getAllChatRooms: async (req, res) => {
        try {
            const { userId } = req.params;

            // Find all groups where the user is a member
            const groups = await Group.find({ members: userId });

            // Find all 1v1 chats where the user is the sender or receiver
            const chats = await Chat.find({
                $or: [{ sender: userId }, { receiver: userId }],
            });

            return res.status(200).json({ groups, chats });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    },
    getAllExistingChats: async (req, res) => {
        try {
            const { userId } = req.params;

            // Find all 1v1 chats where the user is the sender or receiver
            const chats = await Chat.find({
                $or: [{ sender: userId }, { receiver: userId }],
            });

            // find receiver and sender details
            const chatDetails = await Promise.all(
                chats.map(async (chat) => {
                    const receiver = await User.findById(chat.receiver);
                    const sender = await User.findById(chat.sender);
                    return {
                        ...chat._doc,
                        receiver,
                        sender,
                    };
                }),
            );

            return res.status(200).json(chatDetails);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    },
    getChatMessages: async (req, res) => {
        try {
            const { senderId, receiverId } = req.query;

            // Find all 1v1 chats where the user is the sender or receiver
            const messages = await Chat.find({
                $or: [
                    { sender: senderId, receiver: receiverId },
                    { sender: receiverId, receiver: senderId },
                ],
            });

            // find receiver and sender details
            const chatDetails = await Promise.all(
                messages.map(async (message) => {
                    const receiver = await User.findById(message.receiver);
                    const sender = await User.findById(message.sender);
                    const { password: receiverPassword, ...restReceiver } =
                        receiver._doc;
                    const { password: senderPassword, ...restSender } =
                        sender._doc;

                    return {
                        ...message._doc,
                        receiver: restReceiver,
                        sender: restSender,
                    };
                }),
            );

            return res.status(200).json(chatDetails);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    },
};

module.exports = chatControllers;
