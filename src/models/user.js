const mongoose = require("mongoose");
const crypto = require("crypto");

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    profilePic: {
        type: String,
        default: "",
    },
    verify: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

// UserSchema.methods.createResetPasswordToken = () => {
//     const resetToken = crypto.randomBytes(32, this.toString('hex'));

//     crypto.createHash('sha256').update(resetToken).digest('hex');
// }

module.exports = mongoose.model("User", UserSchema);
