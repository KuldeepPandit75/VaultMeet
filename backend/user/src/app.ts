const dotenv = require('dotenv');
dotenv.config();
import express from 'express';
const cors=require('cors');
const app=express();
const connectDB=require('./db/db');
const userRoutes=require('./routes/user.routes');
const cookieParser=require('cookie-parser');

connectDB();

app.use(cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'https://hack-meet-five.vercel.app'],
    credentials: true,
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

