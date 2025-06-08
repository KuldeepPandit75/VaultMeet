import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import { connectDB } from './db/db.js';
import userRoutes from './routes/user.routes.js';
import cookieParser from 'cookie-parser';
const app = express();
connectDB();
app.use(cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'https://hack-meet-five.vercel.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/', userRoutes);
app.get('/', (req, res) => {
    res.send("Hello World");
});
export default app;
