import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMicrophone,
  faMicrophoneSlash,
  faVideo,
  faVideoSlash,
  faMessage,
  faDesktop,
  faUsers,
  faGamepad,
  faCog,
  faTimes,
  faChevronDown,
  faUserPlus,
  faCheck,
  faTimes as faX,
  faExclamationTriangle,
  faQuestionCircle,
  faShieldAlt,
} from "@fortawesome/free-solid-svg-icons";
import useAuthStore from "@/Zustand_Store/AuthStore";
import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import Image from "next/image";
import useChatStore from "@/Zustand_Store/ChatStore";
import { useState, useEffect } from "react";
import { getAvailableDevices, switchAudioDevice, switchVideoDevice, retryVideoTrack } from "./agora";
import { useSocketStore } from "@/Zustand_Store/SocketStore";
import { useSocket } from "@/context/SocketContext";

interface MediaDevice {
  deviceId: string;
  label: string;
  kind: string;
}

interface ControlBarProps {
  mic: boolean;
  video: boolean;
  screenShare: boolean;
  handleMicToggle: () => void;
  handleVideoToggle: () => void;
  handleScreenShareToggle: () => void;
  setBox: (box: boolean ) => void;
  viewMode: "game" | "meeting" | "whiteboard";
  handleViewToggle: () => void;
  isMeetingViewAvailable: boolean;
  unreadCount?: number;
  setIsReportModalOpen: (open: boolean) => void;
  setIsHelpModalOpen: (open: boolean) => void;
  setIsModerationModalOpen: (open: boolean) => void;
}

