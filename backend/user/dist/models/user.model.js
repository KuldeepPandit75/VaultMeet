import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
const userSchema = new mongoose.Schema({
    fullname: {
        firstname: {
            type: String,
            required: true,
            minlength: [3, "First name must be at least 3 characters long"],
        },
        lastname: {
            type: String,
            minlength: [3, "Last name must be at least 3 characters long"],
        },
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: [8, "Password must be at least 8 characters long"],
        select: false,
    },
    role: {
        type: String,
        enum: ["admin", "user"],
        default: "user",
    },
    socketId: {
        type: String,
    },
    username: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        required: true
    },
    banner: {
        type: String,
        default: ""
    },
    avatar: {
        type: String, // URL to profile picture
        default: "",
    },
    bio: {
        type: String,
        maxlength: 300,
        default: "",
    },
    location: {
        type: String,
        default: "",
    },
    college: {
        type: String,
        default: "",
    },
    skills: {
        type: String,
        default: "",
    },
    interests: {
        type: String,
        default: "",
    },
    social: {
        github: { type: String, default: "" },
        linkedin: { type: String, default: "" },
        x: { type: String, default: "" },
    },
    website: { type: String, default: "" },
    connections: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            status: {
                type: String,
                enum: ["pending", "connected"],
                default: "pending",
            },
        },
    ],
    hackathonsJoined: [
        {
            hackathonId: { type: mongoose.Schema.Types.ObjectId, ref: "Hackathon" },
            teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
            status: {
                type: String,
                enum: ["pending", "confirmed"],
                default: "confirmed",
            },
        },
    ],
    bookmarks: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hackathon",
        },
    ],
    notifications: [
        {
            type: {
                type: String, // e.g., 'connection_request', 'team_invite'
            },
            message: String,
            isRead: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now },
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    featuredProject: {
        title: { type: String, default: "" },
        description: { type: String, default: "" },
        link: { type: String, default: "" },
        techUsed: { type: [String], default: [] },
    },
    achievements: {
        type: String,
        default: "",
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
});
userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
    return token;
};
userSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};
userSchema.statics.hashPassword = async function (password) {
    return await bcrypt.hash(password, 10);
};
export const UserModel = mongoose.model("User", userSchema);
