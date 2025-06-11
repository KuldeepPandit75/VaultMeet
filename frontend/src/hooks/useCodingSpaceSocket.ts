import { useEffect } from 'react';
import { useSocket } from '@/context/SocketContext';
import { usePathname } from 'next/navigation';

export const useCodingSpaceSocket = () => {
  const { socket, isConnected } = useSocket();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/coding-space') {
      socket?.connect();
    } else {
      socket?.disconnect();
    }

    return () => {
      socket?.disconnect();
    };
  }, [pathname, socket]);

  return { socket, isConnected };
}; 