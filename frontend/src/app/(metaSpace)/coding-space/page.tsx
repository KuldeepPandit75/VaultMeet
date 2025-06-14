'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useMessageStore, Message } from '@/Zustand_Store/MsgStore';
import { ChatBox } from '@/components/Game/ChatBox';
import { ControlBar } from '@/components/Game/ControlBar';
import  {setupWebRTC}  from '@/components/Game/webRtc';
const PhaserGame = dynamic(() => import('@/components/Game/PhaserGame'), { ssr: false });

const CodingSpace = () => {
  const [mic, setMic] = useState(false);
  const [video, setVideo] = useState(false);
  const [box, setBox] = useState(false);
  const [typedMsg, setTypedMsg] = useState("");
  const {socket} = useSocket();
  const { messages, addMessage } = useMessageStore();

  useEffect(() => {
    if (!socket) return;

    setupWebRTC(socket);

    socket.connect();

    console.log(socket)

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

  const handleSentMsg = () => {
    if (!typedMsg.trim() || !socket || !socket.id) return;

    // Emit the message to the server using the correct event name
    socket.emit('sendMsg', {
      message: typedMsg
    });
    
    // Add message to local store
    const newMessage: Message = {
      message: typedMsg,
      senderId: socket.id,
      userId: socket.id,
      timestamp: Date.now(),
    };
    addMessage(newMessage);
    
    // Clear the input
    setTypedMsg('');
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
      <ControlBar mic={mic} video={video} setMic={setMic} setVideo={setVideo} setBox={setBox}/>
      
      <video
        className="video-player absolute w-[10vw] h-[12vh] bg-black top-10 left-[50%] -translate-x-[50%] rounded-sm hidden"
        id="user-2"
        autoPlay
        playsInline
      ></video>
    </div>
  );
};

export default CodingSpace; 