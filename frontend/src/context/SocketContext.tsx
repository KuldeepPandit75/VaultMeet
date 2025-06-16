"use client";
import useAuthStore from '@/Zustand_Store/AuthStore';
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
  const {user, updateSocketId, getUserBySocketId} = useAuthStore();

  useEffect(() => {
    if(user && socket?.id){
      updateSocketId(socket.id, user._id);
      console.log('user found');
      setTimeout(() => {
        getUserBySocketId(socket.id || '').then((user) => {
          console.log(user);
        });
      }, 2000);

    }
  }, [user,socket?.id]);

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000', {
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

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}; 