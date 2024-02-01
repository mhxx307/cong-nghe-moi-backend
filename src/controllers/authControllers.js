const User = require('../models/user');
const argon2 = require('argon2');
var speakeasy = require('speakeasy');

const userControllers = {
    register: async (req, res) => {
        try {
            const { username, password, email } = req.body;
            const hash = await argon2.hash(password);

            if (username == '' || email == '' || password == '') {
                res.status(200).json('input required');
            } else if (!/[a-zA-Z ]*$/.test(username)) {
                res.status(200).json('username failed');
            } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
                res.status(200).json('email failed');
            } else if (password.length < 8) {
                res.status(200).json('password failed');
            }

            try {
                const result = await User.findOne({ email });

                if (result) {
                    res.status(200).json('Email already exists');
                } else {
                    const newUser = new User({
                        username,
                        password: hash,
                        email,
                    });
                    const userCreated = await newUser.save();
                    const { password, ...others } = userCreated._doc;
                    res.status(200).json(others);
                }
            } catch (error) {
                console.log(error);
                res.status(500).json(error.message);
            }
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
    forgotPassword: async (req, res, next) => {
        const { email } = req.body;

        try {
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const otpSecret = speakeasy.generateSecret({
                length: 6,
                name: 'MyApp',
            }).base32;
            console.log('otpSecret', otpSecret);

            const otp = speakeasy.totp({
                secret: otpSecret,
                encoding: 'base32',
            });
            console.log('otp', otp);

            await User.updateOne({ email }, { otpSecret });

            const mailOptions = {
                from: 'your-email@gmail.com',
                to: email,
                subject: 'Password Reset OTP',
                text: `Your OTP for password reset is: ${otp}`,
            };

            await transporter.sendMail(mailOptions);

            res.status(200).json({ message: 'OTP sent successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    resetPassword: async (req, res, next) => {
        const { email, otp, newPassword } = req.body;

        try {
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const isValidOTP = speakeasy.totp.verify({
                secret: user.otpSecret,
                encoding: 'base32',
                token: otp,
            });

            if (!isValidOTP) {
                return res.status(400).json({ message: 'Invalid OTP' });
            }

            const hashedPassword = await argon2.hash(newPassword, 10);
            await User.updateOne(
                { email },
                { password: hashedPassword, otpSecret: null },
            );

            res.status(200).json({ message: 'Password reset successful' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
};

module.exports = userControllers;
