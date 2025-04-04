import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
    const API_URL = import.meta.env.VITE_BACKEND_URL as string;

    if (!socket) {
        socket = io(API_URL, {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => console.log('Socket connected:', socket?.id));
        socket.on('disconnect', () => console.log('Socket disconnected'));
    }

    return socket;
};
