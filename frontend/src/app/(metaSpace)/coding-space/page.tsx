'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useSocketStore, Message } from '@/Zustand_Store/SocketStore';
import { ChatBox } from '@/components/Game/ChatBox';
import { ControlBar } from '@/components/Game/ControlBar';
import { toggleCamera, toggleMicrophone } from '@/components/Game/agora';
const PhaserGame = dynamic(() => import('@/components/Game/PhaserGame'), { ssr: false });
import initializeClient from '@/components/Game/agora';
import useAuthStore from '@/Zustand_Store/AuthStore';
import { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';

const CodingSpace = () => {
  const [mic, setMic] = useState(false);
  const [video, setVideo] = useState(false);
  const [box, setBox] = useState(false);
  const [typedMsg, setTypedMsg] = useState("");
  const {socket} = useSocket();
  const { messages, addMessage, remoteUsers } = useSocketStore();
  const { getUserBySocketId } = useAuthStore();
  const [userNames, setUserNames] = useState<{[key: string]: string}>({});

  console.log(remoteUsers);

  useEffect(() => {
    if (!socket) return;

    initializeClient(socket, getUserBySocketId);
    socket.connect();

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

  const renderUserState = (user: IAgoraRTCRemoteUser) => {
    const isVideoEnabled = user.hasVideo;
    const isAudioEnabled = user.hasAudio;
    
    return (
      <div className="absolute bottom-2 right-2 flex gap-1">
        {!isAudioEnabled && (
          <div className="bg-red-500 rounded-full p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        {!isVideoEnabled && (
          <div className="bg-red-500 rounded-full p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
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
        handleMicToggle={handleMicToggle} 
        handleVideoToggle={handleVideoToggle} 
        setBox={setBox}
      />

      <div className="connectedUsers absolute top-10 left-1/2 -translate-x-1/2 flex gap-6 max-w-[80vw] flex-wrap justify-center">
        {remoteUsers.map((user) => (
          <div key={user.uid} className="relative">
            <div id={`user-container-${user.uid}`} className="video-player w-[10vw] h-[12vh] bg-black rounded-sm relative">
              {!user.hasVideo && (
                <div className="w-full h-full bg-gray-800 rounded-sm p-1 flex items-center justify-center text-white">
                  {userNames[user.uid]?.charAt(0) || '?'}
                </div>
              )}
              {renderUserState(user)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CodingSpace; 