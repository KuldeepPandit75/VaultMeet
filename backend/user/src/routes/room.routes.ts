import express from "express";
import {
  createRoom,
  joinRoomRequest,
  approveJoinRequest,
  rejectJoinRequest,
  deleteRoom,
  getRoomDetails,
  getUserRooms,
  updateRoomActivity,
  manualCleanup,
  checkRoomPermission,
  getPendingRequests,
  banParticipant,
  setParticipantPending,
  makeAdmin,
} from "../controllers/room.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create a new room
router.post("/create", createRoom as any);

// Check if user can join room
router.get("/permission/:roomId", checkRoomPermission as any);

// Send request to join room
router.post("/join-request", joinRoomRequest as any);

// Approve join request (admin only)
router.post("/approve-request", approveJoinRequest as any);

// Reject/ban join request (admin only)
router.post("/reject-request", rejectJoinRequest as any);

// Delete room (admin only)
router.delete("/:roomId", deleteRoom as any);

// Get room details
router.get("/:roomId", getRoomDetails as any);

// Get all rooms for a user
router.get("/user/rooms", getUserRooms as any);

// Update room activity
router.put("/update-activity", updateRoomActivity as any);

// Manual cleanup (admin only)
router.post("/cleanup", manualCleanup as any);

// Get pending join requests for a room (admin only)
router.get("/:roomId/pending-requests", getPendingRequests as any);

// Ban participant from room (admin only)
router.post("/ban-participant", banParticipant as any);

// Set participant status as pending (admin only)
router.post("/set-participant-pending", setParticipantPending as any);

// Make participant admin (admin only)
router.post("/make-admin", makeAdmin as any);

export default router; 