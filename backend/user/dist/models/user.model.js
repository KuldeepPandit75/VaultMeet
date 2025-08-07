"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userSchema = new mongoose_1.default.Schema({
    fullname: {
        firstname: {
            type: String,
            required: true,
            minlength: [3, "First name must be at least 3 characters long"],
        },
        lastname: {
            type: String,
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
    otp: {
        value: {
            type: String,
        },
        expiration: {
            type: Date,
        },
        tries: {
            type: Number,
            min: 0,
        },
        attempts: {
            type: Number,
            min: 0,
        },
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
            user: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
            status: {
                type: String,
                enum: ["pending", "connected"],
                default: "pending",
            },
        },
    ],
    hackathonsJoined: [
        {
            hackathonId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Hackathon" },
            teamId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Team" },
            status: {
                type: String,
                enum: ["pending", "confirmed"],
                default: "confirmed",
            },
        },
    ],
    bookmarks: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
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
            senderId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
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
        techUsed: { type: String, default: "" },
    },
    achievements: {
        type: String,
        default: "",
    },
    points: {
        type: Number,
        default: 0,
        min: 0,
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
});
userSchema.methods.generateAuthToken = function () {
    const token = jsonwebtoken_1.default.sign({ _id: this._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
    return token;
};
userSchema.methods.comparePassword = function (password) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcrypt_1.default.compare(password, this.password);
    });
};
userSchema.statics.hashPassword = function (password) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcrypt_1.default.hash(password, 10);
    });
};
const User = mongoose_1.default.model("User", userSchema);
exports.default = User;
