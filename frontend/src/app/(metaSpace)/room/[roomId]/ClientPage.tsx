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
  muteRemoteUserAudio,
  muteRemoteUserVideo,
} from "@/components/Game/agora";
const PhaserGame = dynamic(() => import("@/components/Game/PhaserGame"), {
  ssr: false,
});
const WhiteBoard = dynamic(() => import("@/components/Game/WhiteBoard").then(mod => ({ default: mod.WhiteBoard })), {
  ssr: false,
});
import initializeClient, { onMicStateChange, onVideoStateChange } from "@/components/Game/agora";
import useAuthStore, { User } from "@/Zustand_Store/AuthStore";
import { useThemeStore } from "@/Zustand_Store/ThemeStore";
import UserSummaryCard from "@/components/Game/Modals/UserSummaryCard";
import useChatStore from "@/Zustand_Store/ChatStore";
import { useParams } from "next/navigation";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "react-hot-toast";
import CodingChallengeInterface from "@/components/Game/CodingChallenge/CodingChallengeInterface";
import type { DSAQuestion } from "@/data/dsaQuestions";
import { pointsService } from "@/services/pointsService";
import RoomInviteModal from "@/components/Game/Modals/RoomInviteModal";
import ReportModal from "@/components/Game/Modals/ReportModal";
import HelpModal from "@/components/Game/Modals/HelpModal";
import ModerationModal from "@/components/Game/Modals/ModerationModal";
import { VCCards } from "@/components/Game/VCCards";

interface Notification {
  id: string;
  message: string;
  timestamp: number;
  read: boolean;
  type?: 'challenge';
  challengeId?: string;
  challengerInfo?: {
    socketId: string;
    userId: string;
    username: string;
    fullname: {
      firstname: string;
      lastname: string;
    };
  };
  question?: {
    id: string;
    title: string;
    difficulty: string;
    timeLimit: number;
  };
  timer?: number; // Countdown timer for challenge notifications
}



interface ChallengeEvent {
  challengeId: string;
  challengerInfo: {
    socketId: string;
    userId: string;
    username: string;
    fullname: {
      firstname: string;
      lastname: string;
    };
  };
  question: {
    id: string;
    title: string;
    difficulty: string;
    timeLimit: number;
  };
  timestamp: number;
}

