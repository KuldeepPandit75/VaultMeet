import http from 'http';
import app from './app.js';
import "dotenv/config";
import { Server } from "socket.io";
import handleSocketEvents from './controllers/socketController.js';


const port = process.env.PORT || 4000;

const server = http.createServer(app);

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

handleSocketEvents(io);