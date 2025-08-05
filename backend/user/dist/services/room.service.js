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
exports.getRoomStats = exports.updateRoomActivity = exports.getExpiringRooms = exports.cleanupInactiveRooms = void 0;
const room_model_js_1 = __importDefault(require("../models/room.model.js"));
// Cleanup inactive rooms (should be called by a cron job)
const cleanupInactiveRooms = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const deletedRooms = yield room_model_js_1.default.deleteMany({
            lastActive: { $lt: sevenDaysAgo },
        });
        console.log(`Cleaned up ${deletedRooms.deletedCount} inactive rooms`);
        return deletedRooms.deletedCount;
    }
    catch (error) {
        console.error("Error cleaning up inactive rooms:", error);
        throw error;
    }
});
exports.cleanupInactiveRooms = cleanupInactiveRooms;
// Get rooms that are about to expire (for notifications)
const getExpiringRooms = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sixDaysAgo = new Date();
        sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
        const expiringRooms = yield room_model_js_1.default.find({
            lastActive: { $lt: sixDaysAgo },
        }).populate("participants.id", "fullname email");
        return expiringRooms;
    }
    catch (error) {
        console.error("Error getting expiring rooms:", error);
        throw error;
    }
});
exports.getExpiringRooms = getExpiringRooms;
// Update room activity
const updateRoomActivity = (roomId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const room = yield room_model_js_1.default.findOne({ roomId });
        if (room) {
            room.lastActive = new Date();
            yield room.save();
        }
    }
    catch (error) {
        console.error("Error updating room activity:", error);
        throw error;
    }
});
exports.updateRoomActivity = updateRoomActivity;
// Get room statistics
const getRoomStats = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalRooms = yield room_model_js_1.default.countDocuments();
        const activeRooms = yield room_model_js_1.default.countDocuments({
            lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
        });
        const inactiveRooms = yield room_model_js_1.default.countDocuments({
            lastActive: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Older than 7 days
        });
        return {
            totalRooms,
            activeRooms,
            inactiveRooms,
        };
    }
    catch (error) {
        console.error("Error getting room stats:", error);
        throw error;
    }
});
exports.getRoomStats = getRoomStats;
