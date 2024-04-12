const User = require('../models/user');
const argon2 = require('argon2');
const notificationControllers = require('./notificationControllers');
const { NOTIFICATION_TYPES } = require('../constants/enum');

const userControllers = {
    getAllUsers: async (req, res) => {
        const users = await User.find()
            .populate('friends', 'username profilePic')
            .populate('friendRequests', 'username profilePic')
            .populate('friendRequestsReceived', 'username profilePic');
        res.status(200).json(users);
    },
    getUserById: async (req, res) => {
        const { id } = req.params;
        const user = await User.findById(id)
            .populate('friends', 'username profilePic')
            .populate('friendRequests', 'username profilePic')
            .populate('friendRequestsReceived', 'username profilePic');
        console.log('user', user);
        res.status(200).json(user);
    },
    updateUserById: async (req, res) => {
        try {
            const { id } = req.params;
            const { username, email, profilePic } = req.body;

            const user = await User.findByIdAndUpdate(id, {
                username,
                email,
                profilePic,
            });

            res.send(user);
        } catch (err) {
            console.log(err);
        }
    },
    getUsersByNameAndPhoneNumberAndEmail: async (req, res) => {
        try {
            const { searchTerm } = req.query;
            const users = await User.find({
                $or: [
                    { username: { $regex: searchTerm, $options: 'i' } },
                    { phoneNumber: { $regex: searchTerm, $options: 'i' } },
                    { email: { $regex: searchTerm, $options: 'i' } },
                ],
            });
            res.status(200).json(users);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: error.message });
        }
    },
    changePassword: async (req, res) => {
        try {
            const { id } = req.params;
            const { oldPassword, newPassword } = req.body;

            const user = await User.findById(id);
            const isPasswordValid = await argon2.verify(
                user.password,
                oldPassword,
            );
            if (!isPasswordValid) {
                return res
                    .status(400)
                    .json({ message: 'Old password is incorrect' });
            }

            const hashedPassword = await argon2.hash(newPassword);
            const updatedUser = await User.findByIdAndUpdate(id, {
                password: hashedPassword,
            });

            res.status(200).json(updatedUser);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: error.message });
        }
    },
    sendFriendRequest: async (req, res) => {
        try {
            const { senderId, receiverId } = req.body;
            const sender = await User.findById(senderId);
            const receiver = await User.findById(receiverId);

            // console.log('Sender:', sender);
            // console.log('Receiver:', receiver);

            if (!sender || !receiver) {
                throw new Error('Sender or receiver not found');
            }

            // Check if receiver is already a friend
            if (sender.friends.includes(receiverId)) {
                return res
                    .status(400)
                    .json({ message: 'User is already a friend' });
            }

            // Check if friend request already exists
            if (sender.friendRequests.includes(receiverId)) {
                return res
                    .status(400)
                    .json({ message: 'Friend request already sent' });
            }

            sender.friendRequests.push(receiverId);
            await sender.save();

            receiver.friendRequestsReceived.push(senderId);
            await receiver.save();

            // add notification to receiver
            await notificationControllers.sendNotification({
                senderId: senderId,
                receiverId: receiverId,
                type: NOTIFICATION_TYPES.FRIEND_REQUEST,
                message: `${sender.username} sent you a friend request`,
            });

            return res
                .status(200)
                .json({ message: 'Friend request sent successfully' });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
    acceptFriendRequest: async (req, res) => {
        try {
            const { userId, requesterId } = req.body;
            const user = await User.findById(userId);
            const requester = await User.findById(requesterId);

            if (!user || !requester) {
                return res
                    .status(400)
                    .json({ message: 'User or requester not found' });
            }

            // Check if friend request exists
            if (!user.friendRequestsReceived.includes(requesterId)) {
                return res
                    .status(400)
                    .json({ message: 'Friend request not found' });
            }

            // Add each other to friends list
            user.friends.push(requesterId);
            requester.friends.push(userId);

            // Remove friend request
            user.friendRequestsReceived = user.friendRequestsReceived.filter(
                (id) => id.toString() !== requesterId.toString(),
            );
            requester.friendRequests = requester.friendRequests.filter(
                (id) => id.toString() !== userId.toString(),
            );

            await user.save();
            await requester.save();

            // add notification to requester
            await notificationControllers.sendNotification({
                senderId: userId,
                receiverId: requesterId,
                type: NOTIFICATION_TYPES.FRIEND_REQUEST_ACCEPTED,
                message: `${user.username} accepted your friend request`,
            });

            return res
                .status(200)
                .json({ message: 'Friend request accepted successfully' });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
    getFriendList: async (req, res) => {
        try {
            const { userId } = req.params;
            const user = await User.findById(userId).populate(
                'friends',
                'username profilePic',
            );
            return res.status(200).json(user.friends);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
    getFriendRequests: async (req, res) => {
        try {
            const { userId } = req.params;
            const user = await User.findById(userId).populate(
                'friendRequests',
                'username profilePic',
            );
            return res.status(200).json(user.friendRequests);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
    rejectedFriendRequest: async (req, res) => {
        try {
            const { userId, requesterId } = req.body;
            console.log('userId:', userId);
            console.log('requesterId:', requesterId);
            const user = await User.findById(userId);
            const requester = await User.findById(requesterId);

            console.log('User:', user);
            console.log('Requester:', requester);

            if (!user || !requester) {
                return res
                    .status(400)
                    .json({ message: 'User or requester not found' });
            }

            // Check if friend request exists
            if (!user.friendRequestsReceived.includes(requesterId)) {
                return res
                    .status(400)
                    .json({ message: 'Friend request not found' });
            }

            // Remove friend request
            user.friendRequestsReceived = user.friendRequestsReceived.filter(
                (id) => id.toString() !== requesterId.toString(),
            );
            await user.save();

            // Remove friend requests from requester
            requester.friendRequests = requester.friendRequests.filter(
                (id) => id.toString() !== userId.toString(),
            );
            await requester.save();

            // add notification to requester
            await notificationControllers.sendNotification({
                senderId: userId,
                receiverId: requesterId,
                type: NOTIFICATION_TYPES.FRIEND_REQUEST_REJECTED,
                message: `${user.username} rejected your friend request`,
            });

            return res
                .status(200)
                .json({ message: 'Friend request rejected successfully' });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
    getFriendRequestsReceived: async (req, res) => {
        try {
            const { userId } = req.params;
            const user = await User.findById(userId).populate(
                'friendRequestsReceived',
                'username profilePic',
            );
            return res.status(200).json(user.friendRequestsReceived);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
};

module.exports = userControllers;