const CodingSpace = () => {
  const params = useParams();
  const roomId = params.roomId as string;
  
  const [mic, setMic] = useState(false); // Initially muted (matches Agora audio track initial state)
  const [video, setVideo] = useState(false); // Initially disabled (matches Agora video track initial state)
  const [screenShare, setScreenShare] = useState(false);
  const [waiting, setWaiting] = useState("Getting the room ready....");
  const [typedMsg, setTypedMsg] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isModerationModalOpen, setIsModerationModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(true);
  const [isRoomAdmin, setIsRoomAdmin] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket();
  const { messages, addMessage, remoteUsers, setIsWhiteboardOpen, unreadCount, incrementUnreadCount, clearUnreadCount, checkRoomPermission, setCurrentRoom, joinRoomRequest,currentRoom } = useSocketStore();
  const { getUserBySocketId, profileBox, setProfileBox } = useAuthStore();
  const { isInGameChatOpen, setIsInGameChatOpen } = useChatStore();
  const { isDarkMode, primaryAccentColor } = useThemeStore();
  const isInGameChatOpenRef = useRef(isInGameChatOpen);
  const [userDatas, setUserDatas] = useState<
    { [key: string]: User } | undefined
  >();
  const [viewMode, setViewMode] = useState<"game" | "meeting" | "whiteboard">("game");
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(roomId);
  const [challengeRoom, setChallengeRoom] = useState<{
    roomId: string;
    question: DSAQuestion;
    opponent: { socketId: string; userId: string };
    role: 'challenger' | 'accepter';
  } | null>(null);
  const router= useRouter();
  const pathname = usePathname();
  const {user} = useAuthStore();

  // const demoUsers = [
  //   {
  //     uid: "demo1",
  //     hasVideo: true,
  //     hasAudio: true,
  //     _video_muted_: false,
  //     _audio_muted_: false,
  //     fullname: { firstname: "Alice", lastname: "Johnson" },
  //     avatar: null
  //   },
  //   {
  //     uid: "demo2", 
  //     hasVideo: false,
  //     hasAudio: true,
  //     _video_muted_: true,
  //     _audio_muted_: false,
  //     fullname: { firstname: "Bob", lastname: "Smith" },
  //     avatar: null
  //   },
  //   {
  //     uid: "demo3",
  //     hasVideo: true,
  //     hasAudio: false,
  //     _video_muted_: false,
  //     _audio_muted_: true,
  //     fullname: { firstname: "Carol", lastname: "Davis" },
  //     avatar: null
  //   },
  //   {
  //     uid: "demo4",
  //     hasVideo: true,
  //     hasAudio: true,
  //     _video_muted_: false,
  //     _audio_muted_: false,
  //     fullname: { firstname: "David", lastname: "Wilson" },
  //     avatar: null
  //   },
  //   {
  //     uid: "demo5",
  //     hasVideo: false,
  //     hasAudio: false,
  //     _video_muted_: true,
  //     _audio_muted_: true,
  //     fullname: { firstname: "Eva", lastname: "Brown" },
  //     avatar: null
  //   },
  //   {
  //     uid: "demo6",
  //     hasVideo: true,
  //     hasAudio: true,
  //     _video_muted_: false,
  //     _audio_muted_: false,
  //     fullname: { firstname: "Frank", lastname: "Miller" },
  //     avatar: null
  //   },
  //   {
  //     uid: "demo7",
  //     hasVideo: true,
  //     hasAudio: true,
  //     _video_muted_: false,
  //     _audio_muted_: false,
  //     fullname: { firstname: "Grace", lastname: "Taylor" },
  //     avatar: null
  //   },
  //   {
  //     uid: "demo8",
  //     hasVideo: false,
  //     hasAudio: true,
  //     _video_muted_: true,
  //     _audio_muted_: false,
  //     fullname: { firstname: "Henry", lastname: "Anderson" },
  //     avatar: null
  //   },
  //   {
  //     uid: "demo9",
  //     hasVideo: true,
  //     hasAudio: true,
  //     _video_muted_: false,
  //     _audio_muted_: false,
  //     fullname: { firstname: "Ivy", lastname: "Thomas" },
  //     avatar: null
  //   },
  //   {
  //     uid: "demo10",
  //     hasVideo: true,
  //     hasAudio: false,
  //     _video_muted_: false,
  //     _audio_muted_: true,
  //     fullname: { firstname: "Jack", lastname: "Jackson" },
  //     avatar: null
  //   }
  // ];

  // Handle click outside notification panel
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationPanelOpen(false);
      }
    };

    if (isNotificationPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationPanelOpen]);

  // Toggle notification panel
  const toggleNotificationPanel = () => {
    setIsNotificationPanelOpen(!isNotificationPanelOpen);
  };

  // Add notification
  const addNotification = (message: string, type?: 'challenge', challengeData?: ChallengeEvent) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      message,
      timestamp: Date.now(),
      read: false,
      type,
      ...(type === 'challenge' && challengeData && {
        challengeId: challengeData.challengeId,
        challengerInfo: challengeData.challengerInfo,
        question: challengeData.question,
        timer: type === 'challenge' ? 10 : undefined // 10 second timer for challenges
      })
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  // Handle challenge response
  const handleChallengeResponse = (challengeId: string, response: 'accept' | 'reject') => {
    if (!socket) return;
    
    socket.emit("respondToChallenge", { challengeId, response });
    
    // Remove the challenge notification completely
    setNotifications(prev => 
      prev.filter(notification => notification.challengeId !== challengeId)
    );
    
    if (response === 'accept') {
      toast.success("Challenge accepted!");
    } else {
      toast.error("Challenge rejected");
    }
  };

  // Check if current user is room admin
  useEffect(()=>{
    if(!currentRoom) return;
    console.log(currentRoom?.adminId.toString(), user?._id.toString())
    setIsRoomAdmin(currentRoom?.adminId.toString() === user?._id.toString());
  },[currentRoom]);

  // Timer effect for challenge notifications
  useEffect(() => {
    const timer = setInterval(() => {
      setNotifications(prev => {
        const updatedNotifications = prev.map(notification => {
          if (notification.type === 'challenge' && notification.timer && notification.timer > 0) {
            const newTimer = notification.timer - 1;
            
            // Auto-reject challenge when timer expires
            if (newTimer === 0 && notification.challengeId) {
              handleChallengeResponse(notification.challengeId, 'reject');
            }
            
            return { ...notification, timer: newTimer };
          }
          return notification;
        });
        
        // Remove notifications that have reached 0
        return updatedNotifications.filter(notification => 
          !(notification.type === 'challenge' && notification.timer === 0)
        );
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Get unread notifications count
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  
  useEffect(()=>{
    if(!socket) return;
    const checkPermission = async ()=>{
      const permission = await checkRoomPermission(roomId)
      console.log("debug",permission)
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

  // Listen for challenge events
  useEffect(() => {
    if (!socket) return;
    
    const handleReceiveChallenge = (data: ChallengeEvent) => {
      console.log("Received challenge:", data);
      const challengerName = data.challengerInfo.fullname?.firstname || data.challengerInfo.username || "Unknown User";
      addNotification(
        `${challengerName} has challenged you to solve "${data.question.title}"!`, 
        'challenge', 
        data
      );
      toast(`Challenge from ${challengerName}!`);
    };
    
    const handleChallengeAccepted = (data: { challengeId: string; targetSocketId: string }) => {
      console.log("Challenge accepted:", data);
      toast.success("Your challenge was accepted!");
    };
    
    const handleChallengeRejected = (data: { challengeId: string; targetSocketId: string }) => {
      console.log("Challenge rejected:", data);
      toast.error("Your challenge was rejected");
    };
    
    const handleChallengeCancelled = (data: { challengeId: string }) => {
      console.log("Challenge cancelled:", data);
      toast.error("Challenge was cancelled");
    };

    const handleChallengeRoomCreated = (data: {
      roomId: string;
      question: DSAQuestion;
      opponent: { socketId: string; userId: string };
      role: 'challenger' | 'accepter';
    }) => {
      console.log("Challenge room created:", data);
      setChallengeRoom(data);
      toast.success("Challenge started! Good luck!");
    };

    const handlePointsUpdate = async (data: { userId: string; pointsChange: number; reason: string }) => {
      console.log("Points update received:", data);
      
      // Update user points via API
      try {
        const result = await pointsService.updateUserPoints({
          userId: data.userId,
          pointsChange: data.pointsChange,
          reason: data.reason
        });
        
        console.log("Points updated successfully:", result);
        
        // Show notification to user about points change
        if (data.pointsChange > 0) {
          toast.success(`You earned ${data.pointsChange} points! ${data.reason}`);
        } else {
          toast.error(`You lost ${Math.abs(data.pointsChange)} points. ${data.reason}`);
        }
      } catch (error) {
        console.error("Error updating points:", error);
        toast.error("Failed to update points");
      }
    };
    
    socket.on("receiveChallenge", handleReceiveChallenge);
    socket.on("challengeAccepted", handleChallengeAccepted);
    socket.on("challengeRejected", handleChallengeRejected);
    socket.on("challengeCancelled", handleChallengeCancelled);
    socket.on("challengeRoomCreated", handleChallengeRoomCreated);
    socket.on("pointsUpdate", handlePointsUpdate);
    
    return () => {
      socket.off("receiveChallenge", handleReceiveChallenge);
      socket.off("challengeAccepted", handleChallengeAccepted);
      socket.off("challengeRejected", handleChallengeRejected);
      socket.off("challengeCancelled", handleChallengeCancelled);
      socket.off("challengeRoomCreated", handleChallengeRoomCreated);
      socket.off("pointsUpdate", handlePointsUpdate);
    };
  }, [socket]);

  // Listen for moderation events
  useEffect(() => {
    if (!socket) return;
    
    const handleModerationAction = async (data: {
      roomId: string;
      actionType: string;
      targetUserIds: string[];
      action: string;
    }) => {
      console.log("Moderation action received:", data);
      
      try {
        let success = false;
        
        switch (data.actionType) {
          case 'mute-audio':
            if (data.targetUserIds.includes(socket.id || "")) {
              success = await muteRemoteUserAudio();
            }
            break;
            
          case 'mute-video':
            if (data.targetUserIds.includes(socket.id || "")) {
              success = await muteRemoteUserVideo();
            }
            break;
            
          default:
            console.warn("Unknown moderation action:", data.actionType);
        }
        
        if (success) {
          const actionText = data.actionType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
          toast.success(`${actionText} applied successfully`);
        }
      } catch (error) {
        console.error("Error applying moderation action:", error);
        toast.error("Failed to apply moderation action");
      }
    };

    const handleUserBanned = (data: { roomId: string; reason: string }) => {
      console.log("User banned from room:", data);
      toast.error(`You have been banned from the room: ${data.reason}`);
      // Redirect to home page
      router.push("/");
    };

    const handleParticipantRemoved = (data: { roomId: string; reason: string }) => {
      console.log("Participant removed from room:", data);
      toast.error(`You have been removed from the room: ${data.reason}`);
      // Redirect to home page
      router.push("/");
    };
    
    socket.on("moderationAction", handleModerationAction);
    socket.on("userBanned", handleUserBanned);
    socket.on("participantRemoved", handleParticipantRemoved);
    
    return () => {
      socket.off("moderationAction", handleModerationAction);
      socket.off("userBanned", handleUserBanned);
      socket.off("participantRemoved", handleParticipantRemoved);
    };
  }, [socket, remoteUsers, router]);

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
    // State will be updated by the callback registered with onMicStateChange
  };

  const handleVideoToggle = async () => {
    await toggleCamera();
    // State will be updated by the callback registered with onVideoStateChange
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
      {isRoomAdmin && (
      <RoomInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        roomId={roomId}
        roomName="Coding Room"
      />
      )}
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
        setIsModerationModalOpen={setIsModerationModalOpen}
      />

      {/* Notification Icon */}
      <div className="absolute top-10 left-6 z-50" ref={notificationRef}>
        <button
          onClick={toggleNotificationPanel}
          className={`relative p-3 rounded-full transition-all duration-200 hover:scale-105 shadow-lg border ${
            isDarkMode ? "border-gray-600" : "border-gray-200"
          }`}
          style={{
            backgroundColor: isDarkMode ? "#1a1a1a" : "#f5f5f5",
            color: isDarkMode ? "#ffffff" : "#1a1a1a",
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="white" height={25} width={25}><path d="M320 64C302.3 64 288 78.3 288 96L288 99.2C215 114 160 178.6 160 256L160 277.7C160 325.8 143.6 372.5 113.6 410.1L103.8 422.3C98.7 428.6 96 436.4 96 444.5C96 464.1 111.9 480 131.5 480L508.4 480C528 480 543.9 464.1 543.9 444.5C543.9 436.4 541.2 428.6 536.1 422.3L526.3 410.1C496.4 372.5 480 325.8 480 277.7L480 256C480 178.6 425 114 352 99.2L352 96C352 78.3 337.7 64 320 64zM258 528C265.1 555.6 290.2 576 320 576C349.8 576 374.9 555.6 382 528L258 528z"/></svg>
          
          {/* Notification Badge */}
          {unreadNotificationsCount > 0 && (
            <span
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: primaryAccentColor }}
            >
              {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* Notification Panel */}
        {isNotificationPanelOpen && (
          <div
            className={`absolute top-14 left-0 w-80 max-h-96 overflow-y-auto rounded-lg shadow-xl`}
            style={{
              backgroundColor: isDarkMode ? "#1a1a1a" : "#f5f5f5",
              color: isDarkMode ? "#ffffff" : "#1a1a1a",
            }}
          >
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
              <h3 className="font-semibold text-lg">Notifications</h3>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 dark:border-gray-700 transition-colors ${
                      !notification.read 
                        ? "bg-blue-50 dark:bg-blue-900/20" 
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm ${!notification.read ? "font-medium" : ""}`}>
                          {notification.message}
                        </p>
                        
                        {/* Question details for challenge notifications */}
                        {notification.type === 'challenge' && notification.question && (
                          <div 
                            className="mt-2 p-2 rounded border"
                            style={{
                              backgroundColor: isDarkMode ? "#2a2a2a" : "#f8f9fa",
                              borderColor: isDarkMode ? "#333333" : "#e5e5e5",
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium" style={{ color: isDarkMode ? "#fff" : "#000" }}>
                                {notification.question.title}
                              </span>
                              <span 
                                className="text-xs px-2 py-1 rounded-full"
                                style={{
                                  backgroundColor: notification.question.difficulty === 'Easy' ? '#22c55e' : 
                                                 notification.question.difficulty === 'Medium' ? '#f59e0b' : '#ef4444',
                                  color: '#fff'
                                }}
                              >
                                {notification.question.difficulty}
                              </span>
                            </div>
                            <div className="text-xs mt-1" style={{ color: isDarkMode ? "#aaa" : "#666" }}>
                              Time Limit: {notification.question.timeLimit} minutes
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(notification.timestamp).toLocaleTimeString()}
                          </p>
                          {notification.type === 'challenge' && notification.timer !== undefined && (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                              <span className="text-xs font-medium" style={{ color: primaryAccentColor }}>
                                {notification.timer}s
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Challenge Action Buttons */}
                        {notification.type === 'challenge' && notification.challengeId && notification.timer && notification.timer > 0 && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChallengeResponse(notification.challengeId!, 'accept');
                              }}
                              className="px-3 py-1 text-xs rounded-full font-medium"
                              style={{
                                backgroundColor: primaryAccentColor,
                                color: isDarkMode ? "#18181b" : "#fff",
                              }}
                            >
                              Accept
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleChallengeResponse(notification.challengeId!, 'reject');
                              }}
                              className="px-3 py-1 text-xs rounded-full font-medium bg-red-500 text-white"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                      {!notification.read && (
                        <div
                          className="w-2 h-2 rounded-full ml-2"
                          style={{ backgroundColor: primaryAccentColor }}
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Profile Box */}
      {profileBox !== "close" && (
        <div className="z-50">
          <UserSummaryCard onClose={onClose} />
        </div>
      )}

      {/* Remote Users Video Containers */}
      {remoteUsers.length > 0 && 
        <VCCards remoteUsers={remoteUsers} viewMode={viewMode} userDatas={userDatas || {}} />
      } 

      {/* Coding Challenge Interface */}
      {challengeRoom && (
        <CodingChallengeInterface
          question={challengeRoom.question}
          roomId={challengeRoom.roomId}
          role={challengeRoom.role}
          opponent={challengeRoom.opponent}
          onClose={() => setChallengeRoom(null)}
        />
      )}

      {/* Report Modal */}
      {isReportModalOpen && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          roomId={roomId}
        />
      )}

      {/* Help Modal */}
      {isHelpModalOpen && (
        <HelpModal
          isOpen={isHelpModalOpen}
          onClose={() => setIsHelpModalOpen(false)}
        />
      )}

      {/* Moderation Modal */}
      {isModerationModalOpen && (
        <ModerationModal
          isOpen={isModerationModalOpen}
          onClose={() => setIsModerationModalOpen(false)}
          remoteUsers={remoteUsers}
          userDatas={userDatas || {}}
          roomId={roomId}
          socket={socket}
        />
      )}
    </div>
  );
};

export default CodingSpace; 