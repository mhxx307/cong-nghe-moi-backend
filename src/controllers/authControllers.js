const User = require('../models/user');
const argon2 = require('argon2');

const userControllers = {
    register: async (req, res) => {
        try {
            const { username, password, email } = req.body;
            const hash = await argon2.hash(password);
            if (username == "" || email == "" || password == "") {
                res.status(200).json("Failed")
            } else if (!/[a-zA-Z ]*$/.test(username)) {
                res.status(200).json("Failed")
            } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
                res.status(200).json("Failed")
            } else if (password.length < 8) {
                res.status(200).json("Failed")
            } else {
                User.findOne({ email }).then(result => {
                    if (result.length) {
                        res.status(200).json("Failed")
                    } else {
                        const newUser = new User({
                            username,
                            password: hash,
                            email,
                        });
                        const userCreated = newUser.save();
                        res.status(200).json(userCreated);
                    }
                }).catch(err => {
                    console.log(err);
                    res.status(200).json("Failed")
                })
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

            const otpSecret = speakeasy.generateSecret({ length: 6, name: 'MyApp' }).base32;
            const otp = speakeasy.totp({ secret: otpSecret, encoding: 'base32' });

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
          await User.updateOne({ email }, { password: hashedPassword, otpSecret: null });
      
          res.status(200).json({ message: 'Password reset successful' });
        } catch (error) {
          console.error(error);
          res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};

module.exports = userControllers;
