import express from 'express';
import cors from 'cors';
import connectDB from './db/db.js';
import userRoutes from './routes/user.routes.js';
import cookieParser from 'cookie-parser';
import "dotenv/config";

const app = express();

connectDB();

app.use(cors({
    origin: [process.env.FRONTEND_URL as string, 'http://localhost:3000', 'https://hack-meet-five.vercel.app'],
    credentials: true,
    // secure: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Set-Cookie', 'Cookie']
}));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

app.use('/',userRoutes)

app.get('/',(req, res)=>{
    res.send("Hello World");
});

export default app;

