import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        // username: String,
        // email: String,
        // isActive: Boolean
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true
        },
        email: {
            type: String,
            unique: true,
            required: true,
            lowecase: true
        },
        password: {
            type: String,
            required: [true, "Password is required"]
        }

    }, {timestamps: true}
);

export const User = mongoose.model("User", userSchema);