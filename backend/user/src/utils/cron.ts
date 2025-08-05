import { cleanupInactiveRooms } from "../services/room.service.js";

// Simple cron-like function to run cleanup daily
export const setupRoomCleanup = () => {
  // Run cleanup every 24 hours
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  const runCleanup = async () => {
    try {
      console.log("Running room cleanup...");
      const deletedCount = await cleanupInactiveRooms();
      console.log(`Room cleanup completed. Deleted ${deletedCount} inactive rooms.`);
    } catch (error) {
      console.error("Error during room cleanup:", error);
    }
  };

  // Run cleanup immediately on startup
  runCleanup();

  // Schedule cleanup to run every 24 hours
  setInterval(runCleanup, CLEANUP_INTERVAL);

  console.log("Room cleanup scheduled to run every 24 hours");
};

// Manual cleanup function (can be called via API)
export const manualCleanup = async () => {
  try {
    const deletedCount = await cleanupInactiveRooms();
    return { success: true, deletedCount };
  } catch (error) {
    console.error("Manual cleanup failed:", error);
    return { success: false, error: error.message };
  }
}; 