"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const roomSchema = new mongoose_1.default.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true,
    },
    participants: [
        {
            status: {
                type: String,
                enum: ["pending", "allowed", "banned"],
                required: true,
            },
            id: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        },
    ],
    adminId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    lastActive: {
        type: Date,
        default: Date.now,
    },
});
const Room = mongoose_1.default.model("Room", roomSchema);
exports.default = Room;
