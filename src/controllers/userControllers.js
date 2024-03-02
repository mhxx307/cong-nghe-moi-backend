const User = require('../models/user');
const argon2 = require('argon2');

const userControllers = {
    getAllUsers: async (req, res) => {
        const users = await User.find();
        res.status(200).json(users);
    },
    getUserById: async (req, res) => {
        const { id } = req.params;
        const user = await User.findById(id);
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
            const isPasswordValid = await argon2.verify(user.password, oldPassword);
            if (!isPasswordValid) {
                return res.status(400).json({ message: 'Old password is incorrect' });
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
    }
};

module.exports = userControllers;
