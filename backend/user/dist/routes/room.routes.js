"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const room_controller_js_1 = require("../controllers/room.controller.js");
const auth_middleware_js_1 = __importDefault(require("../middlewares/auth.middleware.js"));
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_middleware_js_1.default);
// Create a new room
router.post("/create", room_controller_js_1.createRoom);
// Check if user can join room
router.get("/permission/:roomId", room_controller_js_1.checkRoomPermission);
// Send request to join room
router.post("/join-request", room_controller_js_1.joinRoomRequest);
// Approve join request (admin only)
router.post("/approve-request", room_controller_js_1.approveJoinRequest);
// Reject/ban join request (admin only)
router.post("/reject-request", room_controller_js_1.rejectJoinRequest);
// Delete room (admin only)
router.delete("/:roomId", room_controller_js_1.deleteRoom);
// Get room details
router.get("/:roomId", room_controller_js_1.getRoomDetails);
// Get all rooms for a user
router.get("/user/rooms", room_controller_js_1.getUserRooms);
// Update room activity
router.put("/update-activity", room_controller_js_1.updateRoomActivity);
// Manual cleanup (admin only)
router.post("/cleanup", room_controller_js_1.manualCleanup);
// Get pending join requests for a room (admin only)
router.get("/:roomId/pending-requests", room_controller_js_1.getPendingRequests);
exports.default = router;
