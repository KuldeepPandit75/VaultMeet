"use client";
import useAuthStore from '@/Zustand_Store/AuthStore';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const {user, updateSocketId} = useAuthStore();

  const path = usePathname();

  useEffect(() => {
    if (user && socket?.id && socket.connected) {
      updateSocketId(socket.id, user._id);
      socket.emit("registerPlayer", { userId: user?._id });
    }
  }, [user,socket?.id]);

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000', {
      autoConnect: false,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log("connected to socket");
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    console.log(path.includes('coding-space') || path.includes('event-space'), socket);
    if(socket && !path.includes('coding-space') && !path.includes('event-space')){
      socket.disconnect();
    }
  }, [socket, path]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}; 