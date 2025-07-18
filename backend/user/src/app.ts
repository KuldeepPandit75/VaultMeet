import express from 'express';
import cors from 'cors';
import connectDB from './db/db.js';
import userRoutes from './routes/user.routes.js';
import cookieParser from 'cookie-parser';
import "dotenv/config";

const app = express();

connectDB();

app.use(cors({
    origin: [process.env.FRONTEND_URL, 'http://localhost:3000', 'https://hack-meet-nine.vercel.app', 'http://192.168.1.38:3000', 'https://www.vaultmeet.xyz', 'https://vaultmeet.xyz','https://api.vaultmeet.xyz'],
    credentials: true,
    // secure: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Set-Cookie', 'Cookie']
}));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

app.use((req, _, next) => {
    console.log(`[${req.method}] ${req.originalUrl}`);
    next();
  });

app.use('/',userRoutes)

app.get('/',(req, res)=>{
    res.send("Hello World");
});

export default app;