export const ControlBar = ({
  mic,
  video,
  screenShare,
  handleMicToggle,
  handleVideoToggle,
  handleScreenShareToggle,
  setBox,
  viewMode,
  handleViewToggle,
  unreadCount = 0,
  setIsReportModalOpen,
  setIsHelpModalOpen,
  setIsModerationModalOpen,
}: ControlBarProps) => {
  const { user } = useAuthStore();
  const { primaryAccentColor, secondaryAccentColor, isDarkMode } =
    useThemeStore();
  const { isInGameChatOpen } = useChatStore();
  const { currentRoom, approveJoinRequest, rejectJoinRequest, getPendingRequests } = useSocketStore();
  const { socket } = useSocket();
  const [isRoomAdmin, setIsRoomAdmin] = useState(false);
  
  // Join request state
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Array<{
    socketId: string;
    userId: string;
    timestamp: number;
    user?: {
      fullname: {
        firstname: string;
        lastname: string;
      };
      username: string;
      avatar?: string;
    } | null;
  }>>([]);
  
  // Check if current user is room admin
  useEffect(()=>{
    if (!currentRoom || !user?._id) return;
    const isMainAdmin = currentRoom.adminId?.toString() === user._id.toString();
    const isAdminParticipant = currentRoom.participants?.some(
      (p: { id: string; status: string }) => p.id?.toString() === user._id.toString() && p.status === "admin"
    );
    setIsRoomAdmin(isMainAdmin || isAdminParticipant);
  },[currentRoom]);
  
  // Fetch pending requests from server when user becomes admin
  useEffect(() => {
    const fetchPendingRequests = async () => {
      if (!currentRoom?.roomId || !isRoomAdmin) return;
      
      try {
        const result = await getPendingRequests(currentRoom.roomId);
        if (result.success && result.pendingRequests) {
          // Transform the server data to match the local state structure
          const transformedRequests = result.pendingRequests.map(req => ({
            socketId: '', // Server doesn't provide socketId, we'll use empty string
            userId: req.id,
            timestamp: req.timestamp || Date.now(),
            user: req.user, // Include user details from server
          }));
          setPendingRequests(transformedRequests);
        }
      } catch (error) {
        console.error("Error fetching pending requests:", error);
      }
    };
    
    fetchPendingRequests();
  }, [currentRoom?.roomId, isRoomAdmin, getPendingRequests]);
  
  // Listen for new join requests
  useEffect(() => {
    console.log(isRoomAdmin)
    if (!socket || !isRoomAdmin) return;
    
    const handleNewJoinRequest = (data: {
      roomId: string;
      socketId: string;
      userId: string;
      timestamp: number;
      userInfo?: {
        fullname: {
          firstname: string;
          lastname: string;
        };
        username: string;
        avatar?: string;
      };
    }) => {
      setPendingRequests(prev => [...prev, {
        socketId: data.socketId,
        userId: data.userId,
        timestamp: data.timestamp,
        user: data.userInfo ? {
          fullname: data.userInfo.fullname,
          username: data.userInfo.username,
          avatar: data.userInfo.avatar
        } : null
      }]);
    };
    
    socket.on("newJoinRequest", handleNewJoinRequest);
    
    return () => {
      socket.off("newJoinRequest", handleNewJoinRequest);
    };
  }, [socket, isRoomAdmin]);
  
  // Listen for real-time updates when requests are approved/rejected by other admins
  useEffect(() => {
    if (!socket || !isRoomAdmin) return;
    
    const handleRequestRemoved = (data: { roomId: string; participantId: string }) => {
      setPendingRequests(prev => prev.filter(req => req.userId !== data.participantId));
    };
    
    socket.on("joinRequestApproved", handleRequestRemoved);
    socket.on("joinRequestRejected", handleRequestRemoved);
    
    return () => {
      socket.off("joinRequestApproved", handleRequestRemoved);
      socket.off("joinRequestRejected", handleRequestRemoved);
    };
  }, [socket, isRoomAdmin]);
  
  // Handle approve/reject join requests
  const handleApproveRequest = async (participantId: string) => {
    if (!currentRoom?.roomId) return;
    
    try {
      // Call the API to approve the request
      await approveJoinRequest({ roomId: currentRoom.roomId, participantId });
      
      // Emit socket event for real-time updates
      socket?.emit("approveJoinRequest", { 
        roomId: currentRoom.roomId, 
        participantId 
      });
      
      // Remove from local state
      setPendingRequests(prev => prev.filter(req => req.userId !== participantId));
    } catch (error) {
      console.error("Error approving join request:", error);
    }
  };
  
  const handleRejectRequest = async (participantId: string) => {
    if (!currentRoom?.roomId) return;
    
    try {
      // Call the API to reject the request
      await rejectJoinRequest({ roomId: currentRoom.roomId, participantId });
      
      // Emit socket event for real-time updates
      socket?.emit("rejectJoinRequest", { 
        roomId: currentRoom.roomId, 
        participantId 
      });
      
      // Remove from local state
      setPendingRequests(prev => prev.filter(req => req.userId !== participantId));
    } catch (error) {
      console.error("Error rejecting join request:", error);
    }
  };
  
  // Device selection state
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);
  const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  
  // Load available devices on component mount
  useEffect(() => {
    const loadDevices = async () => {
      const devices = await getAvailableDevices();
      
      const formattedAudioDevices = devices.audioInputDevices.map((device) => ({
        deviceId: device.deviceId,
        label: device.label || `Microphone ${device.deviceId.slice(0, 5)}`,
        kind: device.kind,
      }));
      
      const formattedVideoDevices = devices.videoInputDevices.map((device) => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${device.deviceId.slice(0, 5)}`,
        kind: device.kind,
      }));
      
      setAudioDevices(formattedAudioDevices);
      setVideoDevices(formattedVideoDevices);
      
      // Set default devices (first available)
      if (formattedAudioDevices.length > 0) {
        setSelectedAudioDevice(formattedAudioDevices[0].deviceId);
      }
      if (formattedVideoDevices.length > 0) {
        setSelectedVideoDevice(formattedVideoDevices[0].deviceId);
      }
    };
    
    loadDevices();
  }, []);
  
  // Handle device changes
  const handleAudioDeviceChange = async (deviceId: string) => {
    setSelectedAudioDevice(deviceId);
    await switchAudioDevice(deviceId);
  };
  
  const handleVideoDeviceChange = async (deviceId: string) => {
    setSelectedVideoDevice(deviceId);
    await switchVideoDevice(deviceId);
  };
  
  const handleRetryVideo = async () => {
    const success = await retryVideoTrack();
    if (success) {
      // Reload devices to get the newly created video track
      const devices = await getAvailableDevices();
      const formattedVideoDevices = devices.videoInputDevices.map((device) => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${device.deviceId.slice(0, 5)}`,
        kind: device.kind,
      }));
      setVideoDevices(formattedVideoDevices);
      if (formattedVideoDevices.length > 0) {
        setSelectedVideoDevice(formattedVideoDevices[0].deviceId);
      }
    }
  };
  return (
    <div
      className="absolute z-50 w-[100vw] h-[70px] bottom-0 right-0 flex justify-between items-center !px-10 backdrop-blur-md border-t control-bar-container"
      style={{
        backgroundColor: isDarkMode
          ? "rgba(17, 17, 17, 0.95)"
          : "rgba(255, 255, 255, 0.95)",
        borderColor: isDarkMode ? "#333333" : "#e5e5e5",
        boxShadow: isDarkMode
          ? "0 -10px 30px -10px rgba(0, 0, 0, 0.5)"
          : "0 -10px 30px -10px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div className="flex gap-6 items-center">
        {/* Local Video Preview */}
        <div className="relative">
          <video
            className="video-player h-14 w-24 rounded-xl object-cover shadow-lg"
            style={{
              display: video ? "block" : "none",
              border: `2px solid ${isDarkMode ? "#333333" : "#e5e5e5"}`,
            }}
            id="user-1"
            autoPlay
            muted
            playsInline
          ></video>
          {!video && (
            <div
              className="h-14 w-24 rounded-xl flex justify-center items-center shadow-lg"
              style={{
                backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5",
                border: `2px solid ${isDarkMode ? "#333333" : "#e5e5e5"}`,
              }}
            >
              {user?.avatar ? (
                <Image
                  src={user.avatar}
                  alt="User Avatar"
                  height={20}
                  width={20}
                  className="h-8 w-8 rounded-full object-cover"
                  style={{ backgroundColor: primaryAccentColor }}
                />
              ) : (
                <div
                  className="h-8 w-8 flex items-center justify-center rounded-full text-white font-semibold text-sm"
                  style={{ backgroundColor: primaryAccentColor }}
                >
                  {user?.fullname?.firstname.charAt(0)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex gap-4">
          {/* Microphone Button */}
          <button
            className="h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            onClick={handleMicToggle}
            style={{
              backgroundColor: mic
                ? isDarkMode
                  ? "#2a2a2a"
                  : "#f5f5f5"
                : "#ef4444",
              color: mic ? (isDarkMode ? "#ffffff" : "#1a1a1a") : "#ffffff",
              border: `2px solid ${
                mic ? (isDarkMode ? "#333333" : "#e5e5e5") : "#ef4444"
              }`,
            }}
          >
            <FontAwesomeIcon
              icon={mic ? faMicrophone : faMicrophoneSlash}
              className="text-lg"
            />
          </button>

          {/* Video Button */}
          <button
            className="h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            onClick={handleVideoToggle}
            style={{
              backgroundColor: video
                ? isDarkMode
                  ? "#2a2a2a"
                  : "#f5f5f5"
                : "#ef4444",
              color: video ? (isDarkMode ? "#ffffff" : "#1a1a1a") : "#ffffff",
              border: `2px solid ${
                video ? (isDarkMode ? "#333333" : "#e5e5e5") : "#ef4444"
              }`,
            }}
          >
            <FontAwesomeIcon
              icon={video ? faVideo : faVideoSlash}
              className="text-lg"
            />
          </button>

          {/* Screen Share Button */}
          <button
            className="h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            onClick={handleScreenShareToggle}
            title={screenShare ? "Stop Screen Share" : "Start Screen Share"}
            style={{
              backgroundColor: screenShare
                ? secondaryAccentColor
                : isDarkMode
                ? "#2a2a2a"
                : "#f5f5f5",
              color: screenShare
                ? "#ffffff"
                : isDarkMode
                ? "#ffffff"
                : "#1a1a1a",
              border: `2px solid ${
                screenShare
                  ? secondaryAccentColor
                  : isDarkMode
                  ? "#333333"
                  : "#e5e5e5"
              }`,
              boxShadow: screenShare
                ? `0 4px 12px ${secondaryAccentColor}40`
                : "none",
            }}
          >
            <FontAwesomeIcon icon={faDesktop} className="text-lg" />
          </button>

          {/* Chat Button */}
          <button
            className="h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg relative"
            onClick={() => setBox(!isInGameChatOpen)}
            style={{
              backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5",
              color: isDarkMode ? "#ffffff" : "#1a1a1a",
              border: `2px solid ${isDarkMode ? "#333333" : "#e5e5e5"}`,
            }}
          >
            <FontAwesomeIcon icon={faMessage} className="text-lg" />
            {/* Unread message indicator */}
            {unreadCount > 0 && (
              <div
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg"
                style={{
                  backgroundColor: "#ef4444",
                  minWidth: "20px",
                  minHeight: "20px",
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </div>
            )}
          </button>

          {/* Device Settings Button */}
          <button
            className="h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            onClick={() => setShowDeviceSettings(!showDeviceSettings)}
            title="Device Settings"
            style={{
              backgroundColor: showDeviceSettings 
                ? secondaryAccentColor 
                : isDarkMode ? "#2a2a2a" : "#f5f5f5",
              color: showDeviceSettings 
                ? "#ffffff" 
                : isDarkMode ? "#ffffff" : "#1a1a1a",
              border: `2px solid ${
                showDeviceSettings 
                  ? secondaryAccentColor 
                  : isDarkMode ? "#333333" : "#e5e5e5"
              }`,
              boxShadow: showDeviceSettings
                ? `0 4px 12px ${secondaryAccentColor}40`
                : "none",
            }}
          >
            <FontAwesomeIcon icon={faCog} className="text-lg" />
          </button>

          {/* Help Button */}
          <button
            className="h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            onClick={() => setIsHelpModalOpen(true)}
            title="Help & Instructions"
            style={{
              backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5",
              color: isDarkMode ? "#ffffff" : "#1a1a1a",
              border: `2px solid ${isDarkMode ? "#333333" : "#e5e5e5"}`,
            }}
          >
            <FontAwesomeIcon icon={faQuestionCircle} className="text-lg" />
          </button>

          {/* Report Button */}
          <button
            className="h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            onClick={() => setIsReportModalOpen(true)}
            title="Report Issue / Feedback"
            style={{
              backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5",
              color: isDarkMode ? "#ffffff" : "#1a1a1a",
              border: `2px solid ${isDarkMode ? "#333333" : "#e5e5e5"}`,
            }}
          >
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-lg" />
          </button>

          {/* Join Requests Button (Admin Only) */}
          {isRoomAdmin && (
            <button
              className="h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg relative"
              onClick={() => setShowJoinRequests(!showJoinRequests)}
              title="Join Requests"
              style={{
                backgroundColor: showJoinRequests 
                  ? secondaryAccentColor 
                  : isDarkMode ? "#2a2a2a" : "#f5f5f5",
                color: showJoinRequests 
                  ? "#ffffff" 
                  : isDarkMode ? "#ffffff" : "#1a1a1a",
                border: `2px solid ${
                  showJoinRequests 
                    ? secondaryAccentColor 
                    : isDarkMode ? "#333333" : "#e5e5e5"
                }`,
                boxShadow: showJoinRequests
                  ? `0 4px 12px ${secondaryAccentColor}40`
                  : "none",
              }}
            >
              <FontAwesomeIcon icon={faUserPlus} className="text-lg" />
              {/* Pending requests indicator */}
              {pendingRequests.length > 0 && (
                <div
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg"
                  style={{
                    backgroundColor: "#ef4444",
                    minWidth: "20px",
                    minHeight: "20px",
                  }}
                >
                  {pendingRequests.length > 99 ? "99+" : pendingRequests.length}
                </div>
              )}
            </button>
          )}

          {/* Moderation Button (Admin Only) */}
          {isRoomAdmin && (
            <button
              className="h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
              onClick={() => setIsModerationModalOpen(true)}
              title="Room Moderation"
              style={{
                backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5",
                color: isDarkMode ? "#ffffff" : "#1a1a1a",
                border: `2px solid ${isDarkMode ? "#333333" : "#e5e5e5"}`,
              }}
            >
              <FontAwesomeIcon icon={faShieldAlt} className="text-lg" />
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        {/* View Toggle Button */}
        <button
          className="h-12 rounded-xl px-4 flex items-center justify-center gap-6 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
          onClick={handleViewToggle}
          style={{
            backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5",
            color: isDarkMode ? "#ffffff" : "#1a1a1a",
            border: `2px solid ${isDarkMode ? "#333333" : "#e5e5e5"}`,
          }}
        >
          <FontAwesomeIcon
            icon={viewMode === "game" ? faUsers : faGamepad}
            className="text-lg"
          />
          <span className="font-medium">
            {viewMode === "game"
              ? "Meeting"
              : viewMode === "meeting"
              ? "Game"
              : "Game"}{" "}
            View
          </span>
        </button>

        {/* Home Button */}
        <div
          className="h-12 w-12 flex justify-center items-center rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
          style={{
            backgroundColor: primaryAccentColor,
            boxShadow: `0 4px 12px ${primaryAccentColor}40`,
          }}
          onClick={() => {
            window.location.href = "/";
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            x="0px"
            y="0px"
            width="28"
            height="28"
            viewBox="0 0 64 64"
            fill="#fff"
          >
            <path d="M 32 8 C 31.08875 8 30.178047 8.3091875 29.435547 8.9296875 L 8.8007812 26.171875 C 8.0357812 26.810875 7.7634844 27.925203 8.2714844 28.783203 C 8.9184844 29.875203 10.35025 30.088547 11.28125 29.310547 L 12 28.710938 L 12 47 C 12 49.761 14.239 52 17 52 L 47 52 C 49.761 52 52 49.761 52 47 L 52 28.712891 L 52.71875 29.3125 C 53.09275 29.6255 53.546047 29.777344 53.998047 29.777344 C 54.693047 29.777344 55.382672 29.416656 55.763672 28.722656 C 56.228672 27.874656 55.954891 26.803594 55.212891 26.183594 L 52 23.498047 L 52 15 C 52 13.895 51.105 13 50 13 L 48 13 C 46.895 13 46 13.895 46 15 L 46 18.484375 L 34.564453 8.9296875 C 33.821953 8.3091875 32.91125 8 32 8 z M 32 12.152344 C 32.11475 12.152344 32.228766 12.191531 32.322266 12.269531 L 48 25.369141 L 48 46 C 48 47.105 47.105 48 46 48 L 38 48 L 38 34 C 38 32.895 37.105 32 36 32 L 28 32 C 26.895 32 26 32.895 26 34 L 26 48 L 18 48 C 16.895 48 16 47.105 16 46 L 16 25.367188 L 31.677734 12.269531 C 31.771234 12.191531 31.88525 12.152344 32 12.152344 z"></path>
          </svg>
        </div>
      </div>

      {/* Device Settings Modal */}
      {showDeviceSettings && (
        <>
          {/* Overlay to close modal when clicking outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDeviceSettings(false)}
          />
          <div
            className="absolute bottom-20 left-10 bg-white dark:bg-gray-800 rounded-xl shadow-xl border p-6 min-w-[320px] z-50"
            style={{
              backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
              borderColor: isDarkMode ? "#333333" : "#e5e5e5",
              boxShadow: isDarkMode
                ? "0 20px 40px rgba(0, 0, 0, 0.5)"
                : "0 20px 40px rgba(0, 0, 0, 0.15)",
            }}
          >
          {/* Modal Header */}
          <div className="flex justify-between items-center mb-4">
            <h3
              className="text-lg font-semibold"
              style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}
            >
              Device Settings
            </h3>
            <button
              onClick={() => setShowDeviceSettings(false)}
              className="h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5",
                color: isDarkMode ? "#ffffff" : "#1a1a1a",
              }}
            >
              <FontAwesomeIcon icon={faTimes} className="text-sm" />
            </button>
          </div>

          {/* Audio Device Selection */}
          <div className="mb-4">
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: isDarkMode ? "#cccccc" : "#666666" }}
            >
              Microphone
            </label>
            {audioDevices.length > 0 ? (
              <div className="relative">
                <select
                  value={selectedAudioDevice}
                  onChange={(e) => handleAudioDeviceChange(e.target.value)}
                  className="w-full p-3 rounded-lg border appearance-none cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                    color: isDarkMode ? "#ffffff" : "#1a1a1a",
                    borderColor: isDarkMode ? "#404040" : "#e5e5e5",
                  }}
                >
                  {audioDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm pointer-events-none"
                  style={{ color: isDarkMode ? "#cccccc" : "#666666" }}
                />
              </div>
            ) : (
              <div
                className="w-full p-3 rounded-lg border text-center"
                style={{
                  backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                  color: isDarkMode ? "#cccccc" : "#666666",
                  borderColor: isDarkMode ? "#404040" : "#e5e5e5",
                }}
              >
                No microphone detected
              </div>
            )}
          </div>

          {/* Video Device Selection */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: isDarkMode ? "#cccccc" : "#666666" }}
            >
              Camera
            </label>
            {videoDevices.length > 0 ? (
              <div className="relative">
                <select
                  value={selectedVideoDevice}
                  onChange={(e) => handleVideoDeviceChange(e.target.value)}
                  className="w-full p-3 rounded-lg border appearance-none cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                    color: isDarkMode ? "#ffffff" : "#1a1a1a",
                    borderColor: isDarkMode ? "#404040" : "#e5e5e5",
                  }}
                >
                  {videoDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm pointer-events-none"
                  style={{ color: isDarkMode ? "#cccccc" : "#666666" }}
                />
              </div>
            ) : (
              <div>
                <div
                  className="w-full p-3 rounded-lg border text-center mb-2"
                  style={{
                    backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                    color: isDarkMode ? "#cccccc" : "#666666",
                    borderColor: isDarkMode ? "#404040" : "#e5e5e5",
                  }}
                >
                  No camera detected
                </div>
                <button
                  onClick={handleRetryVideo}
                  className="w-full p-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: primaryAccentColor,
                    color: "#ffffff",
                  }}
                >
                  Retry Camera Detection
                </button>
              </div>
            )}
          </div>

          {/* Device Info */}
          <div
            className="mt-4 p-3 rounded-lg text-xs"
            style={{
              backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
              color: isDarkMode ? "#cccccc" : "#666666",
            }}
          >
            <p>Found {audioDevices.length} microphone(s) and {videoDevices.length} camera(s)</p>
          </div>
        </div>
        </>
      )}

      {/* Join Requests Modal */}
      {showJoinRequests && isRoomAdmin && (
        <>
          {/* Overlay to close modal when clicking outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowJoinRequests(false)}
          />
          <div
            className="absolute bottom-20 left-10 bg-white dark:bg-gray-800 rounded-xl shadow-xl border p-6 min-w-[400px] z-50"
            style={{
              backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
              borderColor: isDarkMode ? "#333333" : "#e5e5e5",
              boxShadow: isDarkMode
                ? "0 20px 40px rgba(0, 0, 0, 0.5)"
                : "0 20px 40px rgba(0, 0, 0, 0.15)",
            }}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <h3
                className="text-lg font-semibold"
                style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}
              >
                Join Requests ({pendingRequests.length})
              </h3>
              <button
                onClick={() => setShowJoinRequests(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5",
                  color: isDarkMode ? "#ffffff" : "#1a1a1a",
                }}
              >
                <FontAwesomeIcon icon={faTimes} className="text-sm" />
              </button>
            </div>

            {/* Requests List */}
            {pendingRequests.length === 0 ? (
              <div
                className="text-center py-8"
                style={{ color: isDarkMode ? "#cccccc" : "#666666" }}
              >
                <FontAwesomeIcon icon={faUserPlus} className="text-4xl mb-4 opacity-50" />
                <p>No pending join requests</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {pendingRequests.map((request, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border flex items-center justify-between"
                    style={{
                      backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                      borderColor: isDarkMode ? "#404040" : "#e5e5e5",
                    }}
                  >
                    <div className="flex-1">
                      <p
                        className="font-medium"
                        style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}
                      >
                        {request.user?.fullname?.firstname 
                          ? `${request.user.fullname.firstname} ${request.user.fullname.lastname}`
                          : `User ${request.userId.slice(-6)}`
                        }
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: isDarkMode ? "#cccccc" : "#666666" }}
                      >
                        Requested {new Date(request.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveRequest(request.userId)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
                        style={{
                          backgroundColor: "#10b981",
                          color: "#ffffff",
                        }}
                        title="Approve"
                      >
                        <FontAwesomeIcon icon={faCheck} className="text-sm" />
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.userId)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
                        style={{
                          backgroundColor: "#ef4444",
                          color: "#ffffff",
                        }}
                        title="Reject"
                      >
                        <FontAwesomeIcon icon={faX} className="text-sm" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
