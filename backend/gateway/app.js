import express from 'express';
import expressProxy from 'express-http-proxy';
import "dotenv/config";
import cors from 'cors';
import cookieParser from 'cookie-parser';
const app = express();

app.use(cors({
    origin: [process.env.FRONTEND_URL, 'https://hack-meet-nine.vercel.app'],
    credentials: true,
    // secure: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Set-Cookie', 'Cookie']
}));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

app.use('/user', expressProxy(process.env.USER_SERVICE_URL));
app.use('/event', expressProxy(process.env.EVENT_SERVICE_URL));

export default app;