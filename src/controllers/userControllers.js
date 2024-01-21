const User = require('../models/user');
const argon2 = require('argon2');

const userControllers = {
    getAllUsers: async (req, res) => {
        const users = await User.find();
        res.send(users);
    },
    getUserById: async (req, res) => {
        const { id } = req.params;
        const user = await User.findById(id);
        res.send(user);
    },
    register: async (req, res) => {
        try {
            const { username, password, email } = req.body;
            const hash = await argon2.hash(password);
            const newUser = new User({
                username,
                password: hash,
                email,
            });
            await newUser.save();
            res.send('Register success!');
        } catch (err) {
            console.log(err);
        }
    },
    login: async (req, res) => {
        try {
            const { username, password } = req.body;
            const user = await User.findOne({ username });
            if (!user) {
                res.send('User not found!');
            }
            const validPassword = await argon2.verify(user.password, password);
            if (!validPassword) {
                res.send('Wrong password!');
            }
            // return user created
            res.send({
                user: user,
                message: 'Login success!',
            });
        } catch (err) {
            console.log(err);
        }
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
