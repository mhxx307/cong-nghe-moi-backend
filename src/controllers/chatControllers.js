const Group = require('../models/group.js');
const Chat = require('../models/chat.js');
const User = require('../models/user.js');

const chatControllers = {
    createGroup: async (req, res) => {
        try {
            const { name, members, senderId } = req.body;

            // Check if the group name is unique
            // const existingGroup = await Group.findOne({ name });
            // if (existingGroup) {
            //     return res
            //         .status(400)
            //         .json({ error: 'Group name already exists' });
            // }

            // Create a new group
            const newGroup = new Group({
                name,
                members,
                admin: senderId,
            });
            // Save the group to the database
            await newGroup.save();

            // create a new chat for the group
            const newChat = new Chat({
                group: newGroup._id,
                message: 'Welcome to the group!',
                sender: senderId,
            });
            // Save the chat to the database
            await newChat.save();

            // new chat details
            const sender = await User.findById(senderId);
            const { password: senderPassword, ...restSender } = sender._doc;
            const chatDetails = {
                ...newChat._doc,
                group: newGroup,
                sender: restSender,
                members,
            };

            return res.status(201).json(chatDetails);
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

            return res.status(201).json({
                ...newChat._doc,
                receiver,
                sender,
            });
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

            // find group where the user is a member & find chat where the group is the group
            const groups = await Group.find({ members: userId });
            const groupChats = await Promise.all(
                groups.map(async (group) => {
                    const chat = await Chat.findOne({ group: group._id });
                    return chat;
                }),
            );

            // merge 1v1 chats and group chats
            const allChats = [...chats, ...groupChats];

            // find receiver, group and sender details
            const chatDetails = await Promise.all(
                allChats.map(async (chat) => {
                    if (chat.group) {
                        const group = await Group.findById(chat.group);
                        const sender = await User.findById(chat.sender);
                        const { password: senderPassword, ...restSender } =
                            sender._doc;
                        // details of the members of the group
                        const members = await Promise.all(
                            group.members.map(async (memberId) => {
                                const member = await User.findById(memberId);
                                const { password: memberPassword, ...restMember } =
                                    member._doc;
                                return restMember;
                            }
                            ),
                        );

                        return {
                            ...chat._doc,
                            group,
                            sender: restSender,
                            members,
                        };
                    }

                    const receiver = await User.findById(chat.receiver);
                    const sender = await User.findById(chat.sender);
                    const { password: receiverPassword, ...restReceiver } =
                        receiver._doc;
                    const { password: senderPassword, ...restSender } = sender._doc;

                    return {
                        ...chat._doc,
                        receiver: restReceiver,
                        sender: restSender,
                    };
                }),
            );

            // filter out duplicate chats
            const filteredChatDetails = chatDetails.filter((chat, index, self) => {
                const receiverId = chat.receiver?._id;
                const senderId = chat.sender?._id;
                const group = chat.group?._id;
                const receiverIndex = self.findIndex(
                    (c) => c.receiver?._id?.toString() === receiverId?.toString(),
                );
                const senderIndex = self.findIndex(
                    (c) => c.sender?._id?.toString() === senderId?.toString(),
                );
                const groupIndex = self.findIndex(
                    (c) => c.group?._id?.toString() === group?.toString(),
                );
                return (
                    receiverIndex === index ||
                    senderIndex === index ||
                    groupIndex === index
                );
            });

            // remove duplicate chat group - same group id
            const chatListWithoutGroups = filteredChatDetails.filter(
                (chat) => !chat.group,
            );       

            const chatListWithGroups = filteredChatDetails.filter(
                (chat) => chat.group,
            );        

            const uniqueChatList = chatListWithGroups.filter(
                (chat, index, self) =>
                    index ===
                    self.findIndex(
                        (c) => c.group._id === chat.group._id,
                    ),
            );       

            const finalChatList = [...chatListWithoutGroups, ...uniqueChatList];     
            
             // Extracting the latest message and putting it at the beginning
            // const latestMessageIndex = finalChatList.findIndex(chat => chat.timestamp === Math.max(...finalChatList.map(chat => chat.timestamp)));
            // const latestMessage = finalChatList.splice(latestMessageIndex, 1);
            // const sortedChatList = [...latestMessage, ...finalChatList];

            return res.status(200).json(finalChatList);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    },
    getChatMessages: async (req, res) => {
        try {
            const { senderId, receiverId, groupId } = req.query;

            // Find all chats
            let messages;
            if (groupId) {
                messages = await Chat.find({ group: groupId });
            }
            if (senderId && receiverId) {
                messages = await Chat.find({
                    $or: [
                        { sender: senderId, receiver: receiverId },
                        { sender: receiverId, receiver: senderId },
                    ],
                });
            }

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
    startGroupChat: async (req, res) => {
        try {
            const { groupId, message, senderId } = req.body;

            // Check if the group exists
            const group = await Group.findById(groupId);
            if (!group) {
                return res.status(404).json({ error: 'Group not found' });
            }

            // Check if the user is a member of the group
            if (!group.members.includes(senderId)) {
                return res.status(403).json({ error: 'Forbidden' });
            }

            // Create a new chat for the group
            const newChat = new Chat({
                group: groupId,
                message,
                sender: senderId,
            });

            // Save the chat to the database
            const newChatSaved = await newChat.save();

            // get details
            const sender = await User.findById(senderId);
            const { password: senderPassword, ...restSender } = sender._doc;
            const members = await Promise.all(
                group.members.map(async (memberId) => {
                    const member = await User.findById
                    (memberId);
                    const { password: memberPassword, ...restMember } =
                        member._doc;
                    return restMember;
                }
                ),
            );

            const chatDetails = {
                ...newChatSaved._doc,
                group,
                sender: restSender,
                members,
            };

            return res.status(201).json(chatDetails);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        } 
    },
    updateGroup: async (req, res) => {
        try {
            const { groupId } = req.params;
            const {  name, members, profilePic } = req.body;

            // Check if the group exists
            const group = await Group.findById(groupId);
            if (!group) {
                return res.status(404).json({ error: 'Group not found' });
            }

            // Update the group
            group.name = name;
            group.members = members;
            group.profilePic = profilePic;
            await group.save();

            return res.status(200).json(group);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    },
    deleteGroup: async (req, res) => {
        try {
            const { groupId } = req.params;

            // Check if the group exists
            const group = await Group.findById(groupId);
            if (!group) {
                return res.status(404).json({ error: 'Group not found' });
            }

            // Delete the group
            await Group.findByIdAndDelete(groupId);

            return res.status(204).json();
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    },
    getGroupChatMessages: async (req, res) => {
        try {
            const groupId = req.params.groupId;

            // Find all chats
            console.log("groupId", groupId); // undefined
            const messages = await Chat.find({ group: groupId });

            console.log("messages", messages);

            // find group and sender details
            const chatDetails = await Promise.all(
                messages.map(async (message) => {
                    const group = await Group.findById(message.group);
                    const sender = await User.findById(message.sender);
                    const { password: senderPassword, ...restSender } =
                        sender._doc;
                    // details of the members of the group
                    const members = await Promise.all(
                        group.members.map(async (memberId) => {
                            const member = await User.findById(memberId);
                            const { password: memberPassword, ...restMember } =
                                member._doc;
                            return restMember;
                        }
                        ),
                    );

                    return {
                        ...message._doc,
                        group,
                        sender: restSender,
                        members,
                    };
                }),
            );

            return res.status(200).json(chatDetails);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
        
};

module.exports = chatControllers;
