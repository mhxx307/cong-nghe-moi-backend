const Chatroom = require('../models/Chatroom');
const Message = require('../models/Message');

const chatControllers = {
    createChatRoom: async (req, res) => {
        try {
            const { members, type, name, image } = req.body;

            if (type === '1v1') {
                if (members.length !== 2) {
                    return res
                        .status(400)
                        .json({ message: '1v1 chatroom must have 2 members' });
                }

                // Check if the chatroom already exists
                const existingChatroom = await Chatroom.findOne({
                    members: { $all: members, $size: 2 },
                });
                if (existingChatroom) {
                    return res.status(200).json(existingChatroom);
                }

                const chatroom = new Chatroom({
                    members,
                    type,
                });
                const savedChatroom = await chatroom.save();
                const populatedChatroom = await Chatroom.findById(
                    savedChatroom._id,
                ).populate('members', 'username profilePic');

                return res.status(200).json(populatedChatroom);
            }

            if (type === 'group') {
                if (members.length < 3) {
                    return res.status(400).json({
                        message: 'Group chatroom must have at least 3 members',
                    });
                }

                const chatroom = new Chatroom({
                    members,
                    type,
                    name,
                    image,
                });
                const savedChatroom = await chatroom.save();
                const populatedChatroom = await Chatroom.findById(
                    savedChatroom._id,
                ).populate('members', 'username profilePic');

                return res.status(200).json(populatedChatroom);
            }
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
    getChatroomById: async (req, res) => {
        try {
            const { chatroomId } = req.params;
            const chatroom = await Chatroom.findById(chatroomId).populate(
                'members',
                'username profilePic',
            );
            return res.status(200).json(chatroom);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
    getAllMessagesInRoom: async (req, res) => {
        try {
            const { roomId } = req.params;
            const messages = await Message.find({ room: roomId })
                .populate('sender', 'username profilePic')
                .populate('receiver', 'username profilePic')
                .populate('room', 'members');

            console.log('Messages:', messages);
            return res.status(200).json(messages);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
    getAllRoomByUserId: async (req, res) => {
        try {
            const { userId } = req.params;
            const chatRooms = await Chatroom.find({ members: userId }).populate(
                'members',
                'username profilePic',
            );
            return res.status(200).json(chatRooms);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
    inviteToGroupChat: async (req, res) => {
        try {
            const { userId, chatroomId } = req.body;
            const chatroom = await Chatroom.findById(chatroomId);
            if (!chatroom) {
                return res.status(404).json({ message: 'Chatroom not found' });
            }
            if (!chatroom.members.includes(userId)) {
                chatroom.members.push(userId);
                const savedChatRoom = await chatroom.save();
                return res.status(200).json(savedChatRoom);
            } else {
                return res
                    .status(400)
                    .json({ message: 'User already in chatroom' });
            }
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
    sendMessage: async (req, res) => {
        try {
            const { senderId, receiverId, content, images, roomId } = req.body;
            const message = new Message({
                sender: senderId,
                receiver: receiverId,
                content,
                images,
                room: roomId,
            });
            const messageSaved = await message.save();
            const populatedMessage = await Message.findById(messageSaved._id)
                .populate('sender', 'username profilePic')
                .populate('receiver', 'username profilePic')
                .populate('room', 'members');

            return res.status(200).json(populatedMessage);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
    sendMessageToGroup: async (req, res) => {
        try {
            const { senderId, roomId, content, images } = req.body;
            // Check if the sender is a member of the group
            const chatroom = await Chatroom.findById(roomId);
            if (!chatroom || !chatroom.members.includes(senderId)) {
                return res
                    .status(400)
                    .json({ message: 'You are not a member of this group' });
            }

            // Create the message
            const message = new Message({
                sender: senderId,
                room: roomId,
                content,
                images,
            });
            const savedMessage = await message.save();

            return res.status(200).json(savedMessage);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
};

module.exports = chatControllers;
