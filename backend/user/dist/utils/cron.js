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
Object.defineProperty(exports, "__esModule", { value: true });
exports.manualCleanup = exports.setupRoomCleanup = void 0;
const room_service_js_1 = require("../services/room.service.js");
// Simple cron-like function to run cleanup daily
const setupRoomCleanup = () => {
    // Run cleanup every 24 hours
    const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const runCleanup = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            console.log("Running room cleanup...");
            const deletedCount = yield (0, room_service_js_1.cleanupInactiveRooms)();
            console.log(`Room cleanup completed. Deleted ${deletedCount} inactive rooms.`);
        }
        catch (error) {
            console.error("Error during room cleanup:", error);
        }
    });
    // Run cleanup immediately on startup
    runCleanup();
    // Schedule cleanup to run every 24 hours
    setInterval(runCleanup, CLEANUP_INTERVAL);
    console.log("Room cleanup scheduled to run every 24 hours");
};
exports.setupRoomCleanup = setupRoomCleanup;
// Manual cleanup function (can be called via API)
const manualCleanup = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedCount = yield (0, room_service_js_1.cleanupInactiveRooms)();
        return { success: true, deletedCount };
    }
    catch (error) {
        console.error("Manual cleanup failed:", error);
        return { success: false, error: error.message };
    }
});
exports.manualCleanup = manualCleanup;
