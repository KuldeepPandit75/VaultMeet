import Room from "../models/room.model.js";

// Cleanup inactive rooms (should be called by a cron job)
export const cleanupInactiveRooms = async () => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const deletedRooms = await Room.deleteMany({
      lastActive: { $lt: sevenDaysAgo },
    });

    console.log(`Cleaned up ${deletedRooms.deletedCount} inactive rooms`);
    return deletedRooms.deletedCount;
  } catch (error) {
    console.error("Error cleaning up inactive rooms:", error);
    throw error;
  }
};

// Get rooms that are about to expire (for notifications)
export const getExpiringRooms = async () => {
  try {
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

    const expiringRooms = await Room.find({
      lastActive: { $lt: sixDaysAgo },
    }).populate("participants.id", "fullname email");

    return expiringRooms;
  } catch (error) {
    console.error("Error getting expiring rooms:", error);
    throw error;
  }
};

// Update room activity
export const updateRoomActivity = async (roomId: string) => {
  try {
    const room = await Room.findOne({ roomId });
    if (room) {
      room.lastActive = new Date();
      await room.save();
    }
  } catch (error) {
    console.error("Error updating room activity:", error);
    throw error;
  }
};

// Get room statistics
export const getRoomStats = async () => {
  try {
    const totalRooms = await Room.countDocuments();
    const activeRooms = await Room.countDocuments({
      lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
    });
    const inactiveRooms = await Room.countDocuments({
      lastActive: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Older than 7 days
    });

    return {
      totalRooms,
      activeRooms,
      inactiveRooms,
    };
  } catch (error) {
    console.error("Error getting room stats:", error);
    throw error;
  }
}; 