const User = require('../models/user');
const argon2 = require('argon2');

const userControllers = {
    register: async (req, res) => {
        try {
            const { username, password, email } = req.body;
            const hash = await argon2.hash(password);
            const newUser = new User({
                username,
                password: hash,
                email,
            });
            const userCreated = await newUser.save();
            res.status(200).json(userCreated);
        } catch (err) {
            console.log(err);
        }
    },
    login: async (req, res) => {
        try {
            const user = await User.findOne({ email: req.body.email });
            if (!user) {
                return res.status(404).json('User not found');
            }

            const validPassword = await argon2.verify(
                user.password,
                req.body.password,
            );

            if (!validPassword) {
                return res.status(400).json('Wrong password');
            }

            const { password, ...others } = user._doc;

            res.status(200).json(others);
        } catch (error) {
            res.status(500).json(error.message);
        }
    },
};

module.exports = userControllers;
