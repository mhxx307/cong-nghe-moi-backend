const User = require('../models/user');
const UserOtp = require('../models/userotp');
const userOtp = require('../models/userotp');
const argon2 = require('argon2');
var speakeasy = require('speakeasy');
const nodemailer = require('nodemailer');

// let transporter = nodemailer.createTransport({
//     host: 'stmp-mail.outlook.com',
//     auth: {
//         user: process.env.EMAIL,
//         pass: process.env.PASSWORD,
//     },
// });

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: 'secondchancemarketvn@gmail.com', // generated ethereal user
        pass: 'oiwnlzuitfrtukut', // generated ethereal password
    },
    // tls: {
    //     rejectUnauthorized: false, // avoid NodeJs self signed certificate error
    // },
});

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

            await sendOtp(user, res);

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
    verifyOtp: async (req, res) => {
        try {
            let { userId, otp } = req.body;
            if (!userId || !otp) {
                throw Error('userId and otp are required');
            } else {
                const userOtpRecords = await UserOtp.find({
                    userId
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
                            await User.updateOne({ _id: userId }, { verify: true });
                            await UserOtp.deleteMany({ userId });
                            res.json({
                                status: 'SUCCESS',
                                message: 'OTP verified successfully',
                            })
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
                sendOtp({_id: userId, email}, res);
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

        const mailOptions = {
            from: 'MinhHoang',
            to: user.email,
            subject: 'OTP for your account',
            text: `Your OTP is ${otp}`,
        };

        const saltRounds = 10;

        const hashOTP = await argon2.hash(otp, saltRounds);
        const newUserOTP = new userOtp({
            userId: user._id.toString(),
            otp: hashOTP,
            createdAt: new Date(),
            expiresAt: new Date() + 36000000,
        });

        await newUserOTP.save();
        await transporter.sendMail(mailOptions);
        res.json({
            status: 'PENDING',
            message: 'OTP sent successfully',
            data: {
                userId: user._id,
                email: user.email,
            },

        });

    }
    catch (err) {
        console.log(err);
    }
}



module.exports = userControllers;
