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
      transports: ['websocket', 'polling'], // Ensure websocket is preferred
      timeout: 20000, // Increase timeout for production
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log("Connected to socket server:", socketInstance.id);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log("Disconnected from socket server");
    });

    socketInstance.on('connect_error', (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log("Socket reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    console.log("Current path:", path, "Socket connected:", isConnected);
    
    // Connect socket for specific pages that need it
    const needsSocket = path.includes('coding-space') || 
                       path.includes('event-space') || 
                       path.includes('test') ||
                       path.includes('whiteboard');
    
    if (socket) {
      if (needsSocket && !socket.connected) {
        console.log("Connecting socket for path:", path);
        socket.connect();
      } else if (!needsSocket && socket.connected) {
        console.log("Disconnecting socket for path:", path);
        socket.disconnect();
      }
    }
  }, [socket, path, isConnected]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}; 