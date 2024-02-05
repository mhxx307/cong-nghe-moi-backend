const  mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userOtpSchema = new Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300,
    },
    expiresAt: {
        type: Date,
        default: Date.now,
        expires: 300,
    },
});

const UserOtp = mongoose.model("UserOtp", userOtpSchema);

module.exports = UserOtp;  