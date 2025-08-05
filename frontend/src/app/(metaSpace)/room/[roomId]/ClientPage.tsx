"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import { useSocket } from "@/context/SocketContext";
import { useSocketStore, Message } from "@/Zustand_Store/SocketStore";
import { ChatBox } from "@/components/Game/ChatBox";
import { ControlBar } from "@/components/Game/ControlBar";
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
const WhiteBoard = dynamic(() => import("@/components/Game/WhiteBoard").then(mod => ({ default: mod.WhiteBoard })), {
  ssr: false,
});
import initializeClient from "@/components/Game/agora";
import useAuthStore, { User } from "@/Zustand_Store/AuthStore";
import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import UserSummaryCard from "@/components/Game/Modals/UserSummaryCard";
import Image from "next/image";
import useChatStore from "@/Zustand_Store/ChatStore";
import { useParams } from "next/navigation";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "react-hot-toast";
// import { useRouter } from "next/navigation";

type ExtendedAgoraUser = IAgoraRTCRemoteUser & {
  _video_muted_?: boolean;
  _audio_muted_?: boolean;
};

const CodingSpace = () => {
  const params = useParams();
  const roomId = params.roomId as string;
  
  const [mic, setMic] = useState(false);
  const [video, setVideo] = useState(false);
  const [screenShare, setScreenShare] = useState(false);
  const [waiting, setWaiting] = useState("Getting the room ready....");
  const [typedMsg, setTypedMsg] = useState("");
  const { socket } = useSocket();
  const { messages, addMessage, remoteUsers, setIsWhiteboardOpen, unreadCount, incrementUnreadCount, clearUnreadCount, checkRoomPermission, setCurrentRoom, joinRoomRequest } = useSocketStore();
  const { getUserBySocketId, profileBox, setProfileBox } = useAuthStore();
  const { isInGameChatOpen, setIsInGameChatOpen } = useChatStore();
  const { isDarkMode, primaryAccentColor } = useThemeStore();
  const isInGameChatOpenRef = useRef(isInGameChatOpen);
  const [userDatas, setUserDatas] = useState<
    { [key: string]: User } | undefined
  >();
  const [viewMode, setViewMode] = useState<"game" | "meeting" | "whiteboard">("game");
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(roomId);
  const router= useRouter();
  const pathname = usePathname();
  const {user} = useAuthStore();
  // Check logged in or not
  // useEffect(()=>{
  //   if(!user){
  //     router.push("/login")
  //   }
  // })
  
  useEffect(()=>{
    if(!socket) return;
    const checkPermission = async ()=>{
      const permission = await checkRoomPermission(roomId)
      if(!permission.canJoin){
        if(permission.message === "Room not found" || permission.message === "You are banned from this room"){
          router.push("/")
          toast.error(permission.message)
        }else{
          await joinRoomRequest({roomId: roomId, socketId: socket.id || ""})
          socket.emit("joinRoomRequest",{
            roomId: roomId,
            socketId: socket.id,
            userId: user?._id,
            userInfo: {
              fullname: user?.fullname,
              username: user?.username,
              avatar: user?.avatar
            }
          })
          setWaiting("Waiting for admin approval...")
          setCurrentRoom(permission?.room || null)
        }
      }else{
        console.log(permission)
        setCurrentRoom(permission?.room || null)
        setWaiting("")
        
        // Set room admin if user is the admin
        if (permission.room?.adminId === user?._id) {
          socket.emit("setRoomAdmin", { roomId });
        }
        
      }
    }
    checkPermission()
  },[roomId,socket])

  // Listen for join request approval/rejection
  useEffect(() => {
    if (!socket) return;
    
    const handleApprovedRequest = (data: { roomId: string }) => {
      console.log("Join request approved for room:", data.roomId);
      toast.success("Your join request has been approved!");
      // Refresh the page or update the room state
      window.location.reload();
    };
    
    const handleRejectedRequest = (data: { roomId: string }) => {
      console.log("Join request rejected for room:", data.roomId);
      toast.error("Your join request has been rejected.");
      // Redirect to home or show rejection message
      router.push("/");
    };
    
    socket.on("approvedJoinRequest", handleApprovedRequest);
    socket.on("rejectedJoinRequest", handleRejectedRequest);
    
    return () => {
      socket.off("approvedJoinRequest", handleApprovedRequest);
      socket.off("rejectedJoinRequest", handleRejectedRequest);
    };
  }, [socket, router]);

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
        // Use the roomId from URL params for whiteboard
        setCurrentRoomId(roomId);
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
  }, [currentRoomId, setIsWhiteboardOpen, roomId]);

  // Keep ref updated with current chat state
  useEffect(() => {
    isInGameChatOpenRef.current = isInGameChatOpen;
  }, [isInGameChatOpen]);

  // Register screen share state change callback
  useEffect(() => {
    onScreenShareStateChange((isSharing: boolean) => {
      console.log("Screen share state changed:", isSharing);
      setScreenShare(isSharing);
    });
  }, []);

  useEffect(() => {
    console.log(socket,currentRoomId)
    if (!socket) return;

    // Connect socket first
    socket.connect();

    // Wait for socket to be connected before initializing Agora client
    const handleConnect = () => {
      console.log("Socket connected, initializing Agora client");
      initializeClient(socket);
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
          if(!isInGameChatOpenRef.current){
            console.log("incrementing unread count")
            incrementUnreadCount();
          }
        }
      }
    );

    // Listen for whiteboard interaction events
    socket.on("whiteboardInteraction", (data: { action: string; playerId: string }) => {
      if (data.action === "open" && currentRoomId) {
        setIsWhiteboardOpen(true);
        setViewMode("whiteboard");
      }
    });

    socket.on("approvedJoinRequest",()=>{
      setWaiting("")
    })

    return () => {
      console.log("Cleaning up coding space socket listeners...");
      socket.off("connect", handleConnect);
      socket.off("receiveMessage");
      socket.off("joinedRoom");
      socket.off("whiteboardInteraction");
      
      // Clean up Agora client
      cleanupAgoraClient();
    };
  }, [socket, addMessage, setIsWhiteboardOpen, pathname]); // Removed isInGameChatOpen dependency

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
    setMic(!mic);
  };

  const handleVideoToggle = async () => {
    await toggleCamera();
    setVideo(!video);
  };

  const handleScreenShareToggle = async () => {
    const newScreenShareState = await toggleScreenShare();
    setScreenShare(newScreenShareState);
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
      console.log("Coding space component unmounting, cleaning up...");
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

  // Waiting screen
  if (waiting!=="") {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ backgroundColor: isDarkMode ? "#0f0f0f" : "#f8f9fa" }}
      >
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2" style={{ borderColor: primaryAccentColor }}></div>
          </div>
          <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Joining Room
          </h2>
          <p className={`text-lg mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
            Room ID: <span className="font-mono font-semibold" style={{ color: primaryAccentColor }}>{roomId}</span>
          </p>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            {waiting}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: isDarkMode ? "#0f0f0f" : "#f8f9fa" }}
    >
      {/* Main game container */}
      <div className={`flex-1 relative ${viewMode !== "game" ? "hidden" : ""}`}>
        <PhaserGame mapType="general" roomId={roomId} />
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
    </div>
  );
};

export default CodingSpace; 