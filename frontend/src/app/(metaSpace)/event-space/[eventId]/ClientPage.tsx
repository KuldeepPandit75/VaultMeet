"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useSocket } from "@/context/SocketContext";
import { useSocketStore, Message } from "@/Zustand_Store/SocketStore";
import { ChatBox } from "@/components/Game/ChatBox";
import { ControlBar } from "@/components/Game/ControlBar";
import ReportModal from "@/components/Game/Modals/ReportModal";
import HelpModal from "@/components/Game/Modals/HelpModal";
import {
  toggleCamera,
  toggleMicrophone,
  toggleScreenShare,
  cleanupAgoraClient,
  onScreenShareStateChange,
} from "@/components/Game/agora";
const PhaserGame = dynamic(() => import("@/components/Game/PhaserGame"), {
  ssr: false,
});
const WhiteBoard = dynamic(
  () =>
    import("@/components/Game/WhiteBoard").then((mod) => ({
      default: mod.WhiteBoard,
    })),
  {
    ssr: false,
  }
);
import initializeClient, { onMicStateChange, onVideoStateChange } from "@/components/Game/agora";
import useAuthStore, { User } from "@/Zustand_Store/AuthStore";
import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import UserSummaryCard from "@/components/Game/Modals/UserSummaryCard";
import Image from "next/image";
import useEventStore from "@/Zustand_Store/EventStore";
import { useParams, useRouter } from "next/navigation";
import useChatStore from "@/Zustand_Store/ChatStore";

type ExtendedAgoraUser = IAgoraRTCRemoteUser & {
  _video_muted_?: boolean;
  _audio_muted_?: boolean;
};

