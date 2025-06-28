'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useSocketStore, Message } from '@/Zustand_Store/SocketStore';
import { ChatBox } from '@/components/Game/ChatBox';
import { ControlBar } from '@/components/Game/ControlBar';
import { toggleCamera, toggleMicrophone, toggleScreenShare } from '@/components/Game/agora';
const PhaserGame = dynamic(() => import('@/components/Game/PhaserGame'), { ssr: false });
import initializeClient from '@/components/Game/agora';
import useAuthStore from '@/Zustand_Store/AuthStore';
import { useThemeStore } from '@/Zustand_Store/ThemeStore';
import { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import UserSummaryCard from '@/components/Game/Modals/UserSummaryCard';

type ExtendedAgoraUser = IAgoraRTCRemoteUser & {
  _video_muted_?: boolean;
  _audio_muted_?: boolean;
};

const CodingSpace = () => {
  const [mic, setMic] = useState(false);
  const [video, setVideo] = useState(false);
  const [screenShare, setScreenShare] = useState(false);
  const [box, setBox] = useState(false);
  const [typedMsg, setTypedMsg] = useState("");
  const {socket} = useSocket();
  const { messages, addMessage, remoteUsers } = useSocketStore();
  const { getUserBySocketId, profileBox, setProfileBox } = useAuthStore();
  const { primaryAccentColor, isDarkMode } = useThemeStore();
  const [userNames, setUserNames] = useState<{[key: string]: string}>({});

  console.log(remoteUsers);

  // Debug remote users changes
  useEffect(() => {
    console.log("Remote users changed:", remoteUsers);
  }, [remoteUsers]);

  // Listen for video container creation events
  useEffect(() => {
    const handleVideoContainerCreated = (event: CustomEvent) => {
      console.log("Video container created for user:", event.detail.userId);
      // Force a re-render by updating a state
      setBox(prev => prev); // This will trigger a re-render
    };

    window.addEventListener('videoContainerCreated', handleVideoContainerCreated as EventListener);

    return () => {
      window.removeEventListener('videoContainerCreated', handleVideoContainerCreated as EventListener);
    };
  }, []);

  useEffect(() => {
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
      socket.on('connect', handleConnect);
    }

    // Listen for incoming messages
    socket.on('receiveMessage', (data: { message: string; senderId: string }) => {
      const newMessage: Message = {
        message: data.message,
        senderId: data.senderId,
        userId: data.senderId,
        timestamp: Date.now(),
      };
      if(data.senderId !== socket?.id){
        addMessage(newMessage);
      }
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('receiveMessage');
    };
  }, [socket, addMessage]);

  // Fetch user names for remote users
  useEffect(() => {
    const fetchUserNames = async () => {
      const names: {[key: string]: string} = {};
      for (const user of remoteUsers) {
        try {
          const userData = await getUserBySocketId(user.uid.toString());
          names[user.uid] = userData.fullname.firstname;
        } catch (error) {
          console.error('Error fetching user name:', error);
        }
      }
      setUserNames(names);
    };

    fetchUserNames();
  }, [remoteUsers, getUserBySocketId]);

  const handleSentMsg = () => {
    if (!typedMsg.trim() || !socket || !socket.id) return;

    socket.emit('sendMsg', {
      message: typedMsg
    });
    
    const newMessage: Message = {
      message: typedMsg,
      senderId: socket.id,
      userId: socket.id,
      timestamp: Date.now(),
    };
    addMessage(newMessage);
    setTypedMsg('');
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
    const success = await toggleScreenShare();
    if (success) {
      setScreenShare(!screenShare);
    }
  };

  const onClose=()=>{
    setProfileBox('close')
  }

  const renderUserState = (user: IAgoraRTCRemoteUser) => {
    const isVideoEnabled = !(user as ExtendedAgoraUser)._video_muted_;
    const isAudioEnabled = !(user as ExtendedAgoraUser)._audio_muted_;

    console.log(isVideoEnabled, isAudioEnabled);
    
    return (
      <div className="absolute bottom-2 right-2 flex gap-1">
        {!isAudioEnabled && (
          <div 
            className="rounded-full p-1.5 shadow-lg"
            style={{ backgroundColor: '#ef4444' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        {!isVideoEnabled && (
          <div 
            className="rounded-full p-1.5 shadow-lg"
            style={{ backgroundColor: '#ef4444' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: isDarkMode ? '#0f0f0f' : '#f8f9fa' }}
    >
      {/* Main game container */}
      <div className="flex-1 relative">
        <PhaserGame />
      </div>

      {/* Chat Box */}
      {box ? (
        <ChatBox messages={messages} socket={socket} handleSentMsg={handleSentMsg} setTypedMsg={setTypedMsg} typedMsg={typedMsg} />
      ) : null}

      {/* Control bar */}
      <ControlBar 
        mic={mic} 
        video={video} 
        screenShare={screenShare}
        handleMicToggle={handleMicToggle} 
        handleVideoToggle={handleVideoToggle} 
        handleScreenShareToggle={handleScreenShareToggle}
        setBox={setBox}
      />

      {/* Profile Box */}
      {profileBox !== "close" && (
        <div className="z-50">
          <UserSummaryCard onClose={onClose}/>
        </div>
      )}

      {/* Remote Users Video Containers */}
      <div 
        className="connectedUsers absolute top-6 left-1/2 -translate-x-1/2 flex gap-4 max-w-[85vw] flex-wrap justify-center z-40 p-4 rounded-2xl backdrop-blur-sm"
      >
        {remoteUsers.length === 0 ? null : (
          remoteUsers.map((user) => (
            <div 
              key={user.uid} 
              className="relative group"
              style={{
                transform: 'translateZ(0)',
                transition: 'all 0.3s ease'
              }}
            >
              <div 
                id={`user-container-${user.uid}`} 
                className="video-player rounded-xl relative overflow-hidden shadow-lg border-2 transition-all duration-300 group-hover:scale-105"
                style={{
                  width: '12vw',
                  height: '14vh',
                  minWidth: '140px',
                  minHeight: '100px',
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                  borderColor: isDarkMode ? '#333333' : '#e5e5e5',
                  boxShadow: isDarkMode 
                    ? '0 8px 25px -8px rgba(0, 0, 0, 0.5)' 
                    : '0 8px 25px -8px rgba(0, 0, 0, 0.15)'
                }}
              >
                {!user.hasVideo && (
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{ 
                      backgroundColor: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                      backgroundImage: isDarkMode 
                        ? 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)'
                        : 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)'
                    }}
                  >
                    <div 
                      className="h-12 w-12 flex items-center justify-center rounded-full text-white font-bold text-lg shadow-lg"
                      style={{ 
                        backgroundColor: primaryAccentColor,
                        boxShadow: `0 4px 12px ${primaryAccentColor}40`
                      }}
                    >
                      {userNames[user.uid]?.charAt(0) || '?'}
                    </div>
                  </div>
                )}
                {renderUserState(user)}
                
                {/* User Name Badge */}
                <div 
                  className="absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-medium shadow-lg"
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
                    color: isDarkMode ? '#ffffff' : '#1a1a1a',
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  {userNames[user.uid] || `User ${String(user.uid).slice(-4)}`}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CodingSpace; 