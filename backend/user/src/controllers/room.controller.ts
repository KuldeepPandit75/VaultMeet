import { Request, Response } from "express";
import Room from "../models/room.model.js";
import User from "../models/user.model.js";
import { cleanupInactiveRooms } from "../services/room.service.js";

// Generate a unique room ID
const generateRoomId = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Check if user can join room (admin and allowed participants)
const canJoinRoom = async (roomId: string, userId: string): Promise<{ canJoin: boolean; message?: string; room?: any }> => {
  try {
    const room = await Room.findOne({ roomId });
    
    if (!room) {
      return { canJoin: false, message: "Room not found" };
    }

    // Check if user is the admin
    if (room.adminId.toString() === userId.toString()) {
      return { canJoin: true, room: room };
    }

    // Check if user is an allowed participant
    const allowedParticipant = room.participants.find(
      (p) => p.id.toString() === userId.toString() && (p.status === "allowed" || p.status === "admin")
    );

    if (allowedParticipant) {
      return { canJoin: true, room: room };
    }

    // Check if user is a pending participant
    const pendingParticipant = room.participants.find(
      (p) => p.id.toString() === userId.toString() && p.status === "pending"
    );

    if (pendingParticipant) {
      return { canJoin: false, message: "Your join request is pending approval" };
    }

    // Check if user is banned
    const bannedParticipant = room.participants.find(
      (p) => p.id.toString() === userId.toString() && p.status === "banned"
    );

    if (bannedParticipant) {
      return { canJoin: false, message: "You are banned from this room" };
    }

    return { canJoin: false, message: "You are not authorized to join this room" };
  } catch (error) {
    console.error("Error checking room permissions:", error);
    return { canJoin: false, message: "Error checking room permissions" };
  }
};

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
export const createRoom = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    // Check if user has already created 4 rooms
    const existingRooms = await Room.countDocuments({ adminId: userId });
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
      roomExists = await Room.findOne({ roomId });
    } while (roomExists);

    // Create room with creator as admin
    const newRoom = new Room({
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

    await newRoom.save();

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
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Check if user can join room
export const checkRoomPermission = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const userId = (req as any).user._id;

    const permission = await canJoinRoom(roomId, userId);

    res.status(200).json({
      canJoin: permission.canJoin,
      message: permission.message,
      room: permission.room,
      isAdmin:
        permission.room?.adminId.toString() === userId.toString() ||
        permission.room?.participants.some(
          (p: any) => p.id.toString() === userId.toString() && p.status === "admin"
        ),
    });
  } catch (error) {
    console.error("Error checking room permission:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Send request to join room
export const joinRoomRequest = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.body;
    const userId = (req as any).user._id;

    if (!roomId ) {
      return res.status(400).json({ message: "Room ID is required" });
    }

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if user is already a participant
    const existingParticipant = room.participants.find(
      (p) => p.id.toString() === userId.toString()
    );

    if (existingParticipant) {
      if (existingParticipant.status === "allowed") {
        return res.status(400).json({ message: "You are already a participant in this room" });
      } else if (existingParticipant.status === "pending") {
        return res.status(400).json({ message: "You already have a pending join request" });
      } else if (existingParticipant.status === "banned") {
        return res.status(403).json({ message: "You are banned from this room" });
      }
    }

    // Add user as pending participant
    room.participants.push({
      status: "pending",
      id: userId
    });

    room.lastActive = new Date();
    await room.save();

    res.status(200).json({
      message: "Join request sent successfully",
      room: {
        roomId: room.roomId,
        adminId: room.adminId,
        participants: room.participants,
        lastActive: room.lastActive,
      },
    });
  } catch (error) {
    console.error("Error sending join request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Approve join request (admin only)
export const approveJoinRequest = async (req: Request, res: Response) => {
  try {
    const { roomId, participantId } = req.body;
    const adminId = (req as any).user._id;

    if (!roomId || !participantId) {
      return res.status(400).json({ message: "Room ID and Participant ID are required" });
    }

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if the user is the main admin or has admin status
    const isMainAdmin = room.adminId.toString() === adminId.toString();
    const isAdminParticipant = room.participants.some(
      (p) => p.id.toString() === adminId.toString() && p.status === "admin"
    );
    if (!isMainAdmin && !isAdminParticipant) {
      return res.status(403).json({ message: "Only room admins can approve join requests" });
    }

    // Find and update the participant status
    const participant = room.participants.find(
      (p) => p.id.toString() === participantId && p.status === "pending"
    );

    if (!participant) {
      return res.status(404).json({ message: "Pending join request not found" });
    }

    participant.status = "allowed";
    room.lastActive = new Date();
    await room.save();

    res.status(200).json({
      message: "Join request approved successfully",
      room: {
        roomId: room.roomId,
        adminId: room.adminId,
        participants: room.participants,
        lastActive: room.lastActive,
      },
    });
  } catch (error) {
    console.error("Error approving join request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Reject/ban join request (admin only)
export const rejectJoinRequest = async (req: Request, res: Response) => {
  try {
    const { roomId, participantId } = req.body;
    const adminId = (req as any).user._id;

    if (!roomId || !participantId) {
      return res.status(400).json({ message: "Room ID and Participant ID are required" });
    }

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if the user is the main admin or has admin status
    const isMainAdmin = room.adminId.toString() === adminId.toString();
    const isAdminParticipant = room.participants.some(
      (p) => p.id.toString() === adminId.toString() && p.status === "admin"
    );
    if (!isMainAdmin && !isAdminParticipant) {
      return res.status(403).json({ message: "Only room admins can reject join requests" });
    }

    // Find and update the participant status
    const participant = room.participants.find(
      (p) => p.id.toString() === participantId && p.status === "pending"
    );

    if (!participant) {
      return res.status(404).json({ message: "Pending join request not found" });
    }

    participant.status = "banned";
    room.lastActive = new Date();
    await room.save();

    res.status(200).json({
      message: "Join request rejected successfully",
      room: {
        roomId: room.roomId,
        adminId: room.adminId,
        participants: room.participants,
        lastActive: room.lastActive,
      },
    });
  } catch (error) {
    console.error("Error rejecting join request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete room (admin only)
export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const adminId = (req as any).user._id;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if the user is the main admin or has admin status
    const isMainAdmin = room.adminId.toString() === adminId.toString();
    const isAdminParticipant = room.participants.some(
      (p) => p.id.toString() === adminId.toString() && p.status === "admin"
    );
    if (!isMainAdmin && !isAdminParticipant) {
      return res.status(403).json({ message: "Only room admins can delete the room" });
    }

    await Room.findByIdAndDelete(room._id);

    res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get room details
export const getRoomDetails = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const userId = (req as any).user._id;

    const room = await Room.findOne({ roomId }).populate("participants.id", "fullname username avatar");

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if user is a participant or admin
    const isParticipant = room.participants.some(
      (p) => p.id.toString() === userId.toString()
    );
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
  } catch (error) {
    console.error("Error getting room details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all rooms for a user
export const getUserRooms = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    const rooms = await Room.find({
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
  } catch (error) {
    console.error("Error getting user rooms:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update room activity (called when room is active)
export const updateRoomActivity = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.body;
    const userId = (req as any).user._id;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if user is a participant or admin
    const isParticipant = room.participants.some(
      (p) => p.id.toString() === userId.toString()
    );
    const isAdmin = room.adminId.toString() === userId.toString();

    if (!isParticipant && !isAdmin) {
      return res.status(403).json({ message: "You are not a participant in this room" });
    }

    room.lastActive = new Date();
    await room.save();

    res.status(200).json({ message: "Room activity updated successfully" });
  } catch (error) {
    console.error("Error updating room activity:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Manual cleanup endpoint (admin only)
export const manualCleanup = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Check if user is admin
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can perform manual cleanup" });
    }

    const deletedCount = await cleanupInactiveRooms();

    res.status(200).json({
      message: "Manual cleanup completed successfully",
      deletedCount,
    });
  } catch (error) {
    console.error("Error during manual cleanup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get pending join requests for a room (admin only)
export const getPendingRequests = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const adminId = (req as any).user._id;

    if (!roomId) {
      return res.status(400).json({ message: "Room ID is required" });
    }

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if the user is the main admin or has admin status
    const isMainAdmin = room.adminId.toString() === adminId.toString();
    const isAdminParticipant = room.participants.some(
      (p) => p.id.toString() === adminId.toString() && p.status === "admin"
    );
    if (!isMainAdmin && !isAdminParticipant) {
      return res.status(403).json({ message: "Only room admins can view pending requests" });
    }

    // Get pending participants with user details
    const pendingParticipants = room.participants.filter(
      (p) => p.status === "pending"
    );

    // Populate user details for pending participants
    const pendingRequestsWithDetails = await Promise.all(
      pendingParticipants.map(async (participant) => {
        const user = await User.findById(participant.id).select('fullname username avatar');
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
      })
    );

    res.status(200).json({
      message: "Pending requests retrieved successfully",
      pendingRequests: pendingRequestsWithDetails,
      count: pendingRequestsWithDetails.length,
    });
  } catch (error) {
    console.error("Error getting pending requests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Ban participant from room (admin only)
export const banParticipant = async (req: Request, res: Response) => {
  try {
    const { roomId, participantId } = req.body;
    const adminId = (req as any).user._id;

    if (!roomId || !participantId) {
      return res.status(400).json({ message: "Room ID and Participant ID are required" });
    }

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if the user is the main admin or has admin status
    const isMainAdmin = room.adminId.toString() === adminId.toString();
    const isAdminParticipant = room.participants.some(
      (p) => p.id.toString() === adminId.toString() && p.status === "admin"
    );
    if (!isMainAdmin && !isAdminParticipant) {
      return res.status(403).json({ message: "Only room admins can ban participants" });
    }

    // Check if trying to ban the admin
    if (room.adminId.toString() === participantId.toString()) {
      return res.status(400).json({ message: "Cannot ban the room admin" });
    }

    const user= await User.findOne({socketId:participantId});
    // Find and update the participant status to banned
    const participant = room.participants.find(
      (p) => p.id.toString() === user._id.toString()
    );

    if (!participant) {
      console.log("Participant not found in room");
      return res.status(404).json({ message: "Participant not found in room" });
    }

    participant.status = "banned";
    room.lastActive = new Date();
    await room.save();

    res.status(200).json({
      message: "Participant banned successfully",
      room: {
        roomId: room.roomId,
        adminId: room.adminId,
        participants: room.participants,
        lastActive: room.lastActive,
      },
    });
  } catch (error) {
    console.error("Error banning participant:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Set participant status as pending (admin only)
export const setParticipantPending = async (req: Request, res: Response) => {
  try {
    const { roomId, participantId } = req.body;
    const adminId = (req as any).user._id;

    if (!roomId || !participantId) {
      return res.status(400).json({ message: "Room ID and Participant ID are required" });
    }

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if the user is the admin
    // Allow both the main admin and participants with status 'admin' to modify participant status
    const isMainAdmin = room.adminId.toString() === adminId.toString();
    const isAdminParticipant = room.participants.some(
      (p) => p.id.toString() === adminId.toString() && p.status === "admin"
    );
    if (!isMainAdmin && !isAdminParticipant) {
      return res.status(403).json({ message: "Only room admins can modify participant status" });
    }

    // Check if trying to modify the admin
    if (room.adminId.toString() === participantId.toString()) {
      return res.status(400).json({ message: "Cannot modify the room admin status" });
    }

    const user = await User.findOne({ socketId: participantId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find and update the participant status to pending
    const participant = room.participants.find(
      (p) => p.id.toString() === user._id.toString()
    );

    if (!participant) {
      console.log("Participant not found in room");
      return res.status(404).json({ message: "Participant not found in room" });
    }

    participant.status = "pending";
    room.lastActive = new Date();
    await room.save();

    res.status(200).json({
      message: "Participant status set to pending successfully",
      room: {
        roomId: room.roomId,
        adminId: room.adminId,
        participants: room.participants,
        lastActive: room.lastActive,
      },
    });
  } catch (error) {
    console.error("Error setting participant status to pending:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const makeAdmin = async (req: Request, res: Response) => {
  try {
    const { roomId, adminId, participantId } = req.body;

    // Find the room
    const room = await Room.findOne({ roomId });
    if (!room) {
      console.log("Room not found");
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if the user is the current admin
    if (room.adminId.equals(adminId)) {
      return res.status(403).json({ message: "Only the current admin can assign a new admin" });
    }

    // Find the user to be made admin
    const user = await User.findOne({ socketId: participantId });
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    // Find the participant in the room
    const participant = room.participants.find(
      (p) => p.id.toString() === user._id.toString()
    );
    if (!participant) {
      return res.status(404).json({ message: "Participant not found in room" });
    }

    // Set all participants' status to "participant" except the new admin
    room.participants.forEach((p) => {
      if (p.id.toString() === user._id.toString()) {
        p.status = "admin";
      }
    });

    room.lastActive = new Date();
    await room.save();

    res.status(200).json({
      message: "Admin created successfully",
      room: {
        roomId: room.roomId,
        adminId: room.adminId,
        participants: room.participants,
        lastActive: room.lastActive,
      },
    });
  } catch (error) {
    console.error("Error making admin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};