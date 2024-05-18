const Chatroom = require('../models/chatroom');
const Message = require('../models/message');
const User = require('../models/user');

const chatControllers = {
    createChatRoom: async (req, res) => {
        try {
            const { members, type, name, image, admin } = req.body;

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
                    admin: admin,
                });
                const savedChatroom = await chatroom.save();
                const populatedChatroom = await Chatroom.findById(
                    savedChatroom._id,
                )
                    .populate('members', 'username profilePic')
                    .populate('admin', 'username profilePic');

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
                .populate({
                    path: 'room',
                    select: 'members', // Select the 'members' field in the 'room' model
                    populate: {
                        path: 'members',
                        select: 'username profilePic', // Populate the 'members' field in the 'room' model with the 'username' and 'profilePic' fields
                    },
                })
                .populate({
                    path: 'replyTo',
                    populate: {
                        path: 'sender',
                        select: 'username profilePic',
                    },
                })
                .populate('from', 'username profilePic');

            return res.status(200).json(messages);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
    getAllRoomByUserId: async (req, res) => {
        try {
            const { userId } = req.params;
            const chatRooms = await Chatroom.find({ members: userId })
                .populate('members', 'username profilePic')
                .populate('admin', 'username profilePic')
                .sort({ latestMessageAt: -1 });

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
            const {
                senderId,
                receiverId,
                content,
                images,
                roomId,
                replyTo,
                from,
                file,
            } = req.body;

            // check is friend
            const chatRoom = await Chatroom.findById(roomId);
            if (!chatRoom) {
                return res.status(404).json({ message: 'Chatroom not found' });
            }

            if (!chatRoom.members.includes(senderId)) {
                return res.status(403).json({
                    message: 'You are not a member of this chatroom',
                });
            }

            const message = new Message({
                sender: senderId,
                receiver: receiverId,
                content,
                images,
                room: roomId,
                replyTo,
                from,
                file,
            });
            const messageSaved = await message.save();
            const populatedMessage = await Message.findById(messageSaved._id)
                .populate('sender', 'username profilePic')
                .populate('receiver', 'username profilePic')
                .populate('room', 'members')
                .populate({
                    path: 'replyTo',
                    populate: {
                        path: 'sender',
                        select: 'username profilePic',
                    },
                })
                .populate('from', 'username profilePic');
            console.log('populatedMessage', populatedMessage);

            await updateChatroomLastMessage(roomId, messageSaved.timestamp);

            return res.status(200).json(populatedMessage);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
    deleteMessage: async (req, res) => {
        try {
            const { messageId } = req.params;
            const message = await Message.findById(messageId);
            if (!message) {
                return res.status(404).json({ message: 'Message not found' });
            }
            await Message.deleteOne({ _id: messageId });
            return res.status(200).json({ message: 'Message deleted' });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
    updateChatGroup: async (req, res) => {
        try {
            const { chatroomId, name, image, members, adminId, newAdminId } =
                req.body;
            const chatroom = await Chatroom.findById(chatroomId);
            if (!chatroom) {
                return res.status(404).json({ message: 'Chatroom not found' });
            }
            if (chatroom.admin.toString() !== adminId) {
                return res.status(403).json({
                    message: 'Only admin can update chatroom',
                });
            }
            chatroom.name = name;
            chatroom.image = image;
            chatroom.members = members;

            if (newAdminId) {
                chatroom.admin = newAdminId;
            }

            const savedChatroom = await chatroom.save();
            const populatedChatroom = await Chatroom.findById(savedChatroom._id)
                .populate('members', 'username profilePic')
                .populate('admin', 'username profilePic');

            return res.status(200).json(populatedChatroom);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
    removeChatroom: async (req, res) => {
        try {
            const { chatroomId, admin } = req.body;
            const chatroom = await Chatroom.findById(chatroomId);
            if (!chatroom) {
                return res.status(404).json({ message: 'Chatroom not found' });
            }
            if (chatroom.admin.toString() !== admin) {
                return res.status(403).json({
                    message: 'Only admin can remove chatroom',
                });
            }
            await Chatroom.deleteOne({ _id: chatroomId });

            return res.status(200).json({ message: 'Chatroom removed' });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
};

async function updateChatroomLastMessage(chatroomId, timestamp) {
    try {
        // update the lastMessageAt field in the chatroom
        const chatroom = await Chatroom.findById(chatroomId);
        chatroom.latestMessageAt = timestamp;
        await chatroom.save();
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = chatControllers;
