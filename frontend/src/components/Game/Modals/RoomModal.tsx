"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import { useSocketStore, Room } from "@/Zustand_Store/SocketStore";

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RoomModal({ isOpen, onClose }: RoomModalProps) {
  const [roomId, setRoomId] = useState("");
  const [isValidRoomId, setIsValidRoomId] = useState(true);
  const [userRooms, setUserRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [activeTab, setActiveTab] = useState<"join" | "my-rooms">("join");
  
  const router = useRouter();
  const { primaryAccentColor, secondaryAccentColor, isDarkMode } = useThemeStore();
  const { createRoom, getUserRooms } = useSocketStore();

  // Load user's rooms when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUserRooms();
    }
  }, [isOpen]);

  const loadUserRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const result = await getUserRooms();
      if (result.success && result.rooms) {
        setUserRooms(result.rooms);
      }
    } catch (error) {
      console.error("Failed to load user rooms:", error);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const handleCreateRoom = async() => {
    const response = await createRoom();
    console.log(response)
    if(response.success){
      router.push(`/room/${response.room?.roomId}`);
    }
    onClose();
  };

  const validateRoomId = (id: string) => {
    // Updated to match the 6-character alphanumeric format from backend
    const roomIdPattern = /^[A-Z0-9]{6}$/;
    return roomIdPattern.test(id.trim().toUpperCase());
  };

  const handleRoomIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setRoomId(value);
    if (value.trim()) {
      setIsValidRoomId(validateRoomId(value));
    } else {
      setIsValidRoomId(true);
    }
  };

  const handleJoinRoom = () => {
    const trimmedRoomId = roomId.trim().toUpperCase();
    if (trimmedRoomId) {
      if (!validateRoomId(trimmedRoomId)) {
        alert("Please enter a valid room ID (6 characters: letters and numbers)");
        return;
      }

      router.push(`/room/${trimmedRoomId}`);
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleJoinRoom();
    }
  };

  const handleJoinExistingRoom = (roomId: string) => {
    router.push(`/room/${roomId}`);
    onClose();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-lg mx-4 p-6 rounded-xl shadow-2xl transform transition-all duration-300 ${
          isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
        }`}
        style={{
          border: `2px solid ${primaryAccentColor}20`,
        }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2" style={{ color: secondaryAccentColor }}>
            Room Management
          </h2>
          <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            Create a new room, join existing ones, or manage your rooms
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex mb-6 rounded-lg p-1" style={{ backgroundColor: isDarkMode ? "#374151" : "#f3f4f6" }}>
          <button
            onClick={() => setActiveTab("join")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === "join"
                ? "text-white shadow-sm"
                : isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"
            }`}
            style={{
              backgroundColor: activeTab === "join" ? primaryAccentColor : "transparent",
            }}
          >
            Join Room
          </button>
          <button
            onClick={() => setActiveTab("my-rooms")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === "my-rooms"
                ? "text-white shadow-sm"
                : isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"
            }`}
            style={{
              backgroundColor: activeTab === "my-rooms" ? primaryAccentColor : "transparent",
            }}
          >
            My Rooms ({userRooms.length})
          </button>
        </div>

        {/* Create Room Button - Always visible */}
        <button
          onClick={handleCreateRoom}
          className="w-full mb-6 p-4 rounded-lg font-semibold text-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${secondaryAccentColor} 0%, ${primaryAccentColor} 100%)`,
            color: "#222",
          }}
        >
          <div className="flex items-center justify-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Room
          </div>
        </button>

        {/* Tab Content */}
        {activeTab === "join" && (
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Room ID
              </label>
              <input
                type="text"
                value={roomId}
                onChange={handleRoomIdChange}
                onKeyPress={handleKeyPress}
                placeholder="Enter room ID (e.g., ABC123)"
                className={`w-full p-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 ${
                  isDarkMode 
                    ? `bg-gray-800 ${isValidRoomId ? 'border-gray-600' : 'border-red-500'} text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400/20` 
                    : `bg-white ${isValidRoomId ? 'border-gray-300' : 'border-red-500'} text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20`
                }`}
              />
              {roomId.trim() && !isValidRoomId && (
                <p className="text-red-500 text-sm mt-1">
                  Please enter a valid room ID (6 characters: letters and numbers)
                </p>
              )}
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={!roomId.trim() || !isValidRoomId}
              className={`w-full p-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
                roomId.trim() && isValidRoomId
                  ? "hover:scale-105 active:scale-95 shadow-lg" 
                  : "opacity-50 cursor-not-allowed"
              }`}
              style={{
                background: roomId.trim() && isValidRoomId
                  ? `linear-gradient(135deg, ${primaryAccentColor} 0%, ${secondaryAccentColor} 100%)`
                  : isDarkMode ? "#374151" : "#e5e7eb",
                color: roomId.trim() && isValidRoomId ? "#222" : isDarkMode ? "#9ca3af" : "#6b7280",
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Join Room
              </div>
            </button>
          </div>
        )}

        {activeTab === "my-rooms" && (
          <div className="space-y-4">
            {isLoadingRooms ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryAccentColor }}></div>
              </div>
            ) : userRooms.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: isDarkMode ? "#666666" : "#cccccc" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p style={{ color: isDarkMode ? "#cccccc" : "#666666" }}>
                  You haven&apos;t created any rooms yet
                </p>
                <p className="text-sm mt-2" style={{ color: isDarkMode ? "#999999" : "#888888" }}>
                  Create your first room to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64">
                {userRooms.map((room) => (
                  <div
                    key={room.roomId}
                    className="p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                      borderColor: isDarkMode ? "#404040" : "#e5e5e5",
                    }}
                    onClick={() => handleJoinExistingRoom(room.roomId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold" style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}>
                          Room {room.roomId}
                        </h3>
                        <p className="text-sm" style={{ color: isDarkMode ? "#cccccc" : "#666666" }}>
                          {room.participants.length} participant{room.participants.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs" style={{ color: isDarkMode ? "#999999" : "#888888" }}>
                          Created: {formatDate(room.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: room.participants.length > 1 ? "#10b981" : "#6b7280",
                            color: "#ffffff",
                          }}
                        >
                          {room.participants.length}
                        </span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: isDarkMode ? "#cccccc" : "#666666" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors duration-200 ${
            isDarkMode 
              ? "text-gray-400 hover:text-white hover:bg-gray-800" 
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
} 