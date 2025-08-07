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
exports.getPendingRequests = exports.manualCleanup = exports.updateRoomActivity = exports.getUserRooms = exports.getRoomDetails = exports.deleteRoom = exports.rejectJoinRequest = exports.approveJoinRequest = exports.joinRoomRequest = exports.checkRoomPermission = exports.createRoom = void 0;
const room_model_js_1 = __importDefault(require("../models/room.model.js"));
const user_model_js_1 = __importDefault(require("../models/user.model.js"));
const room_service_js_1 = require("../services/room.service.js");
// Generate a unique room ID
const generateRoomId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
// Check if user can join room (admin and allowed participants)
const canJoinRoom = (roomId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const room = yield room_model_js_1.default.findOne({ roomId });
        if (!room) {
            return { canJoin: false, message: "Room not found" };
        }
        // Check if user is the admin
        if (room.adminId.toString() === userId.toString()) {
            return { canJoin: true, room: room };
        }
        // Check if user is an allowed participant
        const allowedParticipant = room.participants.find((p) => p.id.toString() === userId.toString() && p.status === "allowed");
        if (allowedParticipant) {
            return { canJoin: true, room: room };
        }
        // Check if user is a pending participant
        const pendingParticipant = room.participants.find((p) => p.id.toString() === userId.toString() && p.status === "pending");
        if (pendingParticipant) {
            return { canJoin: false, message: "Your join request is pending approval" };
        }
        // Check if user is banned
        const bannedParticipant = room.participants.find((p) => p.id.toString() === userId.toString() && p.status === "banned");
        if (bannedParticipant) {
            return { canJoin: false, message: "You are banned from this room" };
        }
        return { canJoin: false, message: "You are not authorized to join this room" };
    }
    catch (error) {
        console.error("Error checking room permissions:", error);
        return { canJoin: false, message: "Error checking room permissions" };
    }
});
// Check if user is admin of the room
// const isRoomAdmin = async (roomId: string, userId: string): Promise<boolean> => {
//   try {
//     const room = await Room.findOne({ roomId });
//     return room ? room.adminId.toString() === userId.toString() : false;
//   } catch (error) {
//     console.error("Error checking if user is room admin:", error);
//     return false;
//   }
// };
// Create a new room
const createRoom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        // Check if user has already created 4 rooms
        const existingRooms = yield room_model_js_1.default.countDocuments({ adminId: userId });
        if (existingRooms >= 2) {
            return res.status(400).json({
                message: "You have reached the maximum limit of 2 rooms. Please delete an existing room before creating a new one."
            });
        }
        // Generate unique room ID
        let roomId;
        let roomExists;
        do {
            roomId = generateRoomId();
            roomExists = yield room_model_js_1.default.findOne({ roomId });
        } while (roomExists);
        // Create room with creator as admin
        const newRoom = new room_model_js_1.default({
            roomId,
            adminId: userId,
            participants: [
                {
                    status: "allowed",
                    id: userId,
                },
            ],
            lastActive: new Date(),
        });
        yield newRoom.save();
        res.status(201).json({
            message: "Room created successfully",
            room: {
                roomId: newRoom.roomId,
                adminId: newRoom.adminId,
                participants: newRoom.participants,
                createdAt: newRoom.createdAt,
                lastActive: newRoom.lastActive,
            },
        });
    }
    catch (error) {
        console.error("Error creating room:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.createRoom = createRoom;
// Check if user can join room
const checkRoomPermission = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { roomId } = req.params;
        const userId = req.user._id;
        const permission = yield canJoinRoom(roomId, userId);
        res.status(200).json({
            canJoin: permission.canJoin,
            message: permission.message,
            room: permission.room,
            isAdmin: ((_a = permission.room) === null || _a === void 0 ? void 0 : _a.adminId.toString()) === userId.toString(),
        });
    }
    catch (error) {
        console.error("Error checking room permission:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.checkRoomPermission = checkRoomPermission;
// Send request to join room
const joinRoomRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roomId } = req.body;
        const userId = req.user._id;
        if (!roomId) {
            return res.status(400).json({ message: "Room ID is required" });
        }
        const room = yield room_model_js_1.default.findOne({ roomId });
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        // Check if user is already a participant
        const existingParticipant = room.participants.find((p) => p.id.toString() === userId.toString());
        if (existingParticipant) {
            if (existingParticipant.status === "allowed") {
                return res.status(400).json({ message: "You are already a participant in this room" });
            }
            else if (existingParticipant.status === "pending") {
                return res.status(400).json({ message: "You already have a pending join request" });
            }
            else if (existingParticipant.status === "banned") {
                return res.status(403).json({ message: "You are banned from this room" });
            }
        }
        // Add user as pending participant
        room.participants.push({
            status: "pending",
            id: userId
        });
        room.lastActive = new Date();
        yield room.save();
        res.status(200).json({
            message: "Join request sent successfully",
            room: {
                roomId: room.roomId,
                adminId: room.adminId,
                participants: room.participants,
                lastActive: room.lastActive,
            },
        });
    }
    catch (error) {
        console.error("Error sending join request:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.joinRoomRequest = joinRoomRequest;
// Approve join request (admin only)
const approveJoinRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roomId, participantId } = req.body;
        const adminId = req.user._id;
        if (!roomId || !participantId) {
            return res.status(400).json({ message: "Room ID and Participant ID are required" });
        }
        const room = yield room_model_js_1.default.findOne({ roomId });
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        // Check if the user is the admin
        if (room.adminId.toString() !== adminId.toString()) {
            return res.status(403).json({ message: "Only room admins can approve join requests" });
        }
        // Find and update the participant status
        const participant = room.participants.find((p) => p.id.toString() === participantId && p.status === "pending");
        if (!participant) {
            return res.status(404).json({ message: "Pending join request not found" });
        }
        participant.status = "allowed";
        room.lastActive = new Date();
        yield room.save();
        res.status(200).json({
            message: "Join request approved successfully",
            room: {
                roomId: room.roomId,
                adminId: room.adminId,
                participants: room.participants,
                lastActive: room.lastActive,
            },
        });
    }
    catch (error) {
        console.error("Error approving join request:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.approveJoinRequest = approveJoinRequest;
// Reject/ban join request (admin only)
const rejectJoinRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roomId, participantId } = req.body;
        const adminId = req.user._id;
        if (!roomId || !participantId) {
            return res.status(400).json({ message: "Room ID and Participant ID are required" });
        }
        const room = yield room_model_js_1.default.findOne({ roomId });
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        // Check if the user is the admin
        if (room.adminId.toString() !== adminId.toString()) {
            return res.status(403).json({ message: "Only room admins can reject join requests" });
        }
        // Find and update the participant status
        const participant = room.participants.find((p) => p.id.toString() === participantId && p.status === "pending");
        if (!participant) {
            return res.status(404).json({ message: "Pending join request not found" });
        }
        participant.status = "banned";
        room.lastActive = new Date();
        yield room.save();
        res.status(200).json({
            message: "Join request rejected successfully",
            room: {
                roomId: room.roomId,
                adminId: room.adminId,
                participants: room.participants,
                lastActive: room.lastActive,
            },
        });
    }
    catch (error) {
        console.error("Error rejecting join request:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.rejectJoinRequest = rejectJoinRequest;
// Delete room (admin only)
const deleteRoom = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roomId } = req.params;
        const adminId = req.user._id;
        const room = yield room_model_js_1.default.findOne({ roomId });
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        // Check if the user is the admin
        if (room.adminId.toString() !== adminId.toString()) {
            return res.status(403).json({ message: "Only room admins can delete the room" });
        }
        yield room_model_js_1.default.findByIdAndDelete(room._id);
        res.status(200).json({ message: "Room deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting room:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.deleteRoom = deleteRoom;
// Get room details
const getRoomDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;
        const room = yield room_model_js_1.default.findOne({ roomId }).populate("participants.id", "fullname username avatar");
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        // Check if user is a participant or admin
        const isParticipant = room.participants.some((p) => p.id.toString() === userId.toString());
        const isAdmin = room.adminId.toString() === userId.toString();
        if (!isParticipant && !isAdmin) {
            return res.status(403).json({ message: "You are not a participant in this room" });
        }
        res.status(200).json({
            room: {
                roomId: room.roomId,
                adminId: room.adminId,
                participants: room.participants,
                createdAt: room.createdAt,
                lastActive: room.lastActive,
            },
        });
    }
    catch (error) {
        console.error("Error getting room details:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getRoomDetails = getRoomDetails;
// Get all rooms for a user
const getUserRooms = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const rooms = yield room_model_js_1.default.find({
            $or: [
                { adminId: userId }
            ]
        }).populate("participants.id", "fullname username avatar");
        res.status(200).json({
            rooms: rooms.map((room) => ({
                roomId: room.roomId,
                adminId: room.adminId,
                participants: room.participants,
                createdAt: room.createdAt,
                lastActive: room.lastActive,
            })),
        });
    }
    catch (error) {
        console.error("Error getting user rooms:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getUserRooms = getUserRooms;
// Update room activity (called when room is active)
const updateRoomActivity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roomId } = req.body;
        const userId = req.user._id;
        const room = yield room_model_js_1.default.findOne({ roomId });
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        // Check if user is a participant or admin
        const isParticipant = room.participants.some((p) => p.id.toString() === userId.toString());
        const isAdmin = room.adminId.toString() === userId.toString();
        if (!isParticipant && !isAdmin) {
            return res.status(403).json({ message: "You are not a participant in this room" });
        }
        room.lastActive = new Date();
        yield room.save();
        res.status(200).json({ message: "Room activity updated successfully" });
    }
    catch (error) {
        console.error("Error updating room activity:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.updateRoomActivity = updateRoomActivity;
// Manual cleanup endpoint (admin only)
const manualCleanup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        // Check if user is admin
        if (user.role !== "admin") {
            return res.status(403).json({ message: "Only admins can perform manual cleanup" });
        }
        const deletedCount = yield (0, room_service_js_1.cleanupInactiveRooms)();
        res.status(200).json({
            message: "Manual cleanup completed successfully",
            deletedCount,
        });
    }
    catch (error) {
        console.error("Error during manual cleanup:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.manualCleanup = manualCleanup;
// Get pending join requests for a room (admin only)
const getPendingRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roomId } = req.params;
        const adminId = req.user._id;
        if (!roomId) {
            return res.status(400).json({ message: "Room ID is required" });
        }
        const room = yield room_model_js_1.default.findOne({ roomId });
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        // Check if the user is the admin
        if (room.adminId.toString() !== adminId.toString()) {
            return res.status(403).json({ message: "Only room admins can view pending requests" });
        }
        // Get pending participants with user details
        const pendingParticipants = room.participants.filter((p) => p.status === "pending");
        // Populate user details for pending participants
        const pendingRequestsWithDetails = yield Promise.all(pendingParticipants.map((participant) => __awaiter(void 0, void 0, void 0, function* () {
            const user = yield user_model_js_1.default.findById(participant.id).select('fullname username avatar');
            return {
                id: participant.id,
                status: participant.status,
                user: user ? {
                    fullname: user.fullname,
                    username: user.username,
                    avatar: user.avatar
                } : null,
                timestamp: room.lastActive // Use room's lastActive as approximation
            };
        })));
        res.status(200).json({
            message: "Pending requests retrieved successfully",
            pendingRequests: pendingRequestsWithDetails,
            count: pendingRequestsWithDetails.length,
        });
    }
    catch (error) {
        console.error("Error getting pending requests:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getPendingRequests = getPendingRequests;
