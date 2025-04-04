import io from 'socket.io-client';

let socket = null;

export const getSocket = () => {
    const API_URL = import.meta.env.VITE_BACKEND_URL;

    if (!socket) {
        socket = io(API_URL, {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        socket.on('connect', () => console.log('Socket connected:', socket.id));
        socket.on('disconnect', () => console.log('Socket disconnected'));
    }
    return socket;
};
