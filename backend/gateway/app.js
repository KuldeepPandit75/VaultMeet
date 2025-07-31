import express from 'express';
import expressProxy from 'express-http-proxy';
import "dotenv/config";
import cors from 'cors';
import cookieParser from 'cookie-parser';
const app = express();

app.use(cors({
    origin: [process.env.FRONTEND_URL, 'http://localhost:3000', 'https://hack-meet-nine.vercel.app', 'http://192.168.1.38:3000', 'https://www.vaultmeet.xyz', 'https://vaultmeet.xyz', 'https://api.vaultmeet.xyz'],
    credentials: true,
    // secure: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Set-Cookie', 'Cookie']
}));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

app.use('/user', expressProxy(process.env.USER_SERVICE_URL, {limit: '5mb'}));
app.use('/event', expressProxy(process.env.EVENT_SERVICE_URL, {limit: '5mb'}));

// Chat routes - proxy HTTP requests to chat service
app.use('/chat', expressProxy(process.env.CHAT_SERVICE_URL, {limit: '5mb'}));

export default app;