const EventSpace = () => {
  const [mic, setMic] = useState(false); // Initially muted (matches Agora audio track initial state)
  const [video, setVideo] = useState(false); // Initially disabled (matches Agora video track initial state)
  const [screenShare, setScreenShare] = useState(false);
  const [typedMsg, setTypedMsg] = useState("");
  const { socket } = useSocket();
  const { messages, addMessage, remoteUsers, setIsWhiteboardOpen, unreadCount, incrementUnreadCount, clearUnreadCount } =
    useSocketStore();
  const { getUserBySocketId, profileBox, setProfileBox } = useAuthStore();
  const { isInGameChatOpen, setIsInGameChatOpen } = useChatStore();
  const { getEventById, currentEvent, loading: eventLoading } = useEventStore();
  const { primaryAccentColor, isDarkMode } = useThemeStore();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [userDatas, setUserDatas] = useState<
    { [key: string]: User } | undefined
  >();
  const [viewMode, setViewMode] = useState<"game" | "meeting" | "whiteboard">(
    "game"
  );
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  // Check logged in or not
  // useEffect(()=>{
  //   if(!user){
  //     router.push("/login")
  //   }
  // })

  useEffect(() => {
    if (eventId) {
      getEventById(eventId);
    }
  }, [eventId, getEventById]);

  const toggleViewMode = () => {
    if (viewMode === "game") {
      setViewMode("meeting");
    } else if (viewMode === "meeting") {
      setViewMode("game");
    } else if (viewMode === "whiteboard") {
      setViewMode("game");
    }
  };

  // Debug remote users changes
  useEffect(() => {
    console.log("Remote users changed:", remoteUsers);
  }, [remoteUsers]);

  // Listen for video container creation events
  useEffect(() => {
    const handleVideoContainerCreated = (event: CustomEvent) => {
      console.log("Video container created for user:", event.detail.userId);
      // Force a re-render by updating a state
      setIsInGameChatOpen(!isInGameChatOpen); // This will trigger a re-render
    };

    window.addEventListener(
      "videoContainerCreated",
      handleVideoContainerCreated as EventListener
    );

    return () => {
      window.removeEventListener(
        "videoContainerCreated",
        handleVideoContainerCreated as EventListener
      );
    };
  }, []);

  // Listen for whiteboard open events from the game
  useEffect(() => {
    const handleOpenWhiteboard = (event: CustomEvent) => {
      console.log("Opening whiteboard from game:", event.detail);
      if (currentRoomId) {
        setIsWhiteboardOpen(true);
        setViewMode("whiteboard");
      } else {
        // If no room, create a default room for whiteboard
        const defaultRoomId = "whiteboard";
        setCurrentRoomId(defaultRoomId);
        setIsWhiteboardOpen(true);
        setViewMode("whiteboard");
      }
    };

    window.addEventListener(
      "openWhiteboard",
      handleOpenWhiteboard as EventListener
    );

    return () => {
      window.removeEventListener(
        "openWhiteboard",
        handleOpenWhiteboard as EventListener
      );
    };
  }, [currentRoomId, setIsWhiteboardOpen]);

  // Register screen share state change callback
  useEffect(() => {
    onScreenShareStateChange((isSharing: boolean) => {
      console.log("Screen share state changed:", isSharing);
      setScreenShare(isSharing);
    });
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Connect socket first
    socket.connect();

    // Wait for socket to be connected before initializing Agora client
    const handleConnect = () => {
      console.log("Socket connected, initializing Agora client");
      initializeClient(socket);
      
      // Register callbacks for mic and video state changes
      onMicStateChange((isMuted: boolean) => {
        setMic(!isMuted); // ControlBar expects mic to be true when unmuted
      });
      
      onVideoStateChange((isEnabled: boolean) => {
        setVideo(isEnabled); // ControlBar expects video to be true when enabled
      });
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on("connect", handleConnect);
    }

    // Listen for incoming messages
    socket.on(
      "receiveMessage",
      (data: { message: string; senderId: string }) => {
        const newMessage: Message = {
          message: data.message,
          senderId: data.senderId,
          userId: data.senderId,
          timestamp: Date.now(),
        };
        if (data.senderId !== socket?.id) {
          addMessage(newMessage);
          // Increment unread count for messages from others
          incrementUnreadCount();
        }
      }
    );

    // Listen for whiteboard interaction events
    socket.on(
      "whiteboardInteraction",
      (data: { action: string; playerId: string }) => {
        if (data.action === "open" && currentRoomId) {
          setIsWhiteboardOpen(true);
          setViewMode("whiteboard");
        }
      }
    );

    // Listen for event-specific events
    socket.on("eventSpaceJoined", (data: { eventId: string; roomId: string; existingPlayers: { id: string; x: number; y: number }[] }) => {
        console.log("Joined event space:", data.eventId, "Room:", data.roomId, "Existing players:", data.existingPlayers);
        setCurrentRoomId(data.roomId);
      });

    return () => {
      console.log("Cleaning up event space socket listeners...");
      socket.off("connect", handleConnect);
      socket.off("receiveMessage");
      socket.off("joinedRoom");
      socket.off("whiteboardInteraction");
      socket.off("eventSpaceJoined");
      
      // Clean up Agora client
      cleanupAgoraClient();
    };
  }, [socket, addMessage, currentRoomId, setIsWhiteboardOpen]);

  // Fetch user names for remote users
  useEffect(() => {
    const fetchUserNames = async () => {
      const names: { [key: string]: User } = {};
      for (const user of remoteUsers) {
        try {
          const userData = await getUserBySocketId(user.uid.toString());
          names[user.uid] = userData;
        } catch (error) {
          console.error("Error fetching user name:", error);
        }
      }
      setUserDatas(names);
    };

    fetchUserNames();
  }, [remoteUsers, getUserBySocketId]);

  const handleSentMsg = () => {
    if (!typedMsg.trim() || !socket || !socket.id) return;

    socket.emit("sendMsg", {
      message: typedMsg,
    });

    const newMessage: Message = {
      message: typedMsg,
      senderId: socket.id,
      userId: socket.id,
      timestamp: Date.now(),
    };
    addMessage(newMessage);
    setTypedMsg("");
  };

  const handleMicToggle = async () => {
    await toggleMicrophone();
    // State will be updated by the callback registered with onMicStateChange
  };

  const handleVideoToggle = async () => {
    await toggleCamera();
    // State will be updated by the callback registered with onVideoStateChange
  };

  const handleScreenShareToggle = async () => {
    const success = await toggleScreenShare();
    if (success) {
      setScreenShare(!screenShare);
    }
  };

  const onClose = () => {
    setProfileBox("close");
  };

  // Custom setBox function that clears unread count when chat is opened
  const handleSetBox = (newBox: boolean) => {
    if (!isInGameChatOpen) {
      // Clear unread count when chat is opened
      clearUnreadCount();
    }
    setIsInGameChatOpen(newBox);
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      console.log("Event space component unmounting, cleaning up...");
      // Clean up Agora client
      cleanupAgoraClient();
      // Clear messages
      useSocketStore.getState().setMessages([]);
      // Close whiteboard if open
      setIsWhiteboardOpen(false);
    };
  }, [setIsWhiteboardOpen]);

  const renderUserState = (user: IAgoraRTCRemoteUser) => {
    const isVideoEnabled = !(user as ExtendedAgoraUser)._video_muted_;
    const isAudioEnabled = !(user as ExtendedAgoraUser)._audio_muted_;

    console.log(isVideoEnabled, isAudioEnabled);

    return (
      <div className="absolute bottom-2 right-2 flex gap-1">
        {!isAudioEnabled && (
          <div
            className="rounded-full p-1.5 shadow-lg"
            style={{ backgroundColor: "#ef4444" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
        {!isVideoEnabled && (
          <div
            className="rounded-full p-1.5 shadow-lg"
            style={{ backgroundColor: "#ef4444" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          </div>
        )}
      </div>
    );
  };

  if (eventLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: primaryAccentColor }}
        ></div>
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Event not found
      </div>
    );
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: isDarkMode ? "#0f0f0f" : "#f8f9fa" }}
    >
      {/* Event Header */}
      {currentEvent && viewMode === "game" && (
      <div className="absolute top-0 left-0 right-0 z-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 bg-black/50 px-4 py-2 rounded-lg">
            <button
              onClick={() => router.push(`/events/${eventId}`)}
              className="text-white hover:text-gray-300 transition-colors"
            >
              ←
            </button>
            <div className="text-white">
              <h1 className="text-xl font-bold">{currentEvent.name}</h1>
              <p className="text-sm text-gray-300">Virtual Event Space</p>
            </div>
          </div>
          {/* <div className="text-white text-sm">
            <p>Participants: {currentEvent.stats.approvedParticipants}</p>
            </div> */}
          </div>
        </div>
      )}

      {/* Main game container */}
      <div className={`flex-1 relative ${viewMode !== "game" ? "hidden" : ""}`}>
        <PhaserGame eventId={eventId} mapType="event"/>
      </div>

      {/* Whiteboard View */}
      {viewMode === "whiteboard" && currentRoomId && (
        <div className="flex-1 relative flex flex-col">

          {/* Whiteboard Content - Takes most of the space */}
          <div className="flex-1 relative">
            <WhiteBoard roomId={currentRoomId} />
          </div>
        </div>
      )}

      {/* Chat Box */}
      {isInGameChatOpen ? (
        <ChatBox
          messages={messages}
          socket={socket}
          handleSentMsg={handleSentMsg}
          setTypedMsg={setTypedMsg}
          typedMsg={typedMsg}
          onChatOpen={clearUnreadCount}
          onClose={() => setIsInGameChatOpen(false)}
        />
      ) : null}

      {/* Control bar */}
      <ControlBar
        mic={mic}
        video={video}
        screenShare={screenShare}
        handleMicToggle={handleMicToggle}
        handleVideoToggle={handleVideoToggle}
        handleScreenShareToggle={handleScreenShareToggle}
        setBox={handleSetBox}
        viewMode={viewMode}
        handleViewToggle={toggleViewMode}
        isMeetingViewAvailable={remoteUsers.length > 0}
        unreadCount={unreadCount}
        setIsReportModalOpen={setIsReportModalOpen}
        setIsHelpModalOpen={setIsHelpModalOpen}
        setIsModerationModalOpen={() => {}}
      />

      {/* Profile Box */}
      {profileBox !== "close" && (
        <div className="z-50">
          <UserSummaryCard onClose={onClose} />
        </div>
      )}

      {/* Remote Users Video Containers */}
      {remoteUsers.length > 0 && (
        <div
          className={`connectedUsers absolute z-40 transition-all duration-500 ${
            viewMode === "game"
              ? "top-6 left-1/2 -translate-x-1/2 flex gap-4 max-w-[85vw] flex-wrap justify-center"
              : "top-0 left-0 w-full h-full p-4 pb-[80px] grid gap-4 place-items-center"
          }
          ${viewMode === "whiteboard" ? "hidden" : ""}
          `}
          style={{
            gridTemplateColumns:
              viewMode === "meeting"
                ? "repeat(auto-fit, minmax(300px, 1fr))"
                : undefined,
          }}
        >
          {remoteUsers.map((user) => (
            <div
              key={user.uid}
              className={`relative group ${
                viewMode === "meeting"
                  ? "w-full max-w-[700px] aspect-[16/9]"
                  : ""
              }`}
              style={{
                transform: "translateZ(0)",
                transition: "all 0.3s ease",
              }}
            >
              <div
                id={`user-container-${user.uid}`}
                className={`video-player rounded-xl relative overflow-hidden shadow-lg border-2 transition-all duration-300 w-full ${
                  viewMode === "meeting" ? "h-auto aspect-[16/9]" : "h-full"
                }`}
                style={{
                  width: viewMode === "game" ? "12vw" : "100%",
                  height: viewMode === "game" ? "14vh" : "100%",
                  minWidth: "140px",
                  minHeight: "100px",
                  backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
                  borderColor: isDarkMode ? "#333333" : "#e5e5e5",
                  boxShadow: isDarkMode
                    ? "0 8px 25px -8px rgba(0, 0, 0, 0.5)"
                    : "0 8px 25px -8px rgba(0, 0, 0, 0.15)",
                }}
              >
                {!user.hasVideo && (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      backgroundColor: isDarkMode ? "#2a2a2a" : "#f5f5f5",
                      backgroundImage: isDarkMode
                        ? "linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)"
                        : "linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)",
                    }}
                  >
                    <div
                      className="h-[70px] w-[70px] flex items-center justify-center rounded-full text-white font-bold text-lg shadow-lg"
                      style={{
                        backgroundColor: primaryAccentColor,
                        boxShadow: `0 4px 12px ${primaryAccentColor}40`,
                      }}
                    >
                      {userDatas?.[user.uid]?.avatar ? (
                        <Image
                          src={userDatas?.[user.uid]?.avatar || ""}
                          alt="User Avatar"
                          height={100}
                          width={100}
                          className="h-[70px] w-[70px] rounded-full object-cover"
                          style={{ backgroundColor: primaryAccentColor }}
                        />
                      ) : (
                        <div
                          className="h-[70px] w-[70px] flex items-center justify-center rounded-full text-white font-bold text-lg shadow-lg"
                          style={{
                            backgroundColor: primaryAccentColor,
                            boxShadow: `0 4px 12px ${primaryAccentColor}40`,
                          }}
                        >
                          {userDatas?.[user.uid]?.fullname?.firstname?.charAt(
                            0
                          ) || "U"}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {renderUserState(user)}

                {/* User Name Badge */}
                <div
                  className="absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-medium shadow-lg"
                  style={{
                    backgroundColor: isDarkMode
                      ? "rgba(0, 0, 0, 0.7)"
                      : "rgba(255, 255, 255, 0.9)",
                    color: isDarkMode ? "#ffffff" : "#1a1a1a",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {userDatas?.[user.uid]?.fullname?.firstname ||
                    `User ${String(user.uid).slice(-4)}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Modal */}
      {isReportModalOpen && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          eventId={eventId}
        />
      )}

      {/* Help Modal */}
      {isHelpModalOpen && (
        <HelpModal
          isOpen={isHelpModalOpen}
          onClose={() => setIsHelpModalOpen(false)}
        />
      )}
    </div>
  );
};

export default EventSpace;
