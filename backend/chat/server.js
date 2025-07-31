import http from 'http';
import "dotenv/config";
import { Server } from "socket.io";
import handleChatSocketEvents from './controllers/chatSocketController.js';
import socketAuthMiddleware from './middlewares/socketAuth.middleware.js';

const PORT = process.env.CHAT_PORT || 4003;

const server = http.createServer(); // no Express, pure socket server

server.listen(PORT, () => {
    console.log(`Chat socket server is running on port ${PORT}`);
});

const io = new Server(server, {
    cors: {
        origin: [process.env.FRONTEND_URL, 'http://localhost:3000', 'https://hack-meet-nine.vercel.app', 'http://192.168.1.38:3000', 'https://www.vaultmeet.xyz', 'https://vaultmeet.xyz', 'https://api.vaultmeet.xyz'],
        methods: ["GET", "POST"]
    }
});

// Apply socket authentication middleware
io.use(socketAuthMiddleware);

handleChatSocketEvents(io);
