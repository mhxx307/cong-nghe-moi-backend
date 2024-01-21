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
            const { username, password, email } = req.body;
            const hash = await argon2.hash(password);
            const user = await User.findByIdAndUpdate(id, {
                username,
                password: hash,
                email,
            });
            res.send(user);
        } catch (err) {
            console.log(err);
        }
    },
};

module.exports = userControllers;
