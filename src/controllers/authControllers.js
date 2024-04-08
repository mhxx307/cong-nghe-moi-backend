const sendEmail = require('../configs/sendEmail');
const User = require('../models/user');
const UserOtp = require('../models/userotp');
const userOtp = require('../models/userotp');
const argon2 = require('argon2');
var speakeasy = require('speakeasy');

const userControllers = {
    register: async (req, res) => {
        try {
            const { username, password, email } = req.body;
            const hash = await argon2.hash(password);

            if (username == '' || email == '' || password == '') {
                res.status(400).json({
                    message: 'All fields are required',
                });
            } else if (!/[a-zA-Z ]*$/.test(username)) {
                res.status(400).json({
                    message:
                        "Username can't contain special characters or numbers",
                });
            } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
                res.status(400).json({
                    message: 'Invalid email format',
                });
            } else if (password.length < 8) {
                res.status(400).json({
                    message: 'Password must be at least 8 characters',
                });
            }

            try {
                const result = await User.findOne({ email });

                if (result) {
                    res.status(400).json({
                        message: 'Email already exists',
                    });
                } else {
                    const newUser = new User({
                        username,
                        password: hash,
                        email,
                    });
                    const userCreated = await newUser.save();
                    await sendOtp(userCreated, res);
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
            const user = await User.findOne({ email: req.body.email })
                .populate('friendRequestsReceived', 'username profilePic')
                .populate('friendRequests', 'username profilePic')
                .populate('friends', 'username profilePic');

            if (!user) {
                return res.status(404).json({
                    message: 'User not found',
                });
            }

            if (!user.verify) {
                return res.status(400).json({
                    message: 'User not verified',
                });
            }

            const validPassword = await argon2.verify(
                user.password,
                req.body.password,
            );

            if (!validPassword) {
                return res.status(400).json({
                    message: 'Wrong password',
                });
            }

            const { password, ...others } = user._doc;

            res.status(200).json({
                message: 'Login successful',
                user: others,
            });
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

            await sendOtp(user, res);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    resetPassword: async (req, res, next) => {
        const { userId, newPassword } = req.body;
        console.log(newPassword);

        try {
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const hashedPassword = await argon2.hash(newPassword, 10);
            await User.updateOne({ _id: userId }, { password: hashedPassword });

            res.status(200).json({ message: 'Password reset successful' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    verifyOtp: async (req, res) => {
        try {
            let { userId, otp } = req.body;
            if (!userId || !otp) {
                throw Error('userId and otp are required');
            } else {
                const userOtpRecords = await UserOtp.find({
                    userId,
                });
                if (userOtpRecords.length <= 0) {
                    throw Error('OTP not found');
                } else {
                    const { expiresAt } = userOtpRecords[0];
                    const hashOTP = userOtpRecords[0].otp;

                    //bug to đùng
                    if (expiresAt > Date.now()) {
                        await UserOtp.deleteMany({ userId });
                        console.log('expired');
                        res.json({
                            status: 'EXPIRED',
                            message: 'OTP expired',
                        });
                        //
                    } else {
                        const validOTP = await argon2.verify(hashOTP, otp);

                        console.log(validOTP);
                        if (validOTP) {
                            await User.updateOne(
                                { _id: userId },
                                { verify: true },
                            );
                            await UserOtp.deleteMany({ userId });
                            const user = await User.findById(userId)
                                .populate(
                                    'friendRequestsReceived',
                                    'username profilePic',
                                )
                                .populate(
                                    'friendRequests',
                                    'username profilePic',
                                )
                                .populate('friends', 'username profilePic');
                            res.json({
                                status: 'SUCCESS',
                                message: 'OTP verified successfully',
                                user: user,
                            });
                        } else {
                            throw Error('Invalid OTP');
                        }
                    }
                }
            }
        } catch (err) {
            console.log(err);
            res.status(500).json(err.message);
        }
    },
    resendOtp: async (req, res) => {
        try {
            const { userId, email } = req.body;

            if (!userId || !email) {
                throw Error('User not found');
            } else {
                await UserOtp.deleteMany({ userId });
                sendOtp({ _id: userId, email }, res);
            }
        } catch (err) {
            console.log(err);
            res.status(500).json(err.message);
        }
    },
};

const sendOtp = async (user, res) => {
    try {
        console.log(user);
        const otp = `${Math.floor(100000 + Math.random() * 900000)}`;

        const saltRounds = 10;

        const hashOTP = await argon2.hash(otp, saltRounds);
        const newUserOTP = new userOtp({
            userId: user._id.toString(),
            otp: hashOTP,
            createdAt: new Date(),
            expiresAt: new Date() + 36000000,
        });

        await newUserOTP.save();
        await sendEmail(user.email, 'OTP Verification', `Your OTP is ${otp}`);

        res.json({
            status: 'PENDING',
            message: 'OTP sent successfully',
            data: {
                userId: user._id,
                email: user.email,
            },
        });
    } catch (err) {
        console.log(err);
    }
};

module.exports = userControllers;
